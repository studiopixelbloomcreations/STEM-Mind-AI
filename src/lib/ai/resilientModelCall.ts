/**
 * Layer 2 — Bounded Current-Generation Model Call Wrapper (Phase 14)
 * Dispatches API requests against the bounded chain of current Gemini models.
 * For textGeneration: 4-model chain (3.8-flash -> 3.7-flash -> 3.6-flash -> 3.5-flash).
 * For other capabilities: pinned single current model.
 * Enforces per-model timeout, total chain budget, strict retryable classification,
 * and guaranteed honest failure reporting without fake content.
 */

import { AICapability, reportAiFailure } from './telemetry';
import { getPinnedModel, getModelChain } from './modelRegistry';
import { proxyGenerateContent } from './proxyClient';

export interface ModelCallSuccess<T = any> {
  success: true;
  data: T;
  modelUsed: string;
}

export interface ModelCallFailure {
  success: false;
  error: string;
  attemptedModels: string[];
  errorType: string;
}

export type ModelCallResult<T = any> = ModelCallSuccess<T> | ModelCallFailure;

export interface ResilientRequestPayload {
  agentName?: string;
  systemInstruction?: string;
  messages?: Array<{ role: string; content?: string; parts?: any[] }>;
  contents?: any[];
  prompt?: string;
  generationConfig?: any;
  responseFormat?: { type: 'json_object' } | null;
  temperature?: number;
  text?: string;
  voice?: string;
}

export interface ResilientCallOptions {
  totalTimeBudgetMs?: number;
  perModelTimeoutMs?: number;
}

type ErrorCategory =
  | 'DEPRECATED_404'
  | 'QUOTA_429'
  | 'SERVER_5XX'
  | 'TIMEOUT'
  | 'BAD_REQUEST_400'
  | 'AUTH_ERROR_401'
  | 'SAFETY_REFUSAL'
  | 'UNKNOWN';

interface ClassifiedError {
  category: ErrorCategory;
  message: string;
}

function classifyError(status: number | null, rawMessage: string): ClassifiedError {
  const msgLower = (rawMessage || '').toLowerCase();

  if (status === 404 || msgLower.includes('not found') || msgLower.includes('no longer available') || msgLower.includes('deprecated')) {
    return { category: 'DEPRECATED_404', message: rawMessage };
  }

  if (status === 429 || msgLower.includes('quota') || msgLower.includes('rate limit') || msgLower.includes('resource_exhausted')) {
    return { category: 'QUOTA_429', message: rawMessage };
  }

  if (
    (status && status >= 500 && status <= 504) ||
    msgLower.includes('high demand') ||
    msgLower.includes('spikes in demand') ||
    msgLower.includes('unavailable') ||
    msgLower.includes('service unavailable')
  ) {
    return { category: 'SERVER_5XX', message: rawMessage };
  }

  if (msgLower.includes('timeout') || msgLower.includes('aborted') || msgLower.includes('network') || msgLower.includes('econnreset')) {
    return { category: 'TIMEOUT', message: rawMessage };
  }

  if (status === 400) {
    return { category: 'BAD_REQUEST_400', message: rawMessage };
  }

  if (status === 401 || status === 403 || msgLower.includes('permission') || msgLower.includes('api key not valid')) {
    return { category: 'AUTH_ERROR_401', message: rawMessage };
  }

  return { category: 'UNKNOWN', message: rawMessage };
}

/**
 * Phase 14 Section 1.2: Determines whether an error warrants trying the next model in the chain.
 * True for transient capacity or model availability issues (503, 429, 504, 404).
 * False for payload bugs (400), auth errors (401/403), or safety refusals.
 */
function isRetryableModelError(category: ErrorCategory): boolean {
  return (
    category === 'SERVER_5XX' ||
    category === 'QUOTA_429' ||
    category === 'TIMEOUT' ||
    category === 'DEPRECATED_404'
  );
}

function toGeminiParts(message: { content?: string; parts?: any[] }): any[] {
  if (Array.isArray(message.parts) && message.parts.length > 0) {
    return message.parts;
  }
  return [{ text: String(message.content || '') }];
}

/**
 * Executes a single API request against the specified model via the server-side proxy.
 */
