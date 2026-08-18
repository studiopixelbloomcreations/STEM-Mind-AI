# STEM Mind AI

STEM Mind AI is a React + Vite classroom for Grades 9–11. Teachers sign in with Google, create student profiles, and run lessons.

**Production URL:** [https://stemmindv1.vercel.app](https://stemmindv1.vercel.app)

## How the AI is wired

- **Harmony council, quizzes, explanations, visual teacher, photo analysis, and narration** use the regular Gemini API (`generateContent` / TTS) via `src/harmony/geminiHarmonyEngine.js` and `src/utils/voiceSynthesizer.js`.
- **STEM Live only** uses the Gemini Live WebSocket (`src/services/geminiLiveService.js` + `src/live/geminiLiveSession.js`).

## Local Setup

1. `npm install`
2. Create `.env.local`:

```
VITE_FIREBASE_WEBAPP_CONFIG={"apiKey":"","authDomain":"","projectId":"","appId":""}
VITE_SUPABASE_CONFIG={"url":"https://YOUR_PROJECT.supabase.co","anonKey":"YOUR_SUPABASE_ANON_KEY"}
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_HARMONY_MODEL=gemini-2.5-flash
VITE_GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
VITE_GEMINI_TTS_VOICE=Kore
```

3. `npm run dev`

## Verification

- Lint: `npm run lint`
- Unit tests: `npm run test`
- Build: `npm run build`
