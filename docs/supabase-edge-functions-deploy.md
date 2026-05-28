# Deploy Supabase Edge Functions (Beginner Guide)

This project uses two Edge Functions:

- `vision-analyze` — camera OCR + worksheet analysis
- `stem-live` — STEM Live voice/session API

Both must be deployed with CORS fixes for:

- `https://stemmindv1.netlify.app`
- `http://localhost:5173`

## Before you deploy

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Note your **Project URL** (example: `https://abcdefgh.supabase.co`).
3. Note your **anon public key** (Settings → API).
4. Set **Edge Function secrets** (Project Settings → Edge Functions → Secrets).

   **Do not** add secrets whose names start with `SUPABASE_`. Supabase injects these automatically at runtime (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). The dashboard rejects custom secrets with that prefix.

   Add only these secrets manually:

| Secret | Required | Where to get it |
|--------|----------|-----------------|
| `FIREBASE_PROJECT_ID` | Yes | Firebase Console → Project settings |
| `OPENROUTER_API_KEY` | No | OpenRouter dashboard (recommended for STEM Live + vision reasoning) |
| `OCR_SPACE_API_KEY` | No | OCR.space API key |
| `HUGGINGFACE_API_KEY` | No | Hugging Face token (OCR fallback) |

5. Apply SQL migrations in **SQL Editor** (run each file under `supabase/migrations/` if not already applied).

## Option A — Supabase CLI (if installed)

Install CLI once: https://supabase.com/docs/guides/cli

```bash
cd "C:/Users/thenu/Downloads/STEM Mind AI"
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set FIREBASE_PROJECT_ID=your-firebase-project-id
# Optional:
# supabase secrets set OPENROUTER_API_KEY=your-key
# supabase secrets set OCR_SPACE_API_KEY=your-key
# supabase secrets set HUGGINGFACE_API_KEY=your-key
supabase functions deploy vision-analyze --project-ref YOUR_PROJECT_REF
supabase functions deploy stem-live --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with the short id from your dashboard URL.

## Option B — Dashboard deploy (no CLI)

Supabase does not offer one-click “upload folder” for functions in all plans, but you can deploy from the Dashboard using the built-in editor:

1. Dashboard → **Edge Functions**.
2. If `vision-analyze` exists, open it; otherwise click **Deploy a new function** and name it `vision-analyze`.
3. Copy the full contents of `supabase/functions/vision-analyze/index.ts` from this repo into the editor.
4. Create or open a file for shared CORS helper:
   - Path: `_shared/cors.ts` (or paste the same file next to the function if your UI only allows one file — then inline the CORS helper at the top of `index.ts` instead).
   - Copy from `supabase/functions/_shared/cors.ts`.
5. Click **Deploy**.
6. Repeat for `stem-live` using `supabase/functions/stem-live/index.ts`.

If the Dashboard only allows a single file per function, merge `_shared/cors.ts` into the top of each `index.ts` before pasting (keep the same `handleOptions` / `jsonWithCors` helpers).

7. Confirm both functions show status **Active** under Edge Functions.

## Verify CORS with curl

Replace `YOUR_REF` and use your anon key where noted.

### vision-analyze OPTIONS

```bash
curl -i -X OPTIONS "https://YOUR_REF.supabase.co/functions/v1/vision-analyze" \
  -H "Origin: https://stemmindv1.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,apikey,content-type,x-client-info,x-supabase-api-version"
```

Expect: HTTP `200` and headers including:

- `Access-Control-Allow-Origin: https://stemmindv1.netlify.app`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`

### stem-live OPTIONS

```bash
curl -i -X OPTIONS "https://YOUR_REF.supabase.co/functions/v1/stem-live" \
  -H "Origin: https://stemmindv1.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,apikey,content-type,x-client-info,x-supabase-api-version"
```

Same expectations as above.

### Local dev origin

```bash
curl -i -X OPTIONS "https://YOUR_REF.supabase.co/functions/v1/vision-analyze" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,apikey,content-type"
```

## Frontend after functions deploy

1. Set `VITE_SUPABASE_CONFIG` in Netlify (or `.env.local`) to:

```json
{"url":"https://YOUR_REF.supabase.co","anonKey":"YOUR_ANON_KEY"}
```

2. Redeploy the Netlify site (`stemmindv1.netlify.app`).
3. Sign in with Firebase, open a student, test **Open Camera** and **Analyze Image**.

## Troubleshooting

### "Name must not start with the SUPABASE_ prefix"

When adding Edge Function secrets in the Dashboard, Supabase blocks any name beginning with `SUPABASE_`. That is expected: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are **already injected** into every deployed function for your project. Add only the manual secrets listed in step 4 above (`FIREBASE_PROJECT_ID` and optional provider keys).

| Symptom | Fix |
|---------|-----|
| Browser: “Failed to fetch” on analyze/live | Redeploy both functions; run curl OPTIONS above |
| OPTIONS not 200 | Function crashed on boot — redeploy; confirm `FIREBASE_PROJECT_ID` is set |
| Dashboard: "Name must not start with the SUPABASE_ prefix" | Do not add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or any `SUPABASE_*` secret — they are injected automatically |
| 401 on POST | `FIREBASE_PROJECT_ID` secret must match Firebase web app project |
| Camera preview blank | Use latest frontend (stream attaches after video mounts) |
| CORS on wrong origin | Only Netlify + localhost:5173 are allowed; add others in `_shared/cors.ts` |
