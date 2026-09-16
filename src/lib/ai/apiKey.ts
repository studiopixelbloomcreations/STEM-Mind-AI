/**
 * API Key Configuration (Phase 11 — A2)
 *
 * Per Phase 11 Section A2: Gemini API keys are never exposed to the client bundle.
 * All client AI calls are proxied through Supabase Edge Functions (`council-proxy`),
 * which holds the key securely on the server.
 */

export function getGeminiApiKey(): string | null {
  // In server or local Node test environments only (never client bundle)
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return null;
}
