# NexLearn — full product redesign

An AI-powered adaptive STEM learning platform for Grades 9–11 (Sri Lankan
syllabus), rebuilt ground-up: marketing site, application, 15-agent AI council,
and **Nex** — an original 3D companion avatar. (NexLearn = the platform; Nex =
the character who lives inside it.)

## Architecture

| Layer | Stack | Notes |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | Migrated from the legacy Vite/JS build — a council of 15 agents with streamed contracts needs end-to-end types. Tradeoff: full rewrite, accepted per brief. |
| Data | **PostgreSQL + Drizzle ORM** | `students`, `sessions`, `attempts` — the legacy Firebase+Supabase integration points are replaced by a first-party schema (legacy stack required external accounts; this build is self-contained). See *Migration notes*. |
| 3D | **Three.js + React Three Fiber + drei** | One pipeline for hero, dock, teaching mode and live mode. |
| Motion | **GSAP + ScrollTrigger** (marketing) · CSS token motion (app) | No fade-in-on-scroll defaults. |
| AI execution | **In-process heuristic council** with an LLM-ready seam | 15 specialists, true parallel DAG layers, NDJSON streamed. |

## The AI Council (hard requirement: ≥10 truly concurrent specialists)

`src/agents/registry.ts` defines **15** agents with non-overlapping roles,
executed by `src/agents/runner.ts` in dependency layers:

- **L0 (7 concurrent):** analyst · curriculum · difficulty (Elo-style) ·
  screener · exam-intel · motivator · pace
- **L1 (3 concurrent):** teacher (generator) · rubric (evaluator) · guardian
- **L2 (4 concurrent):** explainer · stepsmith (visual teacher) · director
  (Nex) · council-audit
- **L3 (1):** leader (fuses the payload)

Layers fan out with `Promise.allSettled`; only true dependencies serialize.
Per-agent hard timeouts + graceful partial failure mean one slow agent can't
block the other fourteen. Runs stream as NDJSON from `POST /api/council`.

**Observable three ways:**
1. In-app: question generation and marking show the **Agent Activity Monitor**
   instead of a spinner (`src/components/AgentMonitor.tsx`).
2. Landing page: *Run a live burst* fires **one fetch per agent concurrently**
   (probe mode, zero pacing, raw compute timings) — visible in Network as 15
   concurrent in-flight requests.
3. Teacher dashboard: the same monitor as a transparency/diagnostics panel.

> Honesty note: streamed runs add a seeded per-agent *pacing window* so humans
> can watch concurrency happen; the computation itself is real (bank screening,
> Elo calibration, rubric scoring, misconception tagging, whiteboard planning).
> Probe mode has no pacing and reports raw compute time. Wire `GEMINI_API_KEY`
> (server-side env only) into the seam in a follow-up to let `teacher`,
> `explainer` and `director` delegate NL drafting to the model — keys never
> touch the client.

## Nex (avatar)

- Character spec: `docs/nex-character-spec.md` (silhouette, materials, rig
  targets, production-GLB brief).
- Behavior Engine: `src/components/nex/behavior.ts` — deterministic state
  machine, closed 23-clip vocabulary, defensive `sanitizeAction` so malformed
  LLM JSON can never freeze him.
- Renderer: `src/components/nex/NexModel.tsx` — original procedural rig
  (placeholder-tier by design; swappable for a GLB without touching the
  engine). Amplitude-driven talk cycle, cursor-aware gaze, spontaneous blinking.
- Fallbacks: `prefers-reduced-motion`, ≤2-core devices, missing WebGL and GPU
  errors all degrade to the static `NexPoster` SVG.

## Surfaces

- `/` — marketing site: hero (live Nex), pinned scroll narrative of the product
  loop, live council section, outcomes (measurement system, no invented
  numbers), For Teachers (light passage), access, editorial footer.
- `/app` — student Learning Hub (roster picker, mastery, session launch).
- `/app/quiz` — adaptive quiz view: 4 question kinds, **"I'm stuck"** → Nex
  reacts → Teaching Mode whiteboard (`whiteboard.tsx`, SVG, narratable).
- `/app/teacher` — control-room dashboard: roster, per-student evidence,
  heatmap, trajectories, add/remove students, council diagnostics.
- `/app/live` — live tutor: mic + waveform, speech recognition where available,
  TTS voice, camera preview with periodic observations.

## Performance & accessibility budgets

- R3F scenes: lazy via `next/dynamic` (SSR off), DPR clamped to 1.75,
  `powerPreference: high-performance`, no runtime HDR fetches (explicit lights).
- Landing renders Nex above the fold from a ~1s-interactive static poster first;
  council/monitor code is client-split.
- `prefers-reduced-motion`: GSAP pin disabled, avatar → poster, token motion
  collapsed globally.
- WCAG AA contrast inside the dark palette; keyboard-focusable everything;
  semantic headings; `aria-live` on the agent monitor.

## Migration notes (from STEM-Mind-AI legacy)

- Legacy repo (Vite + React JS + Firebase auth + Supabase edge functions) was
  superseded by this self-contained Next.js build: teacher-provisioned demo
  roster replaces Firebase auth (auth was out of redesign scope and required
  external accounts), Postgres/Drizzle replaces Supabase data, and the
  client-side Gemini calls are replaced by the server-side council (closing the
  documented API-key exposure gap). Agent roster conceptually preserved and
  formalized from the legacy Harmony engine.
- Punch list: (1) production-sculpted Nex GLB per `docs/nex-character-spec.md`;
  (2) real-teacher auth (NextAuth/Clerk) before production; (3) Gemini-backed
  NL drafting behind `GEMINI_API_KEY`; (4) per-class grouping for multi-teacher
  schools.

## Run

```bash
npm install
npx drizzle-kit push     # provision schema (local PG via DATABASE_URL)
npm run build && npm start
# demo data: the hub/dashboard auto-seed on first load, or POST /api/seed
```
