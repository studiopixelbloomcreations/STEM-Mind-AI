/**
 * Telemetry system for NexLearn's Resilient Multi-Model Failover Architecture (Phase 10).
 * Extends the Phase 8 diagnostic logging with structured events for single-model failovers
 * and high-severity total chain exhaustion notifications.
 */

export type AICapability = 'textGeneration' | 'liveVoice' | 'tts' | 'transcription' | 'vision';

export interface ModelFailoverTelemetry {
  capability: AICapability;
  failedModel: string;
  nextModel: string | null;
  errorType: 'DEPRECATED_404' | 'QUOTA_429' | 'SERVER_5XX' | 'TIMEOUT' | 'UNKNOWN';
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

const FAILOVER_EVENT_NAME = 'ai-model-failover-event';
const EXHAUSTION_EVENT_NAME = 'ai-total-chain-exhaustion-alert';

/**
 * Emits a structured telemetry event when an individual model fails and failover occurs.
 */
export function reportModelFailover(data: ModelFailoverTelemetry): void {
  const logMessage = `[MODEL FAILOVER] Capability "${data.capability}" | Model "${data.failedModel}" failed (${data.errorType}) -> Failing over to "${data.nextModel || 'NONE'}". Error: ${data.errorMessage}`;
  console.warn(logMessage);

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent<ModelFailoverTelemetry>(FAILOVER_EVENT_NAME, {
          detail: data,
        })
      );
    } catch {
      // Ignore event dispatch errors in restricted environments
    }
  }
}

/**
 * Emits a high-severity alert when ALL models in the capability chain are exhausted.
 * This indicates a system-level AI degradation that requires immediate operator attention.
 */
export function reportTotalChainExhaustion(data: TotalExhaustionTelemetry): void {
  const alertMessage = `🚨 [CRITICAL AI EXHAUSTION] All ${data.attemptedModels.length} models exhausted for capability "${data.capability}" after ${data.durationMs}ms. Attempted: [${data.attemptedModels.join(', ')}]. Final error: ${data.finalError}`;
  console.error(alertMessage);

 if (typeof window !== 'undefined') {
 try {
 window.dispatchEvent(
 new CustomEvent<TotalExhaustionTelemetry>(EXHAUSTION_EVENT_NAME, {
 detail: data,
 })
 );
 } catch {
 // Ignore event dispatch errors
 }
 }
}

/**
 * Subscribes to model failover events (for telemetry panels or dev toasts).
 */
export function onModelFailover(callback: (data: ModelFailoverTelemetry) => void): () => void {
 if (typeof window === 'undefined') return () => {};
 const handler = (e: Event) => {
 const custom = e as CustomEvent<ModelFailoverTelemetry>;
 if (custom.detail) callback(custom.detail);
 };
 window.addEventListener(FAILOVER_EVENT_NAME, handler);
 return () => window.removeEventListener(FAILOVER_EVENT_NAME, handler);
}

/**
 * Subscribes to total chain exhaustion alerts (for high-severity banners or incident monitoring).
 */
export function onTotalChainExhaustion(callback: (data: TotalExhaustionTelemetry) => void): () => void {
 if (typeof window === 'undefined') return () => {};
 const handler = (e: Event) => {
 const custom = e as CustomEvent<TotalExhaustionTelemetry>;
 if (custom.detail) callback(custom.detail);
 };
 window.addEventListener(EXHAUSTION_EVENT_NAME, handler);
 return () => window.removeEventListener(EXHAUSTION_EVENT_NAME, handler);
}
