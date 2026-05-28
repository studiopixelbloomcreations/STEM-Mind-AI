# STEM Live Production Runbook

## Required Secrets

Set these on Supabase before deploying `stem-live`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FIREBASE_PROJECT_ID`
- `OPENROUTER_API_KEY` (strongly recommended for production quality live responses)

Optional (vision pipeline fallback quality):

- `OCR_SPACE_API_KEY`
- `HUGGINGFACE_API_KEY`

## Required Frontend Variables

In `.env.local`:

- `VITE_FIREBASE_WEBAPP_CONFIG`
- `VITE_SUPABASE_CONFIG` as JSON string with `url` and `anonKey`

## Deploy Sequence

1. Apply DB migrations:
   - `20260528190000_phase1_camera_vision.sql`
   - `20260528200500_stem_live_mode.sql`
   - `20260528221000_stem_live_observability.sql`
2. Deploy functions:
   - `supabase functions deploy vision-analyze`
   - `supabase functions deploy stem-live`
3. Deploy frontend build.

## Hotfix Redeploy (CORS + analytics 406)

If production shows CORS preflight failures on `/functions/v1/vision-analyze` or `/functions/v1/stem-live`, redeploy both functions immediately:

- `supabase functions deploy vision-analyze --project-ref <your-project-ref>`
- `supabase functions deploy stem-live --project-ref <your-project-ref>`

If analytics requests for `/rest/v1/analytics` return 406, redeploy the frontend so the updated non-`.single()` query logic is live.

## End-to-End Verification

1. Sign in as a teacher.
2. Open a student and click `Open STEM Live`.
3. Allow microphone and confirm status reads `Mic: granted`.
4. Speak naturally and verify:
   - center blob animates
   - AI responds with natural spoken output
   - provider + latency metadata updates
5. Toggle camera on and verify:
   - visual status becomes active
   - AI can ground responses in visual context
6. Disable network for 10-15 seconds, re-enable, confirm reconnect status recovers.
7. End session and verify session closes cleanly.
8. Verify observability data:
   - `live_sessions`
   - `live_turns`
   - `live_session_events`

## Degraded Modes

- Camera denied/unavailable -> session continues voice-only.
- Unsupported STT browser -> user sees explicit Chromium requirement.
- Provider or network issue -> model fallback, then deterministic safe fallback.

## Security Notes

- Firebase bearer token is required for each call.
- Session/teacher ownership checks are enforced per request.
- API keys are server-side only; never expose provider keys in frontend.
