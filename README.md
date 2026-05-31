# STEM Mind AI

STEM Mind AI is a React + Vite learning platform that uses Firebase authentication and Supabase storage/database.

**Production URL:** [https://stemmindv1.vercel.app](https://stemmindv1.vercel.app)

This release includes:

- **Harmony engine** (unchanged) for adaptive quiz NLP, visual teaching agents, and STEM Live reply orchestration via existing providers.
- **Transformers.js** (`@huggingface/transformers`) for browser-side vision, speech, and object detection.
- **STEM Live** — full-screen voice mode with client-side frame analysis, Whisper STT (Web Speech fallback), and SpeechT5 TTS.
- **Photo Analyzer** — worksheet capture with on-device OCR + Visual Teacher walkthrough.
- Session and turn persistence for observability/debugging.

## Transformers.js models (browser)

Models download lazily from Hugging Face on first use and cache in the browser. A progress bar appears during loading.

| Task | Model | Notes |
|------|-------|-------|
| OCR (worksheets) | `Xenova/trocr-base-printed` | Printed text extraction |
| Image caption | `Xenova/vit-gpt2-image-captioning` | Scene description for STEM Live frames |
| Object detection | `Xenova/detr-resnet-50` | On-demand in Photo Analyzer only |
| Text-to-speech | `Xenova/speecht5_tts` | Natural English teacher voice (SpeechT5 + speaker embeddings) |
| Speech-to-text | `Xenova/whisper-tiny.en` | STEM Live STT; falls back to Web Speech API if slow/unavailable |

**First load:** expect ~50–200 MB total model downloads depending on features used. Subsequent visits use cached weights.

Architecture: `src/ml/transformersClient.js` wraps lazy `pipeline()` calls. Harmony (`src/harmony/harmonyEngine.js`) is **not** replaced by Transformers.js.

## Local Setup

1. Install dependencies:
   - `npm install`
2. Configure frontend env in `.env.local`:
   - `VITE_FIREBASE_WEBAPP_CONFIG` (JSON string from Firebase web app settings)
   - `VITE_SUPABASE_CONFIG` (JSON string: `{"url":"https://<project>.supabase.co","anonKey":"<anon-key>"}`)
   - `VITE_PI_MODEL_API_KEYS_JSON` (optional for existing quiz features)
3. Start frontend:
   - `npm run dev`

Vite is configured for Transformers.js (WASM/ONNX assets, worker format). Dev server uses `Cross-Origin-Opener-Policy: same-origin-allow-popups` so Firebase Google sign-in works locally.

### Vercel / production headers

`vercel.json` sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` (required for Firebase popup auth). COEP is **not** set in production because it conflicts with OAuth popups and threaded WASM.

ONNX Runtime runs **single-threaded** WASM by default (`src/ml/transformersEnv.js`):

- `env.useWasmCache = false` — avoids `Cache.put` failures for large wasm files on Vercel
- `env.backends.onnx.wasm.numThreads = 1` and `proxy = false`
- Non-asyncify wasm paths from jsDelivr when not `crossOriginIsolated`

Optional local multi-threading: set `VITE_TRANSFORMERS_MULTI_THREAD=true` and use vite dev headers with COEP `require-corp`.

## Supabase Setup (Required for STEM Live + Photo Analyzer persistence)

### 1) Apply SQL migrations
Run migration `supabase/migrations/20260528190000_phase1_camera_vision.sql` in Supabase SQL editor.

### 2) Deploy Edge Functions
See **[docs/supabase-edge-functions-deploy.md](docs/supabase-edge-functions-deploy.md)** for CLI and Supabase Dashboard deploy steps.

From project root (if CLI is installed):
- `supabase functions deploy vision-analyze`
- `supabase functions deploy stem-live`

**CORS:** After deploy, ensure functions allow `https://stemmindv1.vercel.app` (see `supabase/functions/_shared/cors.ts`). Redeploy edge functions when changing production URL.

### 3) Configure Edge Function Secrets
In Supabase Dashboard → Project Settings → Edge Functions → Secrets:

- Required: `FIREBASE_PROJECT_ID`
- Optional:
  - `OPENROUTER_API_KEY` (recommended for STEM Live conversational replies)
  - `OCR_SPACE_API_KEY`, `HUGGINGFACE_API_KEY` (legacy server OCR fallback only; client runs TrOCR by default)

Do **not** create secrets named `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or any `SUPABASE_*` prefix.

## Vision API Contract

Edge function endpoint: `/functions/v1/vision-analyze`

- `mode: "analyze"`: client sends `clientAnalysis` from Transformers.js + image for storage; server persists attempt.
- `mode: "list"`: returns recent attempts for authorized teacher/student pair.

## STEM Live API Contract

Edge function endpoint: `/functions/v1/stem-live`

- `mode: "start"`: creates live session; welcome capped at 5 words on screen when captions off.
- `mode: "turn"`: accepts transcript + optional `visualContext` (client-side caption/OCR/objects); returns reply text for TTS.
- `mode: "heartbeat"` / `mode: "end"`: session lifecycle.

Client-side: camera frames analyzed with Transformers.js; raw frames are not sent when `visualContext` is present.

## Privacy and Access Model

- Camera consent once per browser session before first camera use.
- Images stored in private bucket `vision-captures`.
- Vision OCR runs on-device; server stores results and images for teacher review.
- API keys for Harmony/OpenRouter remain server-side in edge function secrets.

## Verification Commands

- Lint: `npm run lint`
- Unit tests: `npm run test`
- Build: `npm run build`

## Deploy Checklist

1. Deploy SQL migrations.
2. Deploy edge functions and set secrets. **Redeploy for Vercel CORS** (`https://stemmindv1.vercel.app`).
3. Deploy frontend to Vercel with `VITE_*` variables.
4. Test STEM Live: mic pill active/inactive states, 5-word welcome with captions off, TTS after first user gesture.
5. Test Photo Analyzer: capture → Analyze & Teach → Visual Teacher steps with voice.
