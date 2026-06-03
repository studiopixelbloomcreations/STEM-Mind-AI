/**
 * TransformersService - Main Thread API Interface for communicating with the background Web Worker.
 * Handles Web Worker instantiation, request-response synchronization via message IDs, 
 * loading progress state, and client-side browser AudioContext helpers.
 */

export class TransformersService {
  constructor() {
    this.worker = null;
    this.nextRequestId = 0;
    this.pendingRequests = new Map();
    this.progressCallbacks = new Set();
    this.audioContext = null;
    this.initializeWorker();
  }

  /**
   * Instantiate the Web Worker using Vite-compatible ESM URL syntax
   */
  initializeWorker() {
    try {
      this.worker = new Worker(
        new URL('./transformers.worker.js', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event) => {
        const { id, type, payload, error } = event.data;

        // Route progress updates to local listeners
        if (type === 'progress') {
          this.progressCallbacks.forEach((cb) => cb(payload));
          return;
        }

        const request = this.pendingRequests.get(id);
        if (!request) return;

        if (type === 'error') {
          request.reject(new Error(error));
          this.pendingRequests.delete(id);
        } else if (type === 'result' || type === 'status') {
          request.resolve(payload);
          this.pendingRequests.delete(id);
        }
      };

      this.worker.onerror = (err) => {
        console.error('[TransformersService] Web Worker runtime error:', err);
      };
    } catch (error) {
      console.error('[TransformersService] Failed to load Web Worker:', error);
    }
  }

  /**
   * Register a callback to receive download progress events (loaded bytes, percentage)
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  onProgress(callback) {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Helper to dispatch execution messages to the worker
   */
  _sendRequest(type, payload) {
    return new Promise((resolve, reject) => {
      const id = this.nextRequestId++;
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, payload });
    });
  }

  /**
   * Preload a model into the worker cache
   */
  async preloadModel(task, model, options = {}) {
    return this._sendRequest('load', { task, model, options });
  }

  /**
   * 1. Text-to-Speech (TTS)
   * Synthesize text speech to audio samples.
   */
  async synthesizeSpeech(text, model = 'Xenova/speecht5_tts', options = {}) {
    return this._sendRequest('tts', { text, model, options });
  }

  /**
   * 2. Speech-to-Text (STT)
   * Transcribe raw PCM float32 audio samples using Whisper.
   */
  async transcribeAudio(audioData, model = 'Xenova/whisper-tiny.en', options = {}) {
    return this._sendRequest('stt', { audioData, model, options });
  }

  /**
   * 3. Object Detection & Image Segmentation
   * Perform inference on image URLs, Base64 strings, or ImageBitmaps.
   */
  async detectObjects(image, model = 'Xenova/detr-resnet-50', options = {}) {
    return this._sendRequest('object-detection', { image, model, options });
  }

  /**
   * 4. Text Embeddings
   * Extract feature vectors for downstream semantic search or similarity.
   */
  async getEmbeddings(text, model = 'Xenova/all-MiniLM-L6-v2', options = {}) {
    return this._sendRequest('embed', { text, model, options });
  }

  // ═══════════════════════════════════════════════════════════════
  // BROWSER AUDIO INTERACTION HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Safe AudioContext initialization and unlocking following browser gesture rules
   */
  async getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Play Float32 PCM audio arrays produced by TTS synthesizers
   */
  async playAudioBuffer(audioFloat32Array, samplingRate, onEnd = null) {
    const ctx = await this.getAudioContext();
    const buffer = ctx.createBuffer(1, audioFloat32Array.length, samplingRate);
    buffer.getChannelData(0).set(audioFloat32Array);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    if (onEnd) {
      source.onended = () => {
        try {
          onEnd();
        } catch (e) {
          console.error(e);
        }
      };
    }
    
    source.start(0);
    return source;
  }

  /**
   * Unlock browser permission constraint for mic recording or speech playback.
   * Trigger this function on a User click/tap gesture.
   */
  async unlockAudio() {
    const ctx = await this.getAudioContext();
    console.log('[TransformersService] Audio Context successfully unlocked. State:', ctx.state);
    return ctx;
  }
}

// Export singleton instance
export const transformersService = new TransformersService();
export default transformersService;
