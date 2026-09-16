/**
 * Layer 2 — Pinned Model Call Wrapper (Phase 13)
 * Dispatches API requests against the single pinned Gemini model for the requested capability.
 * Enforces per-request timeout, strict error classification, single-attempt logging,
 * and guaranteed honest failure reporting without fake content.
 */

import { AICapability, reportAiFailure } from './telemetry';
import { getPinnedModel } from './modelRegistry';
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

  if (status && status >= 500 && status <= 504) {
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
 * Section 2 Single Pinned Model Executor:
 * Makes exactly ONE real call to the pinned model for the requested capability.
 * If it fails, logs clearly and returns an honest failure immediately — no cycling through alternates.
 * Never substitutes fake or static content.
 */
export async function callWithFallback(
  capability: AICapability,
  requestPayload: ResilientRequestPayload,
  options?: ResilientCallOptions
): Promise<ModelCallResult<string>> {
  const model = getPinnedModel(capability);
  const timeoutMs = options?.perModelTimeoutMs ?? options?.totalTimeBudgetMs ?? 25000;

  try {
    const result = await executeModelRequest(model, requestPayload, timeoutMs);
    return {
      success: true,
      data: result.text,
      modelUsed: model,
    };
  } catch (err: any) {
    const classified: ClassifiedError = err.classified || classifyError(err.status ?? null, err.message || '');
    const errorMessage = classified.message || err.message || 'AI request failed.';

    // Single clear log line for the attempt
    console.warn(`[AI Call] ${model} failed: ${errorMessage}`);
    reportAiFailure(capability, model, errorMessage);

    // Section 0 Core Principle: Return explicit failure immediately, NEVER substitute fake content
    return {
      success: false,
      error: errorMessage,
      attemptedModels: [model],
      errorType: classified.category,
    };
  }
}
