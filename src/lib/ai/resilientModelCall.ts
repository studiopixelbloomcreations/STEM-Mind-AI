/**
 * Layer 2 — Resilient Call Wrapper (Phase 10)
 * Executes API requests against the Model Registry's ordered model chain.
 * Enforces wall-clock time budget, bounded retries, strict error classification,
 * structured failover telemetry, and guaranteed honest failure reporting without fake content.
 */

import { AICapability, reportModelFailover, reportTotalChainExhaustion } from './telemetry';
import { getModelChain, invalidateModelRegistryCache } from './modelRegistry';
import { getGeminiApiKey } from './apiKey';

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
  // For TTS
  text?: string;
  voice?: string;
}

export interface ResilientCallOptions {
  totalTimeBudgetMs?: number;
  perModelTimeoutMs?: number;
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

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
  isRetryable: boolean;
  category: ErrorCategory;
  message: string;
}

/**
 * Section 3.3 Error Classification Table:
 * 404 (model deprecated/not found) -> Retryable (yes)
 * 429 (quota/rate limit)          -> Retryable (yes)
 * 500, 502, 503, 504 (server)    -> Retryable (yes)
 * Timeout / network abort         -> Retryable (yes)
 * 400 (malformed request)         -> Retryable (no) - fix caller bug
 * 401, 403 (auth/key error)       -> Retryable (no) - fix configuration
 * Safety refusal                  -> Retryable (no) - legitimate refusal
 */
function classifyError(status: number | null, rawMessage: string): ClassifiedError {
  const msgLower = (rawMessage || '').toLowerCase();

  if (status === 404 || msgLower.includes('not found') || msgLower.includes('no longer available') || msgLower.includes('deprecated')) {
    return { isRetryable: true, category: 'DEPRECATED_404', message: rawMessage };
  }

  if (status === 429 || msgLower.includes('quota') || msgLower.includes('rate limit') || msgLower.includes('resource_exhausted')) {
    return { isRetryable: true, category: 'QUOTA_429', message: rawMessage };
  }

  if (status && status >= 500 && status <= 504) {
    return { isRetryable: true, category: 'SERVER_5XX', message: rawMessage };
  }

  if (msgLower.includes('timeout') || msgLower.includes('aborted') || msgLower.includes('network') || msgLower.includes('econnreset')) {
    return { isRetryable: true, category: 'TIMEOUT', message: rawMessage };
  }

  if (status === 400) {
    return { isRetryable: false, category: 'BAD_REQUEST_400', message: rawMessage };
  }

  if (status === 401 || status === 403 || msgLower.includes('permission') || msgLower.includes('api key not valid')) {
    return { isRetryable: false, category: 'AUTH_ERROR_401', message: rawMessage };
  }

  if (msgLower.includes('safety') || msgLower.includes('blocked') || msgLower.includes('harm_category')) {
    return { isRetryable: false, category: 'SAFETY_REFUSAL', message: rawMessage };
  }

  return { isRetryable: true, category: 'UNKNOWN', message: rawMessage };
}

/**
 * Normalizes user messages into Gemini API parts format.
 */
function toGeminiParts(message: any): any[] {
  if (Array.isArray(message.parts)) return message.parts;
  return [{ text: String(message.content || message.text || '') }];
}

/**
 * Performs a single request to Gemini generateContent for a specified model.
 */
