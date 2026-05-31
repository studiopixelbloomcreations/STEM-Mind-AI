import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.onnx', '**/*.bin'],
  optimizeDeps: {
    exclude: ['@huggingface/transformers'],
  },
  worker: {
    format: 'es',
  },
  server: {
    headers: {
      // Allow Firebase Google sign-in popups (same-origin blocks window.closed).
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // COEP omitted: threaded WASM needs crossOriginIsolated, which conflicts with OAuth popups.
      // Set VITE_TRANSFORMERS_MULTI_THREAD=true locally with COOP same-origin + COEP require-corp to opt in.
      ...(process.env.VITE_TRANSFORMERS_MULTI_THREAD === 'true'
        ? { 'Cross-Origin-Embedder-Policy': 'require-corp' }
        : {}),
    },
  },
})
