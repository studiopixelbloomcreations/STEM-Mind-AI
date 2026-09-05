import { getModelChain } from '../lib/ai/modelRegistry';
import { getGeminiApiKey } from '../lib/ai/apiKey';

export { getGeminiApiKey };

export const LIVE_API_ENDPOINT =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

/**
 * Layer 1 Model Registry live-audio models.
 * Automatically fails over across verified available models.
 */
export const getLiveAudioModels = () => {
  const chain = getModelChain('liveVoice');
  return chain.map((m) => (m.startsWith('models/') ? m : `models/${m}`));
};

export const getLiveTranscribeModel = () => {
  const chain = getModelChain('transcription');
  const top = chain[0] || 'gemini-3.5-transcribe-live-preview';
  return top.startsWith('models/') ? top : `models/${top}`;
};

export const GEMINI_LIVE_AUDIO_MODELS = [
  'models/gemini-3.1-flash-live',
  'models/gemini-2.5-flash-native-audio-preview-12-2025',
  'models/gemini-2.5-flash-native-audio-preview-09-2025',
];
export const GEMINI_LIVE_TEXT_MODELS = GEMINI_LIVE_AUDIO_MODELS;
export const GEMINI_LIVE_TRANSCRIBE_MODEL = 'models/gemini-3.5-transcribe-live-preview';

export const DEFAULT_LIVE_VOICE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_TTS_VOICE) || 'Kore';