async function executeModelRequest(
  model: string,
  payload: ResilientRequestPayload,
  timeoutMs: number,
  apiKey: string
): Promise<{ text: string; rawData: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: any = {
      generationConfig: {
        temperature: payload.temperature ?? 0.7,
        ...(payload.generationConfig || {}),
      },
    };

    if (payload.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: payload.systemInstruction }],
      };
    }

    if (payload.responseFormat?.type === 'json_object') {
      body.generationConfig.responseMimeType = 'application/json';
    }

    if (payload.contents && Array.isArray(payload.contents)) {
      body.contents = payload.contents;
    } else if (payload.messages && Array.isArray(payload.messages)) {
      body.contents = payload.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: toGeminiParts(m),
      }));
    } else if (payload.prompt) {
      body.contents = [
        {
          role: 'user',
          parts: [{ text: payload.prompt }],
        },
      ];
    } else {
      throw new Error('Payload must contain contents, messages, or prompt.');
    }

    const cleanModelName = model.replace(/^models\//, '');
    const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(cleanModelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const classified = classifyError(response.status, errorText);
      const err: any = new Error(classified.message);
      err.status = response.status;
      err.classified = classified;
      throw err;
    }

    const data = await response.json();

    // Check for safety finishReason
    const candidate = data?.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
      const err: any = new Error('Content generation was blocked by safety filters.');
      err.status = 400;
      err.classified = { isRetryable: false, category: 'SAFETY_REFUSAL', message: err.message };
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
    if (err.name === 'AbortError') {
      const classified: ClassifiedError = {
        isRetryable: true,
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
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Section 3.1 & 3.2 Core Function:
 * Dispatches a capability request against the Model Registry's ordered chain.
 * Retries transient failures across models, halts on non-retryable bugs,
 * respects time budgets, and reports telemetry.
 */
export async function callWithFallback(
  capability: AICapability,
  requestPayload: ResilientRequestPayload,
  options?: ResilientCallOptions
): Promise<ModelCallResult<string>> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY.',
      attemptedModels: [],
      errorType: 'AUTH_ERROR_401',
    };
  }

  const chain = await getModelChain(capability);
  if (!chain || chain.length === 0) {
    return {
      success: false,
      error: `No candidate models available for capability: ${capability}`,
      attemptedModels: [],
      errorType: 'NO_MODELS_AVAILABLE',
    };
  }

  const totalBudgetMs = options?.totalTimeBudgetMs ?? 30000;
  const perModelTimeoutMs = options?.perModelTimeoutMs ?? 10000;
  const startTime = Date.now();
  const attemptedModels: string[] = [];
  let lastError: any = null;

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    const elapsedTime = Date.now() - startTime;
    const remainingTime = totalBudgetMs - elapsedTime;

    // Check if total budget is exhausted
    if (remainingTime <= 1000) {
      console.warn(`[AI Failover] Total time budget exhausted (${elapsedTime}ms) before trying model ${model}`);
      break;
    }

    const currentTimeout = Math.min(perModelTimeoutMs, remainingTime);
    attemptedModels.push(model);

    try {
      const result = await executeModelRequest(model, requestPayload, currentTimeout, apiKey);
      return {
        success: true,
        data: result.text,
        modelUsed: model,
      };
    } catch (err: any) {
      lastError = err;
      const classified: ClassifiedError = err.classified || classifyError(err.status ?? null, err.message || '');

      // Non-retryable errors stop failover immediately
      if (!classified.isRetryable) {
        console.error(`[AI Non-Retryable Error] Model ${model} failed with non-retryable error [${classified.category}]: ${classified.message}`);
        return {
          success: false,
          error: classified.message,
          attemptedModels,
          errorType: classified.category,
        };
      }

      // Retryable error: report failover telemetry and continue to next model
      const nextCandidate = chain[i + 1] || null;
      reportModelFailover({
        capability,
        failedModel: model,
        nextModel: nextCandidate,
        errorType: (classified.category as any) || 'UNKNOWN',
        errorMessage: classified.message,
        attemptIndex: attemptedModels.length,
        timestamp: Date.now(),
      });
    }
  }

  // All models in chain were exhausted without a successful response
  const totalDuration = Date.now() - startTime;
  const finalErrorMessage = lastError?.classified?.message || lastError?.message || 'All candidate models failed.';

  // Invalidate registry cache so next attempt refreshes the model list
  invalidateModelRegistryCache();

  // Emit high-severity total chain exhaustion event
  reportTotalChainExhaustion({
    capability,
    attemptedModels,
    durationMs: totalDuration,
    finalError: finalErrorMessage,
    timestamp: Date.now(),
  });

  // Section 0 Core Principle: Return explicit failure, NEVER substitute fake or canned mock content
  return {
    success: false,
    error: finalErrorMessage,
    attemptedModels,
    errorType: 'TOTAL_CHAIN_EXHAUSTION',
  };
}
