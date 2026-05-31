/**
 * Browser-runnable Transformers.js model IDs (Xenova ONNX exports).
 * Documented in README — first load downloads weights from Hugging Face CDN.
 */
export const MODELS = {
  /** Printed text OCR for worksheets */
  ocr: 'Xenova/trocr-base-printed',
  /** Scene / image caption for STEM Live frames */
  caption: 'Xenova/vit-gpt2-image-captioning',
  /** Lightweight object detection */
  objectDetection: 'Xenova/yolos-tiny',
  /** Natural English TTS (SpeechT5 + speaker embeddings) */
  tts: 'Xenova/speecht5_tts',
  /** Fast English STT for STEM Live */
  stt: 'Xenova/whisper-tiny.en',
};

export const SPEAKER_EMBEDDINGS_URL =
  'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin';

export const TTS_AUDIO_GAIN = 2.5;
