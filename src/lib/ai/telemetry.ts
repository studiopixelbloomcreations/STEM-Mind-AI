/**
 * Telemetry system for NexLearn's Single Pinned Model Architecture (Phase 13).
 * Provides clean diagnostic logging for single-attempt AI requests and failure notifications.
 */

export type AICapability = 'textGeneration' | 'liveVoice' | 'tts' | 'transcription' | 'vision';

export interface AiFailureTelemetry {
  capability: AICapability;
  model: string;
  errorMessage: string;
  timestamp: number;
}

export interface ModelFailoverTelemetry {
  capability: AICapability;
  failedModel: string;
  nextModel: string | null;
  errorType: string;
  errorMessage: string;
  attemptIndex: number;
  timestamp: number;
}

export interface TotalExhaustionTelemetry {
  capability: AICapability;
  attemptedModels: string[];
  durationMs: number;
  finalError: string;
  timestamp: number;
}

const FAILURE_EVENT_NAME = 'ai-failure-event';
const FAILOVER_EVENT_NAME = 'ai-model-failover-event';
const EXHAUSTION_EVENT_NAME = 'ai-total-chain-exhaustion-alert';

/**
 * Emits a single, clear log line when an AI request fails.
 */
export function reportAiFailure(capability: AICapability, model: string, errorMessage: string): void {
  console.error(`[AI FAILURE] ${capability} request failed (model: ${model}): ${errorMessage}`);

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent<AiFailureTelemetry>(FAILURE_EVENT_NAME, {
          detail: { capability, model, errorMessage, timestamp: Date.now() },
        })
      );
    } catch {
      // Ignore event dispatch errors in restricted environments
    }
  }
}

/**
 * Compatibility helper for legacy failover listeners.
 */
export function reportModelFailover(data: ModelFailoverTelemetry): void {
  console.warn(`[AI Call] ${data.failedModel} failed: ${data.errorMessage}`);
}

/**
 * Compatibility helper for exhaustion listeners.
 */
export function reportTotalChainExhaustion(data: TotalExhaustionTelemetry): void {
  reportAiFailure(data.capability, data.attemptedModels[0] || 'unknown', data.finalError);
}

/**
 * Subscribes to AI failure events.
 */
export function onAiFailure(callback: (data: AiFailureTelemetry) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<AiFailureTelemetry>;
    if (custom.detail) callback(custom.detail);
  };
  window.addEventListener(FAILURE_EVENT_NAME, handler);
  return () => window.removeEventListener(FAILURE_EVENT_NAME, handler);
}

export const onModelFailover = onAiFailure as any;
export const onTotalChainExhaustion = onAiFailure as any;
