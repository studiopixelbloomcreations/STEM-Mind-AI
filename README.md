# STEM Mind AI

STEM Mind AI is a React + Vite classroom for Grades 9–11. Teachers sign in with Google, create student profiles, and run **Gemini Live** lessons — voice, camera, adaptive quizzes, and worksheet walkthroughs.

**Production URL:** [https://stemmindv1.vercel.app](https://stemmindv1.vercel.app)

The whole product brain is **Gemini Live** (`src/live/`), not REST `generateContent`:

- `src/live/geminiLiveSession.js` — shared Live WebSocket client
- `src/live/harmonyCouncil.js` — Teacher / Difficulty / Explainer / Exam Coach / Motivator / Visual Teacher / Image Analyzer over Live TEXT
- `src/live/liveNarrator.js` — spoken walkthroughs over Live AUDIO
- `src/services/geminiLiveService.js` — STEM Live tutor socket (Live AUDIO + mic + camera)

Retired files live in `unwanted/` and must never be imported.

## Local Setup

1. `npm install`
2. Create `.env.local`:

```
VITE_FIREBASE_WEBAPP_CONFIG={"apiKey":"","authDomain":"","projectId":"","appId":""}
VITE_SUPABASE_CONFIG={"url":"https://YOUR_PROJECT.supabase.co","anonKey":"YOUR_SUPABASE_ANON_KEY"}
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_TTS_VOICE=Kore
```

3. `npm run dev`

## What works

- Interactive landing page with hidden easter eggs (orbit treasures, Konami, logo taps, type `STEM` / `atom` / `bloom`)
- Teacher Google sign-in, student profiles, mastery + quiz history
- Gemini Live adaptive quizzes (real difficulty history, saved question log, correct scoring)
- Visual Teacher + wrong-answer repair steps with Live narration
- Photo Analyzer via Gemini Live vision
- STEM Live voice + camera tutor, hand overlay, working menu + share

## Supabase

Still used for teachers, students, quizzes, analytics, and Photo Analyzer persistence (`vision-analyze`). Apply SQL in `supabase/migrations/` and `supabase_schema.sql`.

## Verification

- Lint: `npm run lint`
- Unit tests: `npm run test`
- Build: `npm run build`
