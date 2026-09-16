/**
 * Layer 1 — Centralized Pinned Model Registry (Phase 13)
 * Defines the single, fixed, current Gemini model per capability.
 * No cascading lists, no failover loops, no dynamic models.list cross-referencing.
 *
 * Future model upgrades are managed centrally in this single file.
 */

import { AICapability } from './telemetry';

/**
 * Pinned model per capability:
 * - textGeneration: gemini-3.8-flash (Google's current stable Flash-tier model, GA Sept 2, 2026)
 * - vision: gemini-3.8-flash (Unified multimodal Flash model natively processes images/frames)
 * - liveVoice: gemini-3.1-flash-live (Gemini Multimodal Live WebSocket model)
 * - tts: gemini-3.1-flash-tts (Gemini dedicated speech synthesis model)
 * - transcription: gemini-3.5-transcribe-live (Gemini real-time speech-to-text model)
 */
export const PINNED_MODELS: Record<AICapability, string> = {
  textGeneration: 'gemini-3.8-flash',
  vision: 'gemini-3.8-flash',
  liveVoice: 'gemini-3.1-flash-live',
  tts: 'gemini-3.1-flash-tts',
  transcription: 'gemini-3.5-transcribe-live',
};

/**
 * Returns the single pinned model for the specified capability.
 */
export function getPinnedModel(capability: AICapability): string {
  return PINNED_MODELS[capability] || PINNED_MODELS.textGeneration;
}

/**
 * Returns a 1-element array containing the pinned model.
 * Maintained for backwards-compatible call sites.
 */
export function getModelChain(capability: AICapability): string[] {
  return [getPinnedModel(capability)];
}

/**
 * Backwards compatibility stub (cache refresh is no longer needed with pinned models).
 */
export async function refreshModelRegistry(): Promise<void> {}

/**
 * Backwards compatibility stub.
 */
export function invalidateModelRegistryCache(): void {}

/**
 * Backwards compatibility stub.
 */
export async function fetchLiveAvailableModels(): Promise<string[]> {
  return Object.values(PINNED_MODELS);
}
