# STEM Mind AI

STEM Mind AI is a React + Vite learning platform that uses Firebase authentication and Supabase storage/database.

This release includes **production STEM Live mode + Phase 1 Camera + Vision**:
- Full-screen immersive STEM Live voice mode (desktop + mobile).
- Real-time mic capture, speech recognition, and spoken AI responses.
- Live camera toggling with sampled visual grounding per turn.
- Session and turn persistence for observability/debugging.
- Heartbeat/reconnect behavior with degraded voice-only fallback if visual pipeline fails.
- Camera capture and image upload in student flow.
- Secure server-side OCR + analysis via Supabase Edge Function.
- Private storage bucket for captured images.
- Persisted vision attempt history per teacher/student.

## Local Setup

1. Install dependencies:
   - `npm install`
2. Configure frontend env in `.env.local`:
   - `VITE_FIREBASE_WEBAPP_CONFIG` (JSON string from Firebase web app settings)
   - `VITE_SUPABASE_CONFIG` (JSON string: `{"url":"https://<project>.supabase.co","anonKey":"<anon-key>"}`)
   - `VITE_PI_MODEL_API_KEYS_JSON` (optional for existing quiz features)
3. Start frontend:
   - `npm run dev`

## Supabase Setup (Required for Vision)

### 1) Apply SQL migrations
Run migration `supabase/migrations/20260528190000_phase1_camera_vision.sql` in Supabase SQL editor.

### 2) Deploy Edge Functions
From project root:
- `supabase functions deploy vision-analyze`
- `supabase functions deploy stem-live`

### 3) Configure Edge Function Secrets
Set these secrets in Supabase:
- Required:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `FIREBASE_PROJECT_ID`
- Optional OCR/Reasoning providers (feature still works with fallback if omitted):
  - `OPENROUTER_API_KEY` (recommended for STEM Live multimodal reasoning + higher quality responses)
  - `OCR_SPACE_API_KEY` (free tier supported)
  - `HUGGINGFACE_API_KEY` (for TrOCR inference)

Example:
- `supabase secrets set FIREBASE_PROJECT_ID=your-project-id`

## Vision API Contract

Edge function endpoint: `/functions/v1/vision-analyze`

- `mode: "analyze"`: validates Firebase token, validates image payload, stores image in private bucket, runs OCR + reasoning, writes `vision_attempts`.
- `mode: "list"`: returns recent attempts for authorized teacher/student pair.

## STEM Live API Contract

Edge function endpoint: `/functions/v1/stem-live`

- `mode: "start"`: verifies teacher/student auth and creates a live session.
- `mode: "turn"`: accepts transcript + optional camera frame, runs model routing, returns conversational reply for TTS.
- `mode: "heartbeat"`: session liveness check used for reconnect behavior and observability.
- `mode: "end"`: marks session complete.

Fallback behavior and routing:
- If `OPENROUTER_API_KEY` is missing/unavailable, the service falls back to deterministic local response logic.
- If the preferred model fails, routing falls back to an alternate model before deterministic fallback.
- If camera permissions are denied, STEM Live continues in voice-only mode.
- If submitted frames are invalid/too large, STEM Live safely drops vision input and continues audio-only.
- If browser STT is unavailable, user should use Chromium-based browser for live speech input.

## Privacy and Access Model

- Frontend asks for camera consent once per browser session before first camera use.
- Image files are stored in private bucket `vision-captures`.
- `vision_attempts` table is RLS-protected for owner teacher access.
- API keys remain server-side in edge function secrets only.
- Live event logs are stored in `live_session_events` with teacher-scoped RLS.

## Verification Commands

- Lint: `npm run lint`
- Unit tests: `npm run test`
- Build: `npm run build`
- Supabase type/deploy smoke: `supabase functions deploy stem-live --no-verify-jwt` (staging only)

## Deploy Checklist

1. Deploy SQL migrations including:
   - `20260528190000_phase1_camera_vision.sql`
   - `20260528200500_stem_live_mode.sql`
   - `20260528221000_stem_live_observability.sql`
2. Deploy edge functions (`vision-analyze`, `stem-live`) and set required secrets.
3. Deploy frontend with `VITE_*` variables.
4. Log in as teacher, open a student, launch `STEM Live`, verify mic/camera controls and voice reply loop.
5. Confirm reconnect by toggling network offline/online and ensuring session recovers without app crash.
5. In student flow, use camera/upload analysis, verify recent attempts render.
