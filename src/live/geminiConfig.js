import { API_KEYS } from '../config/config';

export const LIVE_API_ENDPOINT =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

/** Native-audio first — STEM Live + narration. */
export const GEMINI_LIVE_AUDIO_MODELS = [
  'models/gemini-2.5-flash-native-audio-preview-12-2025',
  'models/gemini-live-2.5-flash-preview',
  'models/gemini-2.0-flash-live-001',
];

/** Text-capable Live models — Harmony council, quizzes, vision JSON. */
export const GEMINI_LIVE_TEXT_MODELS = [
  'models/gemini-2.0-flash-live-001',
  'models/gemini-live-2.5-flash-preview',
  'models/gemini-2.5-flash-native-audio-preview-12-2025',
];

export const DEFAULT_LIVE_VOICE = import.meta.env.VITE_GEMINI_TTS_VOICE || 'Kore';

export const getGeminiApiKey = () => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (envKey) return envKey;

  const keys = API_KEYS || {};
  if (keys.google?.apiKey) return keys.google.apiKey;
  if (keys.gemini?.apiKey) return keys.gemini.apiKey;
  if (keys.openrouter?.apiKey && keys.openrouter.apiKey.startsWith('AIzaSy')) {
    return keys.openrouter.apiKey;
  }
  return null;
};
