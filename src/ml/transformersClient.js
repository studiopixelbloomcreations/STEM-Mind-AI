/**
 * Client-side Transformers.js service layer.
 * Delegates pipeline execution to the background Web Worker via TransformersService.
 * Harmony NLP remains separate — this module handles vision and speech only.
 */

import { transformersService } from './TransformersService.js';
import { MODELS, TTS_AUDIO_GAIN } from './transformersModels.js';

const progressListeners = new Set();

// Register global progress updates from the service wrapper
transformersService.onProgress((detail) => {
  progressListeners.forEach((listener) => {
    try {
      listener(detail);
    } catch {
      // ignore
    }
  });
});

export const onModelLoadProgress = (listener) => {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
};

export const preloadSpeechModels = () => {
  transformersService.preloadModel('text-to-speech', MODELS.tts, { useGPU: true }).catch(() => undefined);
};

/** OCR + caption only — safe for STEM Live mount (no object-detection weights). */
export const preloadVisionModels = () => {
  // Disabled client-side vision model preloading
};

const toDataUrl = (input) => {
  if (typeof input === 'string') {
    if (input.startsWith('data:')) return input;
    return `data:image/jpeg;base64,${input}`;
  }
  if (input instanceof Blob) return URL.createObjectURL(input);
  if (input instanceof File) return URL.createObjectURL(input);
  throw new Error('Unsupported image input.');
};

const revokeIfBlobUrl = (url, input) => {
  if (input instanceof Blob || input instanceof File) {
    URL.revokeObjectURL(url);
  }
};

export const runOcr = async (imageInput) => {
  return { text: '', provider: 'stub' };
};

export const runImageCaption = async (imageInput) => {
  return { caption: '', provider: 'stub' };
};

export const buildClientVisionAnalysis = async ({
  imageInput,
  subject = null,
  topic = null,
}) => {
  return {
    extractedText: '',
    confidence: 0,
    warnings: ['Client-side vision models disabled.'],
    structuredSteps: [
      {
        title: 'Image Submitted',
        explanation: 'The worksheet image has been uploaded for server-side processing.',
      }
    ],
    summary: 'Client-side OCR disabled.',
    caption: '',
    detectedObjects: [],
    provider: 'stub',
  };
};

/**
 * Capture frame from live STEM webcam stream, perform image captioning + OCR + object detection.
 */
export const analyzeLiveFrame = async (base64Data, mimeType = 'image/jpeg') => {
  return {
    caption: '',
    extractedText: '',
    objects: [],
    warnings: ['Client-side live vision models disabled.'],
    capturedAt: new Date().toISOString(),
  };
};

export const synthesizeSpeech = async (text) => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  const result = await transformersService.synthesizeSpeech(trimmed.slice(0, 500), MODELS.tts, { useGPU: true });

  let audio = result?.audio;
  if (!audio?.length) throw new Error('TTS produced empty audio.');

  const sampling_rate = result?.sampling_rate || 16000;
  const boosted = new Float32Array(audio.length);
  for (let i = 0; i < audio.length; i += 1) {
    boosted[i] = Math.max(-1, Math.min(1, audio[i] * TTS_AUDIO_GAIN));
  }
  return { audio: boosted, sampling_rate };
};

export const playSpeechSamples = async (audio, samplingRate, { onStart, onEnd } = {}) => {
  const source = await transformersService.playAudioBuffer(audio, samplingRate, onEnd);
  onStart?.();
  return { source, audioCtx: transformersService.audioContext };
};

export const transcribeAudioBlob = async (blob) => {
  return '';
};

export const isWhisperReady = async () => {
  return false;
};

export default {
  onModelLoadProgress,
  preloadSpeechModels,
  preloadVisionModels,
  runOcr,
  runImageCaption,
  buildClientVisionAnalysis,
  analyzeLiveFrame,
  synthesizeSpeech,
  playSpeechSamples,
  transcribeAudioBlob,
  isWhisperReady,
};
