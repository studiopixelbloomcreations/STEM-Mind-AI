# Vision Edge Function Runbook

The student **Photo Analyzer** UI was removed from the Learning Hub. The `vision-analyze` edge function and SQL migration remain available for optional or future integrations.

## Deploy

See **[supabase-edge-functions-deploy.md](./supabase-edge-functions-deploy.md)** for full beginner steps (CLI + Dashboard).

Quick checklist:

1. Apply SQL migration `20260528190000_phase1_camera_vision.sql` in Supabase SQL Editor (if not already applied).
2. Set Edge Function secrets: `FIREBASE_PROJECT_ID` (required); optional `OPENROUTER_API_KEY`, `OCR_SPACE_API_KEY`, `HUGGINGFACE_API_KEY`. Do not add `SUPABASE_*` secrets — Supabase injects those automatically.
3. Deploy `vision-analyze` (and `stem-live` for CORS parity).
4. Verify OPTIONS preflight with curl (commands in deploy doc).

## API smoke test (no student UI)

Use curl or an API client with a valid Firebase ID token:

- `mode: "analyze"` — upload image payload; expect `vision_attempts` row and object in `vision-captures` bucket.
- `mode: "list"` — returns recent attempts for authorized teacher/student pair.

## Failure Modes and Recovery

- **401/500 auth error**: verify `FIREBASE_PROJECT_ID` and that the client sends a Firebase ID token.
- **OCR warnings**: configure optional provider keys or use a clearer image.
- **Storage errors**: ensure bucket `vision-captures` exists and migration applied.
