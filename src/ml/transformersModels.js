/**
 * Browser-runnable Transformers.js model IDs (Xenova ONNX exports).
 * Documented in README — first load downloads weights from Hugging Face CDN.
 */
export const MODELS = {
  /** Printed text OCR for worksheets */
  ocr: 'Xenova/trocr-base-printed',
  /** Scene / image caption for STEM Live frames */
  caption: 'Xenova/vit-gpt2-image-captioning',
  /** English TTS (VITS / MMS — quantized ONNX, no speaker embeddings) */
  tts: 'Xenova/mms-tts-eng',
  /** Fast English STT for STEM Live */
  stt: 'Xenova/whisper-tiny.en',
};

export const TTS_AUDIO_GAIN = 2.0;
