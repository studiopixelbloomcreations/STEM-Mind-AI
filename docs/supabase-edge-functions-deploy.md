# Deploy Supabase Edge Functions (Beginner Guide)

This project uses two Edge Functions:

- `vision-analyze` — camera OCR + worksheet analysis
- `stem-live` — STEM Live voice/session API

Both must be deployed with CORS for:

- `https://stemmindv1.netlify.app`
- `http://localhost:5173`

**Project ref:** `jxhljizbivkrnpzwswce`  
**Paste-ready bundles:** `supabase/dashboard-deploy/` (see [`README.md`](../supabase/dashboard-deploy/README.md))

---

## Before you deploy

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/jxhljizbivkrnpzwswce) and select project **jxhljizbivkrnpzwswce**.
2. Note your **Project URL**: `https://jxhljizbivkrnpzwswce.supabase.co`.
3. Note your **anon public key** (Settings → API).
4. Apply SQL migrations in **SQL Editor** (run each file under `supabase/migrations/` if not already applied).

---

## Method A — Dashboard (no CLI) — **recommended**

Best if the Supabase CLI hangs or fails on Windows. No Docker, no `supabase login`.

### Quick path

1. Copy **`supabase/dashboard-deploy/vision-analyze.ts`** → Dashboard → Edge Functions → `vision-analyze` → paste entire file → **Deploy**.
2. Copy **`supabase/dashboard-deploy/stem-live.ts`** → same for `stem-live`.
3. **Secrets** (Project Settings → Edge Functions → Secrets):

| Secret | Required | Value for this repo |
|--------|----------|---------------------|
| `FIREBASE_PROJECT_ID` | Yes | `g9-tutor` |
| `OPENROUTER_API_KEY` | No | Your OpenRouter key |
| `OCR_SPACE_API_KEY` | No | Optional |
| `HUGGINGFACE_API_KEY` | No | Optional |

**Never** add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or any `SUPABASE_*` secret — Supabase injects those automatically.

4. For each function, turn **OFF** “Verify JWT with legacy secret” (matches `verify_jwt = false` in `supabase/config.toml`). Firebase auth runs inside the function; gateway JWT breaks CORS `OPTIONS`.
5. Redeploy after setting secrets.
6. Verify with curl (below) and test the Netlify app.

Baby-step screenshots-style walkthrough: [`supabase/dashboard-deploy/README.md`](../supabase/dashboard-deploy/README.md).

---

## Method B — Management API (optional, no CLI)

