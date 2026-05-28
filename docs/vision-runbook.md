# Vision MVP Runbook

## Deploy

See **[supabase-edge-functions-deploy.md](./supabase-edge-functions-deploy.md)** for full beginner steps (CLI + Dashboard).

Quick checklist:

1. Apply SQL migration `20260528190000_phase1_camera_vision.sql` in Supabase SQL Editor.
2. Set Edge Function secrets: `FIREBASE_PROJECT_ID` (required); optional `OPENROUTER_API_KEY`, `OCR_SPACE_API_KEY`, `HUGGINGFACE_API_KEY`. Do not add `SUPABASE_*` secrets — Supabase injects those automatically.
3. Deploy `vision-analyze` (and `stem-live` for CORS parity).
4. Verify OPTIONS preflight with curl (commands in deploy doc).

## Test Flow

1. Sign in to frontend with Firebase Google auth.
2. Open teacher dashboard, choose/create student, enter student portal.
3. In Camera + Vision panel:
   - Accept consent modal.
   - Capture image from camera or upload JPG/PNG/WEBP.
   - Click **Analyze Image**.
4. Validate:
   - Structured analysis appears.
   - Attempt appears in recent attempts.
   - Row is created in `vision_attempts`.
   - Image stored in `vision-captures/<teacher>/<student>/...`.

## Failure Modes and Recovery

- **401/500 auth error**: verify `FIREBASE_PROJECT_ID` and that frontend sends Firebase ID token.
- **OCR warnings**: configure optional provider keys or retake clearer image.
- **Storage errors**: ensure bucket `vision-captures` exists and migration applied.
