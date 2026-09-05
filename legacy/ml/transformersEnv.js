/**
 * Transformers.js / ONNX Runtime Web environment for browser deployment.
 *
 * Vercel + Firebase: use COOP same-origin-allow-popups (see vercel.json) so Google sign-in
 * popups work. That prevents crossOriginIsolated, so we run single-threaded WASM and disable
 * browser + WASM Cache API (Cache.put fails for large CDN assets on static hosts).
 *
 * Local multi-thread opt-in: VITE_TRANSFORMERS_MULTI_THREAD=true with vite COEP require-corp.
 */
import { env } from '@huggingface/transformers';

const wantsMultiThread =
  import.meta.env.VITE_TRANSFORMERS_MULTI_THREAD === 'true' &&
  typeof self !== 'undefined' &&
  self.crossOriginIsolated;

const applySingleThreadWasm = (wasm) => {
  wasm.numThreads = 1;
  wasm.proxy = false;

  const ortVersion = env.backends?.onnx?.versions?.web;
  if (!ortVersion) return;

  const prefix = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ortVersion.includes('-') ? '1.20.1' : ortVersion}/dist/`;
  wasm.wasmPaths = prefix;
  if ('simd' in wasm) wasm.simd = false;
};

export const configureTransformersEnv = () => {
  env.allowLocalModels = false;
  env.useBrowserCache = false;
  env.useWasmCache = false;

  const wasm = env.backends?.onnx?.wasm;
  if (wasm && !wantsMultiThread) {
    applySingleThreadWasm(wasm);
  }
};

configureTransformersEnv();
