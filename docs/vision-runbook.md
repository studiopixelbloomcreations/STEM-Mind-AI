# Vision MVP Runbook

## Deploy

1. Apply SQL migration:
   - `supabase db push` (or run SQL manually in dashboard)
2. Set function secrets:
   - `supabase secrets set SUPABASE_URL=...`
   - `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`
   - `supabase secrets set FIREBASE_PROJECT_ID=...`
   - Optional: `OCR_SPACE_API_KEY`, `HUGGINGFACE_API_KEY`, `OPENROUTER_API_KEY`
3. Deploy function:
   - `supabase functions deploy vision-analyze`

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
