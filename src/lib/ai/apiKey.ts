/**
 * Safe, zero-dependency Gemini API key resolver.
 * Works seamlessly in client Vite (import.meta.env) and Node test runner (process.env).
 */

import { API_KEYS } from '../../config/config';

export function getGeminiApiKey(): string | null {
  // 1. Direct environment variable (Vite or Node process)
  const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : undefined;
  const procEnv = typeof process !== 'undefined' && process.env ? process.env.VITE_GEMINI_API_KEY : undefined;
  const envKey = (metaEnv || procEnv || '').trim();
  if (envKey) return envKey;

  // 2. Config JSON keys
  try {
    const keys = API_KEYS || {};
    if (keys.google?.apiKey) return keys.google.apiKey;
    if (keys.gemini?.apiKey) return keys.gemini.apiKey;
    if (keys.openrouter?.apiKey && keys.openrouter.apiKey.startsWith('AIzaSy')) {
      return keys.openrouter.apiKey;
    }
  } catch {
    // Ignore error
  }

  return null;
}
