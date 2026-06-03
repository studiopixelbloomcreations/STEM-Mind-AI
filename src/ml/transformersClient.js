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
  transformersService.preloadModel('image-to-text', MODELS.ocr, { useGPU: true }).catch(() => undefined);
  transformersService.preloadModel('image-to-text', MODELS.caption, { useGPU: true }).catch(() => undefined);
  // Also preload object detection for STEM Live mode
  transformersService.preloadModel('object-detection', 'Xenova/detr-resnet-50', { useGPU: true }).catch(() => undefined);
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
  const dataUrl = toDataUrl(imageInput);
  try {
    const results = await transformersService.imageToText(dataUrl, MODELS.ocr, { useGPU: true });
    const text = Array.isArray(results)
      ? results.map((r) => r?.generated_text || '').join('\n').trim()
      : String(results?.generated_text || results?.text || '').trim();
    return { text, provider: MODELS.ocr };
  } finally {
    revokeIfBlobUrl(dataUrl, imageInput);
  }
};

export const runImageCaption = async (imageInput) => {
  const dataUrl = toDataUrl(imageInput);
  try {
    const results = await transformersService.imageToText(dataUrl, MODELS.caption, { useGPU: true });
    const caption = Array.isArray(results)
      ? results.map((r) => r?.generated_text || '').join(' ').trim()
      : String(results?.generated_text || results?.text || '').trim();
    return { caption, provider: MODELS.caption };
  } finally {
    revokeIfBlobUrl(dataUrl, imageInput);
  }
};

const buildStructuredSteps = (text, context = {}) => {
  const trimmed = String(text || '').trim();
  const hasText = trimmed.length > 0;
  const lines = hasText ? trimmed.split('\n').map((l) => l.trim()).filter(Boolean) : [];
  if (!hasText) {
    return [
      {
        title: 'Improve Capture Quality',
        explanation: 'Retake the image with better lighting and keep all text in focus.',
      },
    ];
  }
  return [
    {
      title: 'Identify Problem',
      explanation: lines[0] || 'Review the first line of the worksheet.',
    },
    {
      title: 'Review Working',
      explanation: lines.slice(1, 4).join(' ') || 'Check intermediate steps in the image.',
    },
    {
      title: 'Teacher Guidance',
      explanation: `Verify calculations for ${context.topic || 'the selected topic'} and re-check units or signs.`,
    },
  ];
};

export const buildClientVisionAnalysis = async ({
  imageInput,
  subject = null,
  topic = null,
}) => {
  const context = { subject, topic };
  const warnings = [];

  let ocrText = '';
  let caption = '';

  try {
    const ocr = await runOcr(imageInput);
    ocrText = ocr.text;
  } catch (err) {
    warnings.push(`OCR failed: ${err?.message || 'unknown error'}`);
  }

  try {
    const cap = await runImageCaption(imageInput);
    caption = cap.caption;
  } catch (err) {
    warnings.push(`Caption failed: ${err?.message || 'unknown error'}`);
  }

  const hasText = ocrText.length > 0;
  const confidence = hasText ? Math.min(95, 55 + Math.min(ocrText.length / 8, 40)) : caption ? 45 : 20;
  const structuredSteps = buildStructuredSteps(ocrText, context);
  const summary = hasText
    ? `Detected worksheet text for ${subject || 'STEM'}. ${caption ? `Scene: ${caption}` : ''}`.trim()
    : caption
      ? `Visual scene: ${caption}. Text was unclear — try a sharper photo.`
      : 'Could not reliably read the image. Retake with stronger contrast.';

  return {
    extractedText: ocrText,
    confidence: Math.round(confidence),
    warnings,
    structuredSteps,
    summary,
    caption,
    detectedObjects: [],
    provider: 'transformers.js-client-worker',
  };
};

/**
 * Capture frame from live STEM webcam stream, perform image captioning + OCR + object detection.
 */
export const analyzeLiveFrame = async (base64Data, mimeType = 'image/jpeg') => {
  const dataUrl = `data:${mimeType};base64,${base64Data}`;
  const warnings = [];
  let caption = '';
  let ocrText = '';
  let objects = [];

  // 1. Run image captioning
  try {
    const cap = await runImageCaption(dataUrl);
    caption = cap.caption;
  } catch (err) {
    warnings.push(err?.message || 'caption failed');
  }

  // 2. Run OCR (optional for live frames)
  try {
    const ocr = await runOcr(dataUrl);
    ocrText = ocr.text.slice(0, 1200);
  } catch {
    // ignore
  }

  // 3. Run Object Detection (to identify holding items like "ball", "pen", etc.)
  try {
    const detections = await transformersService.detectObjects(dataUrl, 'Xenova/detr-resnet-50', { useGPU: true });
    // Filter detections for high-confidence labels
    objects = (detections || [])
      .filter((d) => d.score > 0.45)
      .map((d) => d.label);
  } catch (err) {
    warnings.push(`object detection failed: ${err?.message || 'unknown error'}`);
  }

  return {
    caption,
    extractedText: ocrText,
    objects, // List of strings representing detected object labels (e.g. ['ball', 'cup'])
    warnings,
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
  if (!blob || blob.size < 800) return '';
  const url = URL.createObjectURL(blob);
  try {
    // Read raw PCM samples from the blob
    const audioCtx = await transformersService.getAudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const rawSamples = audioBuffer.getChannelData(0);

    const result = await transformersService.transcribeAudio(rawSamples, MODELS.stt, { useGPU: true });
    return String(result?.text || '').trim();
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const isWhisperReady = async () => {
  try {
    await transformersService.preloadModel('automatic-speech-recognition', MODELS.stt, { useGPU: true });
    return true;
  } catch {
    return false;
  }
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
