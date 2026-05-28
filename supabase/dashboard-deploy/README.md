# Deploy Edge Functions via Supabase Dashboard (no CLI)

Use this folder when the Supabase CLI hangs or fails on Windows. Each `.ts` file is **one self-contained script** (CORS helper inlined). Paste the **entire file** into the Dashboard editor—no `_shared` imports.

| File | Dashboard function name (slug) |
|------|--------------------------------|
| `vision-analyze.ts` | `vision-analyze` |
| `stem-live.ts` | `stem-live` |

**Project ref:** `jxhljizbivkrnpzwswce`  
**Project URL:** `https://jxhljizbivkrnpzwswce.supabase.co`

---

## Step-by-step (Dashboard)

### 1. Open your project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Select project **jxhljizbivkrnpzwswce** (URL bar shows `/project/jxhljizbivkrnpzwswce/...`).

### 2. Deploy `vision-analyze`

1. Left sidebar → **Edge Functions**.
2. If `vision-analyze` already exists, click it. Otherwise click **Deploy a new function** (or **Create function**) and set the name to exactly **`vision-analyze`** (must match the slug in your app URLs).
3. Open this repo file: `supabase/dashboard-deploy/vision-analyze.ts`.
4. Select all (`Ctrl+A`) → copy (`Ctrl+C`).
5. In the Dashboard code editor, select all existing code → paste (`Ctrl+V`).
6. Click **Deploy** (or **Save & deploy**). Wait until status is **Active**.

### 3. Deploy `stem-live`

Repeat step 2 for **`stem-live`**, pasting from `supabase/dashboard-deploy/stem-live.ts`.

### 4. Edge Function secrets

1. **Project Settings** (gear) → **Edge Functions** → **Secrets** (or **Manage secrets**).
2. Add secrets **one row per name**. Names are case-sensitive.

| Secret name | Required | Example value for this project |
|-------------|----------|--------------------------------|
| `FIREBASE_PROJECT_ID` | **Yes** | `g9-tutor` |
| `OPENROUTER_API_KEY` | No | Your OpenRouter API key (STEM Live + vision AI reasoning) |
| `OCR_SPACE_API_KEY` | No | OCR.space key (vision OCR) |
| `HUGGINGFACE_API_KEY` | No | Hugging Face token (vision OCR fallback) |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated extra origins, e.g. `https://my-preview.netlify.app` |

**Do not add** any secret whose name starts with `SUPABASE_` (e.g. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Supabase injects those automatically; the Dashboard rejects custom `SUPABASE_*` names.

After adding secrets, **redeploy** both functions (Deploy button) so new env vars load.

### 5. Disable JWT verification (important)

Firebase tokens are verified **inside** each function. The Supabase gateway JWT check breaks CORS `OPTIONS` preflight.

For **each** function (`vision-analyze`, `stem-live`):

1. Open the function in **Edge Functions**.
2. Find **Verify JWT with legacy secret** (or **Enforce JWT verification**) and turn it **OFF** / set to **false**.

This matches `supabase/config.toml` (`verify_jwt = false` for both functions).

If you deploy via Management API instead, pass `"verify_jwt": false` in deploy metadata (see main doc).

### 6. Test

**CORS preflight (no auth):**

```bash
curl -i -X OPTIONS "https://jxhljizbivkrnpzwswce.supabase.co/functions/v1/vision-analyze" ^
  -H "Origin: https://stemmindv1.netlify.app" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: authorization,apikey,content-type,x-client-info,x-supabase-api-version"
```

Expect HTTP **204** or **200** and header `Access-Control-Allow-Origin: https://stemmindv1.netlify.app`.

Repeat with `/functions/v1/stem-live`.

**App test:** Sign in on [https://stemmindv1.netlify.app](https://stemmindv1.netlify.app) with Firebase, open a student, try **Open Camera** / **Analyze Image** and **STEM Live**.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Browser: “Failed to fetch” / CORS error | Function not deployed, wrong slug, or JWT verification still ON | Redeploy; names must be `vision-analyze` and `stem-live`; disable JWT verification |
| `OPTIONS` fails or no CORS headers | Function missing or crashed on boot | Redeploy paste bundle; set `FIREBASE_PROJECT_ID=g9-tutor` |
| `401` on POST | Missing/wrong `FIREBASE_PROJECT_ID` or no Firebase `Authorization: Bearer` token | Set secret to `g9-tutor`; sign in in the app |
| Dashboard: “Name must not start with SUPABASE_ prefix” | Tried to add reserved secret | Only add `FIREBASE_PROJECT_ID` and optional keys above |
| Works locally, fails on Netlify | Frontend env | Set `VITE_SUPABASE_CONFIG` on Netlify to `{"url":"https://jxhljizbivkrnpzwswce.supabase.co","anonKey":"<anon-key>"}` and redeploy site |

---

## Regenerating paste files

If you change `supabase/functions/*/index.ts` or `_shared/cors.ts`, regenerate bundles from repo root (PowerShell):

```powershell
# See docs/supabase-edge-functions-deploy.md — or re-run the inline script in git history / parent agent notes.
```

Easiest: copy logic from `supabase/functions/<name>/index.ts`, remove the `_shared/cors` import, and paste the CORS block from `supabase/functions/_shared/cors.ts` at the top (before other imports).

---

## More detail

Full deploy guide (Dashboard + optional Management API curl): [`docs/supabase-edge-functions-deploy.md`](../../docs/supabase-edge-functions-deploy.md).
