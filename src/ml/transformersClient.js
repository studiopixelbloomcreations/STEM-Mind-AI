/**
 * Client-side Transformers.js service layer.
 * Wraps lazy pipeline() loading with progress callbacks and structured vision/STT/TTS helpers.
 * Harmony NLP remains separate — this module handles vision, detection, and speech only.
 */

import { env, pipeline } from '@huggingface/transformers';
import { MODELS, SPEAKER_EMBEDDINGS_URL, TTS_AUDIO_GAIN } from './transformersModels';

env.allowLocalModels = false;
env.useBrowserCache = true;

const pipelineCache = new Map();
const progressListeners = new Set();

const notifyProgress = (detail) => {
  progressListeners.forEach((listener) => {
    try {
      listener(detail);
    } catch {
      // ignore listener errors
    }
  });
};

const wrapProgress = (task, modelId) => (progress) => {
  notifyProgress({
    task,
    modelId,
    status: progress?.status || 'progress',
    file: progress?.file || '',
    progress: progress?.progress ?? null,
    loaded: progress?.loaded ?? null,
    total: progress?.total ?? null,
  });
};

const getPipeline = async (task, modelId, options = {}) => {
  const key = `${task}:${modelId}`;
  if (pipelineCache.has(key)) return pipelineCache.get(key);

  const loadPromise = pipeline(task, modelId, {
    progress_callback: wrapProgress(task, modelId),
    ...options,
  });
  pipelineCache.set(key, loadPromise);
  try {
    return await loadPromise;
  } catch (error) {
    pipelineCache.delete(key);
    throw error;
  }
};

export const onModelLoadProgress = (listener) => {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
};

export const preloadSpeechModels = () => {
  getPipeline('text-to-speech', MODELS.tts, { quantized: false }).catch(() => undefined);
};

export const preloadVisionModels = () => {
  getPipeline('image-to-text', MODELS.ocr).catch(() => undefined);
  getPipeline('image-to-text', MODELS.caption).catch(() => undefined);
  getPipeline('object-detection', MODELS.objectDetection).catch(() => undefined);
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
    const ocr = await getPipeline('image-to-text', MODELS.ocr);
    const results = await ocr(dataUrl);
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
    const captioner = await getPipeline('image-to-text', MODELS.caption);
    const results = await captioner(dataUrl);
    const caption = Array.isArray(results)
      ? results.map((r) => r?.generated_text || '').join(' ').trim()
      : String(results?.generated_text || results?.text || '').trim();
    return { caption, provider: MODELS.caption };
  } finally {
    revokeIfBlobUrl(dataUrl, imageInput);
  }
};

export const runObjectDetection = async (imageInput, { threshold = 0.35, topK = 8 } = {}) => {
  const dataUrl = toDataUrl(imageInput);
  try {
    const detector = await getPipeline('object-detection', MODELS.objectDetection);
    const raw = await detector(dataUrl, { threshold });
    const objects = (Array.isArray(raw) ? raw : [])
      .slice(0, topK)
      .map((item) => ({
        label: String(item?.label || item?.class || 'object'),
        score: Number(item?.score ?? 0),
      }))
      .filter((item) => item.score >= threshold);
    return { objects, provider: MODELS.objectDetection };
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
  let objects = [];

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

  try {
    const det = await runObjectDetection(imageInput);
    objects = det.objects;
  } catch (err) {
    warnings.push(`Object detection failed: ${err?.message || 'unknown error'}`);
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
    detectedObjects: objects,
    provider: 'transformers.js-client',
  };
};

export const analyzeLiveFrame = async (base64Data, mimeType = 'image/jpeg') => {
  const dataUrl = `data:${mimeType};base64,${base64Data}`;
  const warnings = [];
  let caption = '';
  let ocrText = '';
  let objects = [];

  try {
    const cap = await runImageCaption(dataUrl);
    caption = cap.caption;
  } catch (err) {
    warnings.push(err?.message || 'caption failed');
  }

  try {
    const ocr = await runOcr(dataUrl);
    ocrText = ocr.text.slice(0, 1200);
  } catch {
    // OCR optional for live frames
  }

  try {
    const det = await runObjectDetection(dataUrl, { threshold: 0.4, topK: 5 });
    objects = det.objects;
  } catch {
    // detection optional for live frames
  }

  return {
    caption,
    extractedText: ocrText,
    objects,
    warnings,
    capturedAt: new Date().toISOString(),
  };
};

let speakerEmbeddingsPromise = null;

const getSpeakerEmbeddings = () => {
  if (!speakerEmbeddingsPromise) {
    speakerEmbeddingsPromise = fetch(SPEAKER_EMBEDDINGS_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load speaker embeddings.');
        return res.arrayBuffer();
      })
      .then((buffer) => new Float32Array(buffer));
  }
  return speakerEmbeddingsPromise;
};

export const synthesizeSpeech = async (text) => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  const synthesizer = await getPipeline('text-to-speech', MODELS.tts, { quantized: false });
  const speaker_embeddings = await getSpeakerEmbeddings();
  const output = await synthesizer(trimmed.slice(0, 500), { speaker_embeddings });

  let audio = output?.audio;
  if (!audio && output instanceof Float32Array) audio = output;
  if (!audio?.length) throw new Error('TTS produced empty audio.');

  const sampling_rate = output?.sampling_rate || 16000;
  const boosted = new Float32Array(audio.length);
  for (let i = 0; i < audio.length; i += 1) {
    boosted[i] = Math.max(-1, Math.min(1, audio[i] * TTS_AUDIO_GAIN));
  }
  return { audio: boosted, sampling_rate };
};

export const playSpeechSamples = async (audio, samplingRate, { onStart, onEnd } = {}) => {
  const audioCtx = new AudioContext({ sampleRate: samplingRate });
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  const buffer = audioCtx.createBuffer(1, audio.length, samplingRate);
  buffer.getChannelData(0).set(audio);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.onended = () => {
    audioCtx.close().catch(() => undefined);
    onEnd?.();
  };
  onStart?.();
  source.start();
  return { source, audioCtx };
};

export const transcribeAudioBlob = async (blob) => {
  if (!blob || blob.size < 800) return '';
  const url = URL.createObjectURL(blob);
  try {
    const transcriber = await getPipeline('automatic-speech-recognition', MODELS.stt);
    const result = await transcriber(url, { chunk_length_s: 30, stride_length_s: 5 });
    return String(result?.text || '').trim();
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const isWhisperReady = async () => {
  try {
    await getPipeline('automatic-speech-recognition', MODELS.stt);
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
  runObjectDetection,
  buildClientVisionAnalysis,
  analyzeLiveFrame,
  synthesizeSpeech,
  playSpeechSamples,
  transcribeAudioBlob,
  isWhisperReady,
};