async function executeModelRequest(
  model: string,
  payload: ResilientRequestPayload,
  timeoutMs: number
): Promise<{ text: string; rawData: any }> {
  try {
    const generationConfig: Record<string, unknown> = {
      temperature: payload.temperature ?? 0.7,
      ...(payload.generationConfig || {}),
    };

    if (payload.responseFormat?.type === 'json_object') {
      generationConfig.responseMimeType = 'application/json';
    }

    let contents: any[];
    if (payload.contents && Array.isArray(payload.contents)) {
      contents = payload.contents;
    } else if (payload.messages && Array.isArray(payload.messages)) {
      contents = payload.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: toGeminiParts(m),
      }));
    } else if (payload.prompt) {
      contents = [
        {
          role: 'user',
          parts: [{ text: payload.prompt }],
        },
      ];
    } else {
      throw new Error('Payload must contain contents, messages, or prompt.');
    }

    const systemInstruction = payload.systemInstruction
      ? { parts: [{ text: payload.systemInstruction }] }
      : undefined;

    const data = await proxyGenerateContent(
      model,
      {
        contents,
        systemInstruction,
        generationConfig,
      },
      timeoutMs
    );

    const candidate = data?.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
      const err: any = new Error('Content generation was blocked by safety filters.');
      err.status = 400;
      err.classified = { category: 'SAFETY_REFUSAL', message: err.message };
      throw err;
    }

    const text = candidate?.content?.parts
      ?.map((p: any) => p.text || '')
      .join('')
      .trim();

    if (!text) {
      throw new Error(`Model ${model} returned an empty response.`);
    }

    return { text, rawData: data };
  } catch (err: any) {
    if (err.name === 'AbortError' || err.status === 504) {
      const classified: ClassifiedError = {
        category: 'TIMEOUT',
        message: `Request to model "${model}" timed out after ${timeoutMs}ms.`,
      };
      const timeoutErr: any = new Error(classified.message);
      timeoutErr.classified = classified;
      throw timeoutErr;
    }
    if (!err.classified) {
      err.classified = classifyError(err.status ?? null, err.message || 'Unknown network error');
    }
    throw err;
  }
}

/**
 * Bounded Current-Generation Model Executor (Phase 14):
 * Dispatches requests across the bounded chain for the capability:
 * - For textGeneration: 4-model chain (gemini-3.8-flash -> 3.7-flash -> 3.6-flash -> 3.5-flash)
 * - For other capabilities: single pinned model
 *
 * Failover occurs ONLY for retryable availability errors (503 high demand, 429 quota, 504/timeout, 404).
 * Halts immediately without failover for non-retryable errors (400, 401, 403, SAFETY).
 * Caps total time budget and per-attempt timeout.
 * Never substitutes fake or static content.
 */
export async function callWithFallback(
  capability: AICapability,
  requestPayload: ResilientRequestPayload,
  options?: ResilientCallOptions
): Promise<ModelCallResult<string>> {
  const chain = getModelChain(capability);
  const totalBudgetMs = options?.totalTimeBudgetMs ?? 20000;
  const perModelTimeoutMs = options?.perModelTimeoutMs ?? 6000;
  const startTime = Date.now();
  const deadline = startTime + totalBudgetMs;

  const attemptedModels: string[] = [];
  let lastError = 'AI request failed.';
  let lastCategory: ErrorCategory = 'UNKNOWN';

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    const now = Date.now();
    const remainingBudget = deadline - now;

    if (remainingBudget < 500) {
      const budgetErr = `Total time budget (${totalBudgetMs}ms) exhausted before attempting ${model}.`;
      console.warn(`[AI Call] Chain aborted: ${budgetErr}`);
      lastError = budgetErr;
      lastCategory = 'TIMEOUT';
      break;
    }

    const timeoutMs = Math.min(perModelTimeoutMs, remainingBudget);
    attemptedModels.push(model);

    try {
      const result = await executeModelRequest(model, requestPayload, timeoutMs);
      return {
        success: true,
        data: result.text,
        modelUsed: model,
      };
    } catch (err: any) {
      const classified: ClassifiedError = err.classified || classifyError(err.status ?? null, err.message || '');
      lastError = classified.message || err.message || 'AI request failed.';
      lastCategory = classified.category;

      reportAiFailure(capability, model, lastError);

      const isRetryable = isRetryableModelError(classified.category);
      const hasNextModel = i < chain.length - 1;

      if (!isRetryable) {
        console.warn(`[AI Call] ${model} failed with non-retryable error (${classified.category}): ${lastError}`);
        break;
      }

      if (hasNextModel) {
        const nextModel = chain[i + 1];
        console.warn(`[AI Call] ${model} failed (${lastError}), trying ${nextModel}...`);
      } else {
        console.warn(`[AI Call] ${model} failed: ${lastError}`);
      }
    }
  }

  // Chain exhausted or halted by non-retryable error
  if (attemptedModels.length > 1) {
    console.error(`[AI FAILURE] ${capability} exhausted all ${attemptedModels.length} current models: ${lastError}`);
  } else {
    console.error(`[AI FAILURE] ${capability} request failed (model: ${attemptedModels[0] || 'unknown'}): ${lastError}`);
  }

  // Absolute zero-fake-content rule: Return explicit failure, never substitute fake static content
  return {
    success: false,
    error: lastError,
    attemptedModels,
    errorType: lastCategory,
  };
}
