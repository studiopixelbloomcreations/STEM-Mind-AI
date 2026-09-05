# NexLearn — $10M Full Product Redesign

> **"The operating system for a personal AI STEM education."**
> Quiet confidence — a precision instrument for learning, designed for Grades 9–11 students and teachers.

---

## 1. Executive Summary & Naming

- **Product / Platform:** **NexLearn** (always one word, capital N, capital L).
- **3D AI Companion Avatar:** **Nex** (the embodied tutor living inside the platform). Never call the character "NexLearn" and never call the whole platform "Nex".

This repository contains the complete $10,000,000-grade product redesign of NexLearn, superseding the legacy STEM-Mind-AI prototype with an Awwwards/FWA-caliber marketing experience, high-density teacher control room, focused student learning hub, adaptive quiz engine with an interactive teaching whiteboard, and an original 3D avatar with a deterministic behavior engine.

---

## 2. Technical Architecture & Decisions

| Layer | Technology | Rationale & Architectural Choice |
|---|---|---|
| **Frontend Framework** | **React 19 + Vite 8** | Preserves zero-friction local development and deployment. Delivers sub-20s production builds, automatic route-level code splitting (`LandingPage`, `TeacherDashboard`, `StudentHub`, `QuizView`, `TeachingWhiteboard`, `LiveTutorMode`, and `Nex`), and seamless WebGL/MediaPipe interop without SSR hydration mismatch risks. |
| **3D Avatar Pipeline** | **Three.js + React Three Fiber + Drei** | Single unified 3D pipeline powering the marketing hero, docked learning presence, full-screen live tutor, and teaching mode. Built as an original procedural bone-ceramic rig (`src/components/nex/Nex.jsx`) with custom GLSL shaders, requiring zero MB external asset downloads and running at 60fps on mid-range devices. |
| **Motion Grammar** | **CSS Design Tokens + GSAP choreography** | Directed, meaningful motion governed by tokens (`--ease-settle`, `--ease-exit`, `--ease-spring`, `--dur-1` to `--dur-4`). Fully responsive with comprehensive `prefers-reduced-motion` compliance. |
| **Backend & Services** | **Firebase Auth + Supabase Edge Functions** | Preserves existing, proven backend infrastructure per brief requirements. User authentication runs via Firebase; persistent telemetry and proxy functions run via Supabase. All AI API calls route through authenticated proxy endpoints with live JWT tokens. |
| **AI Multi-Agent Council** | **13-Agent DAG Orchestrator** | Multi-agent council (`src/council/orchestrator.js` and `src/council/roster.js`) running in parallel DAG dependency layers. Backed by a verified offline curriculum bank for Sri Lankan Grades 9–11 syllabus (Mathematics, Physics, Chemistry, Science). |

---

## 3. What Was Preserved vs. What Changed

### Preserved:
1. **Firebase Authentication:** Preserved Google/email teacher auth session management (`src/config/firebase.js`, `src/components/LoginGate.jsx`).
2. **Supabase Data Layer:** Preserved database tables and edge function endpoints (`src/config/supabase.js`).
3. **Live Camera & Vision Pipelines:** Preserved `@mediapipe/tasks-vision` and camera capture infrastructure, re-architected inside `LiveTutorMode.jsx`.
4. **Curriculum Alignment:** Grounded in Sri Lankan curriculum for Grades 9–11.

### Ground-Up Rebuilt / New:
1. **Awwwards-Level Marketing Site:** 8 complete sections (`Hero`, `Narrative`, `Council`, `Proof`, `ForTeachers`, `Access`, `Footer`) utilizing the Deep Field (`#060B0A`), Volt (`#D7FF4A`), Signal Coral (`#FF5A3C`), Glacier (`#8FCCFF`), and Paper (`#F2EFE6`) palettes.
2. **Design Token System:** `src/design/tokens.css`, `base.css`, `components.css`, and `runtime.js` as single sources of truth.
3. **Nex Original Avatar & Rig:** Procedural bone-ceramic companion with amplitude-driven talk loop, eye squish, spontaneous blinks, antenna wobble, and hover-skid ground glow.
4. **Deterministic Behavior Engine:** 3-layer architecture (`director.js`, `behaviorEngine.js`, `clips.js`) enforcing a closed 23-clip vocabulary with defensive fallback to `idle` on malformed inputs.
5. **Interactive Teaching Whiteboard:** SVG-based interactive canvas (`TeachingWhiteboard.jsx`) with multi-step concept progression, mathematical typesetting (`prepMath`), diagram rendering, and audio narration synchronization.
6. **"I'm Stuck" Interaction:** Non-abrupt empathetic sequence in `QuizView.jsx` triggering Nex's supportive lean and smooth transition into teaching mode.
7. **Teacher Control Room:** High-density, instrument-style analytics dashboard (`TeacherDashboard.jsx`) with real topic mastery derivation, student rosters, and agent monitor transparency.
8. **Live Tutor Mode:** Conversational interface (`LiveTutorMode.jsx`) with Web Audio API waveform visualization, speech recognition, camera capture, and state-synced Nex animations.

---

## 4. Deliverables Checklist Status

- [x] **1. Design language document:** `docs/DESIGN_LANGUAGE.md` + `src/design/tokens.css`
- [x] **2. Nex character design spec:** `docs/NEX_SPEC.md`
- [x] **3. Landing / marketing website:** `src/marketing/LandingPage.jsx` and subcomponents
- [x] **4. App shell + component library:** `src/components/ui/index.jsx` + `src/design/components.css`
- [x] **5. Teacher Dashboard redesign:** `src/components/teacher/TeacherDashboard.jsx`
- [x] **6. Student Learning Hub + Quiz View + Teaching Mode Whiteboard:** `src/components/student/`
- [x] **7. Live Tutor Mode UI redesign:** `src/components/student/LiveTutorMode.jsx`
- [x] **8. Nex R3F integration + Behavior Engine:** `src/components/nex/Nex.jsx` + `src/nex/`
- [x] **9. Technical README & Contracts:** `README.md` + `docs/CONTRACTS.md`

---

## 5. Local Setup & Verification

### Installation
```bash
npm install
```

### Run Automated Verification Suite
Validates all 12 contract events, behavior engine sanitization, orchestrator fallback bank, whiteboard teaching steps, and numerical tolerance evaluation:
```bash
npm run verify
```
Expected output: `11/11 checks passed`.

### Development Server
```bash
npm run dev
```
Navigate to:
- `http://localhost:5173/#/` — Public Marketing Landing Page
- `http://localhost:5173/#app` — NexLearn Application (Teacher Dashboard & Student Hub)

### Production Build
```bash
npm run build
npm run preview
```

---

## 6. Punch List & Next Steps

1. **Commissioned 3D Asset Handoff:**
   The current procedural primitive rig in `src/components/nex/Nex.jsx` fulfills all functional, animation, and performance requirements. To commission a final high-fidelity PBR GLB model, hand `docs/NEX_SPEC.md` directly to a 3D artist or AI generator (e.g. Meshy/Rodin). The model hierarchy and naming conventions are strictly defined in Appendix A & B of `docs/NEX_SPEC.md` for drop-in replacement.
2. **Supabase Edge Function Deployment:**
   To deploy the council proxy with live Gemini streaming to Supabase, follow the deployment guide in `docs/supabase-edge-functions-deploy.md`.
3. **Production Domain Routing:**
   Configure production reverse proxy or hosting CDN (Netlify/Vercel) to rewrite hash routes cleanly as configured in `public/_redirects` and `vercel.json`.