Deploy with a [Personal Access Token](https://supabase.com/dashboard/account/tokens) (`sbp_...`) if you prefer curl over the Dashboard editor. Same single-file bundles as Method A.

**Token:** Account → Access Tokens → Generate (needs `edge_functions_write`; use `secrets_write` only if setting secrets via API).

**Deploy `vision-analyze`:**

```bash
cd "C:/Users/thenu/Downloads/STEM Mind AI"

curl --request POST \
  "https://api.supabase.com/v1/projects/jxhljizbivkrnpzwswce/functions/deploy?slug=vision-analyze" \
  --header "Authorization: Bearer YOUR_SBP_TOKEN" \
  --form 'metadata={"entrypoint_path":"index.ts","name":"vision-analyze","verify_jwt":false}' \
  --form "file=@supabase/dashboard-deploy/vision-analyze.ts"
```

**Deploy `stem-live`:**

```bash
curl --request POST \
  "https://api.supabase.com/v1/projects/jxhljizbivkrnpzwswce/functions/deploy?slug=stem-live" \
  --header "Authorization: Bearer YOUR_SBP_TOKEN" \
  --form 'metadata={"entrypoint_path":"index.ts","name":"stem-live","verify_jwt":false}' \
  --form "file=@supabase/dashboard-deploy/stem-live.ts"
```

**Set secrets via API (optional):**

```bash
curl --request POST \
  "https://api.supabase.com/v1/projects/jxhljizbivkrnpzwswce/secrets" \
  --header "Authorization: Bearer YOUR_SBP_TOKEN" \
  --header "Content-Type: application/json" \
  --data '[{"name":"FIREBASE_PROJECT_ID","value":"g9-tutor"}]'
```

Add optional keys the same way (`OPENROUTER_API_KEY`, etc.). Do not use `SUPABASE_` names.

API reference: [Deploy a function](https://supabase.com/docs/reference/api/v1-deploy-a-function), [Bulk create secrets](https://supabase.com/docs/reference/api/v1-bulk-create-secrets).

On Windows PowerShell, use `` ` `` for line continuation instead of `\`, or run as one line.

---

## Method C — Supabase CLI (if it works on your machine)

Install: https://supabase.com/docs/guides/cli

```bash
cd "C:/Users/thenu/Downloads/STEM Mind AI"
supabase login
supabase link --project-ref jxhljizbivkrnpzwswce
supabase secrets set FIREBASE_PROJECT_ID=g9-tutor
# Optional:
# supabase secrets set OPENROUTER_API_KEY=your-key
supabase functions deploy vision-analyze --project-ref jxhljizbivkrnpzwswce
supabase functions deploy stem-live --project-ref jxhljizbivkrnpzwswce
```

If CLI deploy fails on Windows, use **Method A** or **Method B**.

---

## Verify CORS with curl

### vision-analyze OPTIONS

```bash
curl -i -X OPTIONS "https://jxhljizbivkrnpzwswce.supabase.co/functions/v1/vision-analyze" \
  -H "Origin: https://stemmindv1.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,apikey,content-type,x-client-info,x-supabase-api-version"
```

Expect HTTP **204** (or **200**) and:

- `Access-Control-Allow-Origin: https://stemmindv1.netlify.app`
- `Access-Control-Allow-Methods` includes `POST` and `OPTIONS`

### stem-live OPTIONS

```bash
curl -i -X OPTIONS "https://jxhljizbivkrnpzwswce.supabase.co/functions/v1/stem-live" \
  -H "Origin: https://stemmindv1.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,apikey,content-type,x-client-info,x-supabase-api-version"
```

### Local dev origin

```bash
curl -i -X OPTIONS "https://jxhljizbivkrnpzwswce.supabase.co/functions/v1/vision-analyze" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,apikey,content-type"
```

---

## Frontend after functions deploy

1. Set `VITE_SUPABASE_CONFIG` in Netlify (or `.env.local`):

```json
{"url":"https://jxhljizbivkrnpzwswce.supabase.co","anonKey":"YOUR_ANON_KEY"}
```

2. Redeploy the Netlify site (`stemmindv1.netlify.app`).
3. Sign in with Firebase, open a student, test **Open Camera**, **Analyze Image**, and **STEM Live**.

---

## Troubleshooting

### "Name must not start with the SUPABASE_ prefix"

Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` automatically. Add only `FIREBASE_PROJECT_ID` and optional provider keys.

| Symptom | Fix |
|---------|-----|
| Browser: “Failed to fetch” on analyze/live | Redeploy both functions; run curl OPTIONS above; confirm JWT verification is **off** |
| OPTIONS not 200/204 | Function not deployed, wrong name, or boot error — redeploy paste bundle; set `FIREBASE_PROJECT_ID=g9-tutor` |
| CORS still failing | Function slug must be exactly `vision-analyze` / `stem-live`; redeploy; check JWT toggle |
| 401 on POST | `FIREBASE_PROJECT_ID` must be `g9-tutor` and match Firebase web app; send Firebase ID token in `Authorization` |
| Camera preview blank | Use latest frontend (stream attaches after video mounts) |
| Extra preview URL | Add `CORS_ALLOWED_ORIGINS` secret or extend origins in `supabase/functions/_shared/cors.ts` and regenerate dashboard bundles |
