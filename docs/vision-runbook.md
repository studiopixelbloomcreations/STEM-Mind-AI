# Vision Edge Function Runbook

The student **Photo Analyzer** runs OCR, captioning, and object detection **client-side** with Transformers.js. The `vision-analyze` edge function stores images and persists pre-processed analysis from the browser.

## Deploy

See **[supabase-edge-functions-deploy.md](./supabase-edge-functions-deploy.md)** for full beginner steps (CLI + Dashboard).

Quick checklist:

1. Apply SQL migration `20260528190000_phase1_camera_vision.sql` in Supabase SQL Editor (if not already applied).
2. Set Edge Function secrets: `FIREBASE_PROJECT_ID` (required); optional `OPENROUTER_API_KEY` for legacy server-side OCR fallback. Do not add `SUPABASE_*` secrets — Supabase injects those automatically.
3. Deploy `vision-analyze` (and `stem-live` for CORS parity). **Redeploy after updating CORS** for production URL `https://stemmindv1.vercel.app`.
4. Verify OPTIONS preflight with curl (commands in deploy doc).

## API smoke test

Use curl or an API client with a valid Firebase ID token:

- `mode: "analyze"` with `clientAnalysis` from Transformers.js — stores image and persists client OCR/vision results.
- `mode: "list"` — returns recent attempts for authorized teacher/student pair.

## Failure Modes and Recovery

- **401/500 auth error**: verify `FIREBASE_PROJECT_ID` and that the client sends a Firebase ID token.
- **Empty OCR on device**: first model load may take time; retake with better lighting. Models cache in IndexedDB after first download.
- **Storage errors**: ensure bucket `vision-captures` exists and migration applied.
