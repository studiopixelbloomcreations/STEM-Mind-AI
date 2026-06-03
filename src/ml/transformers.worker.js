import { pipeline, env } from '@huggingface/transformers';
import './transformersEnv.js';

// Configure Transformers.js environments for browser/worker
env.allowLocalModels = false;

// Cache loaded pipelines
const pipelines = new Map();

/**
 * Global progress listener and pipeline manager
 */
async function getPipeline(task, model, options = {}, messageId) {
  const key = `${task}:${model}`;
  if (pipelines.has(key)) return pipelines.get(key);

  const progress_callback = (progress) => {
    // Send progress updates to the main thread
    self.postMessage({
      id: messageId,
      type: 'progress',
      payload: {
        task,
        model,
        status: progress.status,
        file: progress.file,
        progress: progress.progress,
        loaded: progress.loaded,
        total: progress.total,
      }
    });
  };

  // Determine computation device - Opt-in WebGPU, fallback to WebAssembly (WASM)
  const device = options.device || (options.useGPU ? 'webgpu' : 'wasm');

  try {
    console.log(`[Transformers Worker] Loading pipeline: ${task} with ${model} on device: ${device}`);
    const pipe = await pipeline(task, model, {
      progress_callback,
      device,
      ...options
    });
    pipelines.set(key, pipe);
    return pipe;
  } catch (error) {
    if (device === 'webgpu') {
      console.warn(`[Transformers Worker] WebGPU initialization failed for ${model}. Falling back to WebAssembly (WASM). Error:`, error);
      // Fallback compilation on WASM/CPU
      const fallbackPipe = await pipeline(task, model, {
        progress_callback,
        device: 'wasm',
        ...options
      });
      pipelines.set(key, fallbackPipe);
      return fallbackPipe;
    }
    throw error;
  }
}

// Register Web Worker Message Handler
self.onmessage = async (event) => {
  const id = event.data.id;
  const type = event.data.type || event.data.task;
  
  // Normalize incoming payload structure to support both API versions
  let payload = event.data.payload;
  if (!payload) {
    const rawData = event.data.data;
    payload = {
      text: type === 'text-to-speech' || type === 'feature-extraction' ? rawData : undefined,
      audioData: type === 'automatic-speech-recognition' ? rawData : undefined,
      image: type === 'object-detection' ? rawData : undefined,
      model: event.data.model,
      options: event.data.options
    };
  }

  // Normalize task names
  const taskMap = {
    'text-to-speech': 'tts',
    'automatic-speech-recognition': 'stt',
    'object-detection': 'object-detection',
    'feature-extraction': 'embed'
  };
  const normalizedType = taskMap[type] || type;

  try {
    switch (normalizedType) {
      case 'load': {
        const { task, model, options } = payload;
        await getPipeline(task, model, options, id);
        self.postMessage({
          id,
          type: 'status',
          payload: { status: 'ready', task, model }
        });
        break;
      }

      case 'tts': {
        const { text, model, options = {} } = payload;
        const targetModel = model || 'Xenova/speecht5_tts';
        const generator = await getPipeline('text-to-speech', targetModel, options, id);

        // Check if model is SpeechT5 (requires speaker embeddings)
        let speaker_embeddings = options.speaker_embeddings;
        if (targetModel.includes('speecht5') && !speaker_embeddings) {
          // Provide default CMU Arctic female speaker embeddings
          speaker_embeddings = 'https://huggingface.co/datasets/Xenova/cmu-arctic-xvectors/resolve/main/cmu_us_slt_arctic-wav-artic_a0001.bin';
        }

        const result = await generator(text, { speaker_embeddings, ...options });
        const audio = result.audio; // Float32Array audio waveform
        const sampling_rate = result.sampling_rate;

        // Post result back with transferable array for 0-copy performance
        self.postMessage({
          id,
          type: 'success',
          result: { audio, sampling_rate },
          payload: { audio, sampling_rate }
        }, audio instanceof Float32Array ? [audio.buffer] : []);
        break;
      }

      case 'stt': {
        const { audioData, model, options = {} } = payload;
        const generator = await getPipeline('automatic-speech-recognition', model || 'Xenova/whisper-tiny.en', options, id);

        const result = await generator(audioData, {
          chunk_length_s: 30,
          stride_length_s: 5,
          ...options
        });

        self.postMessage({
          id,
          type: 'success',
          result: result,
          payload: result
        });
        break;
      }

      case 'object-detection': {
        const { image, model, options = {} } = payload;
        const detector = await getPipeline('object-detection', model || 'Xenova/detr-resnet-50', options, id);

        const result = await detector(image, options);
        self.postMessage({
          id,
          type: 'success',
          result: result,
          payload: result
        });
        break;
      }

      case 'embed': {
        const { text, model, options = {} } = payload;
        const embedder = await getPipeline('feature-extraction', model || 'Xenova/all-MiniLM-L6-v2', options, id);

        const output = await embedder(text, { pooling: 'mean', normalize: true, ...options });
        const data = output.data; // Float32Array representation

        self.postMessage({
          id,
          type: 'success',
          result: Array.from(data),
          payload: { data, dims: output.dims }
        }, data instanceof Float32Array ? [data.buffer] : []);
        break;
      }

      default:
        throw new Error(`Unsupported pipeline execution task type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      error: error.message || String(error)
    });
  }
};
