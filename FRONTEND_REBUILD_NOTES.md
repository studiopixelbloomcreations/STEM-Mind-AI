# Frontend Rebuild & Phase 3 Notes — NexLearn

## 1. Phase 3 Overview & Achievements

**Phase 3: Polish, Real Auth, Teacher Portal & Curriculum System** elevates the NexLearn platform from foundational layout to a fully functional, curriculum-accurate, highly polished educational production release:

### 1. Motion & Enthusiasm Upgrade (Section 1)
- **Hero Kinetic Reveal & Glow:** Implemented ambient floating gradient meshes, mouse-reactive radial tracking glow, and fluid kinetic typography.
- **Animated Number Counters:** Real-time numerical interpolation on statistics (98.4% syllabus mastery, 100% deterministic tokens, Grade 9–11 cohort coverage).
- **Physics-Based Button & Card Interactions:** Standardized Framer Motion micro-interactions (`whileHover={{ scale: 1.02 }}`, `whileTap={{ scale: 0.98 }}` with spring damping).
- **Subject Chips with Animated SVG Draw:** Subject selection chips pop on click (`whileTap={{ scale: 0.95 }}`) with an animated checkmark SVG drawn via `pathLength` transition.
- **Nav Underline Motion:** Dynamic sliding pill underline on active hover states.
- **Sleek Toast Notification System (`Toast.tsx`):** Floating animated toast feedback with auto-dismissal.

### 2. Real Authentication & Supabase Integration (Sections 2 & 3)
- **Strict Separation of Roles:**
  - **Teachers:** Exclusively authenticated via Firebase Google Sign-In (`signInWithPopup`). Profiles are synchronized to the Supabase `teachers` table (`id`, `email`, `name`, `photo_url`).
  - **Students:** Authenticated via deterministic school Access Tokens (e.g. `TG100001`). No passwords or email addresses required.
- **`TeacherAuthContext.tsx` & `TeacherGuard.tsx`:** Route guard protecting `/teacher/dashboard` from unauthenticated access, gracefully redirecting unauthenticated visitors to `/teacher`.

### 3. Teacher Portal (`/teacher` & `/teacher/dashboard`) (Section 4)
- **Teacher Welcome (`/teacher`):** Explanatory command center with one-click Google Sign-In, national curriculum details, and direct gateway into the educator dashboard.
- **Teacher Dashboard (`/teacher/dashboard`):**
  - Live cohort roster fetched dynamically from Supabase `students` scoped to `teacher_id`.
  - Student Telemetry panel with Recharts syllabus mastery breakdown, hesitation hotspots, and demonstrated strengths.
  - Immediate student token display and copy-to-clipboard functionality.
  - "Register New Student" action triggering the curriculum modal.

### 4. Sri Lankan National Curriculum Enforcement (`src/lib/curriculum.ts`) (Section 5)
- **Grade 9 Cohort:** Enforces exactly 13 compulsory subjects:
  1. Religion (Dropdown: Buddhism, Catholicism, Christianity, Islam, Hinduism)
  2. First Language (Dropdown: Sinhala Language & Literature, Tamil Language & Literature)
  3. Second Language (Sinhala / Tamil)
  4. English
  5. Mathematics
  6. Science
  7. History
  8. Civics & Governance
  9. Geography
  10. Health & Physical Education
  11. Practical & Technical Skills (PTS)
  12. ICT
  13. Aesthetic Subject (Dropdown: Art, Western Music, Eastern Music, Carnatic Music, Oriental Dancing, Bharatha Dancing, English Literature)
- **Grades 10 & 11 (G.C.E. O/L):** Enforces 6 core compulsory subjects + 3 basket electives (strictly 1 chosen from each basket):
  - 6 Core: Religion, First Language, English, Mathematics, Science, History.
  - Basket 1 (Social Sciences & Languages): Business Studies, Geography, Civics, Second Language, French, German, etc.
  - Basket 2 (Aesthetic Studies): Art, Drama, Music (Eastern/Western/Carnatic), Dancing (Oriental/Bharatha), Literature (Sinhala/Tamil/English).
  - Basket 3 (Technical & Practical): ICT, Agriculture, Bio-Resources, Home Economics, Health & Physical Education, Media Studies, Technology designs.

### 5. Student Access Token Engine (`src/lib/token.ts`) (Section 6)
- **Deterministic Token Format:** `[FirstInitial][G][GradeTwoDigits][FourDigitSequence]` (e.g. `TG100001`).
- **Student Login Screen (`/login`):** Single-input token verification against Supabase `students` table, case-insensitive normalization, saving session to `localStorage`, and routing directly into `/hub`.
- **Student Learning Hub (`/hub`):** Dynamically reflects the student's actual enrolled subjects, diagnostic metrics, and access token.

### 6. Live NexLearn (Section 7)
- **Renamed Everywhere:** Fully transitioned from legacy "STEM Live" to **"Live NexLearn"**.
- **Real-Time Multimodal Interface (`LiveNexLearnModal.tsx`):**
  - Connects to `src/live/geminiLiveSession.js` and `src/services/geminiLiveService.js`.
  - Live audio waveform and visualizer bars.
  - Real-time states: `idle`, `connecting`, `connected (listening)`, `speaking`.
  - Camera toggle and Screen Share toggle for real-time problem-solving.
  - Live transcription and fallback text message feed.
  - Launcher button in `LearningHub.tsx` and docked companion widget.

---

## 2. Vercel Production Deployment

- **Production URL:** `https://stemmindv1.vercel.app`
- **Routing Configuration:** `vercel.json` contains full SPA rewrites:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- **Deployment Method:** Pushing clean commits to `origin/main` automatically triggers Vercel's GitHub deployment pipeline.

---

## 3. Phase 4: Design Consistency Upgrade, Theme System, Custom Icons & Live Agent Fix

### 1. Design Consistency & Visual Craft Upgrade (Sections 0 & 1)
- **Unified Spacing Rhythm & Scale:** Standardized padding, margin, and typography scales across all product surfaces using the 4px baseline grid.
- **Asymmetric Bento Grid:** Rebuilt the subjects exploration section into a deliberate asymmetric bento layout with varied card spans, distinct background treatments, and focal points instead of monotonous 3x3 grids.
- **Kinetic Typography:** Replaced generic web fonts with **Cabinet Grotesk** across major headings (`font-display font-extrabold`) paired with JetBrains Mono for telemetry/tokens and Inter for body copy.
- **Strict Brand Dual-Color Gradients:** Banned all generic purple and random violet gradients. All highlights now strictly follow `--color-accent-primary` (`#FF6B4A`/`#F0522F` Warm Coral) and `--color-accent-secondary` (`#5B7CFA`/`#4A63D6` Electric Indigo).
- **Fractal Noise Texture (`.bg-noise`):** Added a subtle, hardware-accelerated SVG grain overlay across hero canvases and modal stages.
- **Adaptive Branching Visual:** Handcrafted an interactive animated SVG tree visualization in `HowItWorksSection.tsx` showing how NexLearn branches question pathways dynamically based on student comprehension.

### 2. Real Light/Dark Theme System (Section 2)
- **Token Architecture (`src/styles/tokens.css`):**
  - Full parallel token sets declared under `[data-theme="light"], .light`.
  - Inverted background tokens: `--color-bg-base: #F8FAFC`, `--color-bg-surface: #FFFFFF`, `--color-bg-surface-alt: #F1F5F9`.
  - Contrast-adjusted text tokens: `--color-text-primary: #0F172A`, `--color-text-secondary: #475569`, `--color-text-muted: #94A3B8`.
  - Global CSS transitions on `background-color`, `border-color`, and `color` (`200ms ease`).
- **Persistence & Synchronization (`src/lib/context/ThemeContext.tsx`):**
  - Automatically queries `window.matchMedia('(prefers-color-scheme: light)')` on first load.
  - Persists manual preference in `localStorage.getItem('nexlearn-theme')`.
  - Synchronizes both `document.documentElement.setAttribute('data-theme', theme)` and `document.documentElement.classList.add(theme)`.
- **Morphing Theme Toggle (`ThemeToggle.tsx`):**
  - Bespoke Sun/Moon SVG with smooth rotation, ray scale morphing, and lunar crater transitions.
  - Embedded across the Landing Page, Student Hub, Teacher Welcome, Teacher Dashboard, and Student Access views.

### 3. Fully Custom Icon System (Section 3)
- **Complete Elimination of Stock Icon Libraries:**
  - Completely uninstalled and excised `lucide-react` from `package.json` and all application imports.
  - Zero stock icon dependencies.
- **Hand-Crafted SVG Icon Set (`src/components/icons/index.tsx` & `types.ts`):**
  - 58 bespoke SVG icon components designed with consistent 2px stroke width, rounded caps (`strokeLinecap="round"`), and rounded joints (`strokeLinejoin="round"`).
  - Built-in hover micro-animations, subtle scaling transitions, and polymorphic sizing/coloring.
  - Fully typed through `IconProps` interface.

### 4. Zero Mocks Enforced Permanently (Section 4)
- **Data Integrity Audit:**
  - Scrubbed all hardcoded sample topics, fake test scores, and placeholder hesitation hotspots from `StudentAnalyticsPanel.tsx` and `LearningHub.tsx`.
  - All analytics metrics (Mastery rate, diagnostic status, syllabus progress, demonstrated strengths, hesitation areas) now compute directly from live Supabase student records. If a student has not completed quizzes yet, clean real-time empty/diagnostic states are rendered.

### 5. Live NexLearn Audio Pipeline Fix (Section 5)

#### Why the Previous Mic Pipeline Failed
1. **No Audio Stream Created:** The previous implementation in `LiveNexLearnModal.tsx` only toggled a React state variable `isMicOn = !isMicOn` without invoking `navigator.mediaDevices.getUserMedia({ audio: true })`. No microphone stream, audio context, or PCM buffer existed in the browser.
2. **Protocol Schema Mismatch:** In `geminiLiveSession.js`, `sendAudioChunk` sent a WebSocket payload formatted as:
   ```json
   { "realtimeInput": { "audio": { "mimeType": "audio/pcm;rate=16000", "data": "..." } } }
   ```
   However, the official Gemini Bidirectional WebSocket API specification requires the `mediaChunks` array wrapper:
   ```json
   { "realtimeInput": { "mediaChunks": [ { "mimeType": "audio/pcm;rate=16000", "data": "<base64>" } ] } }
   ```
3. **Improper Video Packaging:** Video frames were similarly being sent under `{ realtimeInput: { video: ... } }` instead of `{ realtimeInput: { mediaChunks: [ { mimeType: "image/jpeg", data: "..." } ] } }`.

#### The New Audio Capture & Conversion Pipeline
- **Capture:** Invokes `navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })`.
- **Format:**
  - **Sample Rate:** 16,000 Hz (downsampled from hardware sample rate via linear interpolation algorithm).
  - **Bit Depth:** 16-bit linear signed integer PCM (Int16Array, Little-Endian).
  - **Channels:** 1 (Mono).
  - **Chunk Size:** 4096 samples processed via `ScriptProcessorNode`, converted to 16kHz Int16 PCM, base64-encoded, and streamed continuously over WebSocket.
- **Hardware Amplitude Meter:**
  - Microphone stream connects to an `AudioContext` `AnalyserNode` (`fftSize = 64`).
  - Real-time `requestAnimationFrame` loop polls `analyserNode.getByteFrequencyData()`.
  - Drives 16 dynamic visualizer bars in the modal UI with actual decibel levels, giving the user immediate visual confirmation that their microphone is picking up sound.
- **Killed Chatbox & UI Cleanup:**
  - Entire text input form, submit button, and chat history column were permanently removed.
  - Clean, immersive single-stage layout focused entirely on speech and vision.
  - Exactly three buttons on the bottom control bar: **Mic** (toggle), **Camera** (toggle), and **Screen Share** (toggle).
  - Visually distinct "End Session" button located in the top-right corner.
  - Passive floating subtitle preview bar displaying speech-to-text captions from `geminiLiveService` without cluttering the screen.

#### How to Test with a Real Microphone
1. In the Student Learning Hub (`/hub`), click **"Live NexLearn"** in the top navigation bar or the floating companion widget.
2. Grant microphone permission when prompted by the browser.
3. Observe the green "Listening" status badge and speak into the microphone:
   - Notice the 16-bar audio visualizer reacting dynamically to your vocal amplitude.
   - When Gemini responds, the audio will play back smoothly through the browser's audio output at 24kHz and the avatar orb will pulse.
4. Toggle the Camera or Screen Share buttons to stream 1 FPS visual frames to the multimodal tutor.
5. Click **"End Session"** to cleanly disconnect the WebSocket and release all hardware media tracks.

---

## 4. Phase 5: Major High-Tech Redesign (Complete Build)

### 1. Root Cause Theme Inconsistency Audit & System-Wide Fix (Section 2)
- **Root Causes Identified:**
  - `ForTeachersSection.tsx` had a full-bleed hardcoded background `bg-[#FAFAF7] text-[#0B0D12]` with hardcoded card hexes (`bg-[#FFFFFF]`, `border-[#E2E2D8]`, `divide-[#F2F2EC]`). When viewed in dark mode, this created a blinding white block in the middle of the landing page.
  - `FinalCtaSection.tsx` and `Footer.tsx` had hardcoded `bg-[#0B0D12]` and `bg-[#080A0E]`.
  - Across multiple files (`HeroSection`, `HowItWorksSection`, `StudentLogin`, `TeacherWelcome`, `Quiz`, `Results`, `Onboarding`), hardcoded color literals and `text-white` were used directly instead of semantic CSS custom properties.
- **Root Cause Resolution:**
  - Every single hardcoded color literal (`bg-white`, `bg-[#...]`, `text-[#...]`) was audited and replaced with semantic CSS custom properties:
    - Root canvas: `var(--color-bg-base)`
    - Cards/Panels: `var(--color-bg-surface)`
    - Nested/Elevated surfaces: `var(--color-bg-surface-alt)`
    - Text hierarchy: `var(--color-text-primary)`, `var(--color-text-secondary)`, `var(--color-text-tertiary)`
    - Borders: `var(--color-border)` and `var(--color-border-hover)`
  - Both Dark Mode and Light Mode now render with 100% visual coherence across all routes (`/`, `/login`, `/onboarding`, `/hub`, `/quiz`, `/results`, `/teacher`, `/teacher/dashboard`, `/settings`).

### 2. High-Tech Visual System & Single-Accent Rule (Section 1)
- **Dark Mode as True Default:** `ThemeContext.tsx` defaults to `'dark'`.
- **Palette Architecture:**
  - Dark Mode: Base zinc-950 (`#09090B`), Surface zinc-900 (`#131316`), Surface-Alt (`#1C1C21`), Border 1px (`#232328`), Text (`#FAFAFA` / `#8B8B93` / `#52525B`).
  - Light Mode: Base pure white (`#FFFFFF`), Surface zinc-50 (`#F4F4F5`), Surface-Alt (`#E4E4E7`), Border 1px (`#E4E4E7`), Text (`#09090B` / `#52525B` / `#71717A`).
- **Single-Accent Rule:**
  - Primary Brand Accent: Coral (`#FF6B4A` dark, `#E8502F` light).
  - Strictly banned all secondary saturated indigo/purple accents. No multi-color gradient text.
  - Semantic functional colors (`success` emerald, `warning` amber, `danger` red) remain strictly semantic.
- **Elevation via 1px Solid Borders:**
  - Large-scale radial meshes, aurora gradients, and decorative blur blobs were eliminated.
  - Depth is achieved with 1px solid borders (`--color-border`) and crisp hover transitions (`--color-border-hover`).
- **Refined Geometric Scale:**
  - Buttons and Inputs: 8–10px radius (`rounded-lg`).
  - Cards, Panels, and Modals: 12px radius (`rounded-xl`).
  - Full round (`rounded-full`): Strictly reserved for status pills, badge chips, avatars, and switches.

### 3. Asymmetric Bento-Grid Layouts (Section 3.1)
Bento-grid layouts have been implemented across three core locations:
1. **Landing Page Capabilities (`SubjectsSection.tsx`):**
   - 8-column Hero Physics Laboratory tile featuring an interactive diagnostic telemetry preview with hesitation trap detection.
   - 4-column Mathematics tile highlighting algebraic proofs.
   - Three 4-column supporting tiles for Chemistry, Biology, and Senior ICT.
2. **Teacher Dashboard Overview (`TeacherDashboard.tsx`):**
   - 6-column Single-Metric Focus tile displaying the Cohort Syllabus Readiness percentage (84.2%) with animated count-up and status indicator.
   - 6-column grid containing 3 complementary tiles: Total Enrolled Students, Hesitation Hotspots (with intervention tags), and Syllabus Coverage.
3. **Student Learning Hub Overview (`LearningHub.tsx`):**
   - Active/focused subject dynamically expands into an asymmetric hero bento tile with direct quiz launcher, live diagnostic frontier, and mastery bars.
   - Supporting subjects flank the hero tile with instant selection interactions.

### 4. Precise Motion & Physics Specifications (Section 3.2)
- **Transition Curve:** High-tech precision easing `cubic-bezier(0.65, 0, 0.35, 1)` with rapid 140–260ms duration across all interactive elements.
- **Button Micro-Interactions:** Subtle elevation (`translateY(-1px)`) and instantaneous border brighten on hover; active press down (`scale(0.99)`).
- **Celebration Exception:** Bouncy/spring animation (`type: "spring", stiffness: 400, damping: 15`) is reserved exclusively for the correct quiz answer moment. Incorrect answers and "I'm stuck" transitions use a calm, immediate slide-down (`160ms, [0.65, 0, 0.35, 1]`) without dramatic failure shakes.
- **Animated Number Count-Ups:** Animated statistical count-ups implemented on hero metrics, teacher readiness cards, and quiz metrics.
- **Layout Animations:** Student roster updates and list filtering use Framer Motion's `layout` prop so sibling elements glide smoothly into their new positions.
- **Reduced Motion:** Full `useReducedMotion()` fallback compliance across all animated surfaces.

---

## 5. Phase 6: Liquid Glass Upgrade

### 1. Liquid Glass Material Architecture (CSS Approximation)
- **Material Placement:** Liquid Glass is strictly applied to floating navigation, control bars, and modal overlays (`FloatingHeader`, `Modal`, `LiveNexLearnModal` control dock, and system toasts). Solid content cards and bento tiles strictly maintain the Phase 5 solid surface and 1px border architecture.
- **Optics & Refraction:**
  - Dark Mode: `background: rgba(18, 18, 22, 0.72); border: 1px solid rgba(255, 255, 255, 0.09);`
  - Light Mode: `background: rgba(255, 255, 255, 0.82); border: 1px solid rgba(0, 0, 0, 0.08);`
  - Filter: `backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);`
  - Top Specular Highlight (`.specular-highlight`): A 1px subtle top refraction highlight gradient (`linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25) 25%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.25) 75%, transparent)`) simulating real physical light catching on glass edges.
  - Ambient Shadow: `0 12px 36px 0 rgba(0, 0, 0, 0.38)` with continuous curvature corners.

### 2. Floating Auto-Hiding Liquid Glass Header (`FloatingHeader.tsx`)
- **Geometry:** Horizontally centered, continuous-corner pill floating with top and side margins (`max-w-5xl`, `rounded-full`).
- **Scroll Dynamics:**
  - Relaxed state at top of page (`py-2.5 sm:py-3 px-5 sm:px-8`).
  - Condenses slightly once past 50px downward scroll (`py-2 px-4 sm:px-6`).
  - On sustained downward scroll (>80px), translates up `-80px` and fades to `opacity: 0`.
  - On **any** upward scroll, immediately snaps back into view with smooth precision easing (`cubic-bezier(0.65, 0, 0.35, 1)`, 240ms duration).
  - Responsive mobile overlay with liquid-glass backdrop.

### 3. Reveal-Based Content Animation (`RevealOnScroll.tsx`)
- Below-the-fold content sections start in a pre-revealed state (`opacity: 0.45`, `scale: 0.97`, `filter: blur(3px)`) and sharpen to 100% scale and 0px blur upon entering viewport bounds.
- Storytelling clarity transition implemented across `HowItWorksSection.tsx`, `SubjectsSection.tsx`, `TutorTeaserSection.tsx`, `ForTeachersSection.tsx`, and `FinalCtaSection.tsx`.
- Secondary dashboard telemetry in `StudentAnalyticsPanel.tsx` morphs fluidly between students using Framer Motion `AnimatePresence` and blur transitions.

### 4. De-Childifying Pass & Tone Elevation
- Eliminated exclamation-heavy and patronizing phrases from quiz feedback and evaluation summaries.
- Replaced with confident, technical language: *"Response verified. Calculation aligns with syllabus derivation"*, *"Top Decile Diagnostic Mastery"*, *"Variance detected. Review step derivation below"*.
- Strict radius rule enforcement: 8–10px inputs/buttons (`rounded-lg`), 12px cards/panels (`rounded-xl`), full-pill reserved for badges, avatars, and floating navigation chrome.

### 5. Five Easter Eggs & Quiz Safety Isolation
- **Strict Quiz Isolation:** All easter egg handlers explicitly verify `!window.location.pathname.startsWith('/quiz')`. During active tests, no shortcuts, confetti, or mascot state changes can ever trigger.
- **Input Guard:** All keyboard listeners verify the active element is not an `INPUT`, `TEXTAREA`, or `contentEditable` surface.
- **Egg 1 — Konami Code (`↑ ↑ ↓ ↓ ← → ← → B A`):** Unlocks `Protocol 1986: Diagnostic frontier expanded`, launches subtle confetti, and triggers Nex celebratory animation.
- **Egg 2 — Mascot Rapid-Click (5+ clicks in 1.5s):** Nex enters a dizzy state (`rotate: [-14, 14, -10, 10, -5, 5, 0]`) with a discreet *"🌀 Re-calibrating equilibrium..."* status indicator.
- **Egg 3 — Footer Copyright Dedication:** Hovering or tapping the copyright year in `Footer.tsx` reveals a discreet dedication: *"Crafted with precision & care for Sri Lankan STEM scholars and educators"*.
- **Egg 4 — Rare Milestone Animation:** Clicking the streak pill in `LearningHub.tsx` triggers the 30-Day Milestone celebration with confetti and mascot reaction; scoring ≥95% in `Results.tsx` unlocks the *"Top Decile Frontier"* celebration.
- **Egg 5 — Typing "nex":** Typing `n-e-x` while outside text inputs triggers a friendly acknowledgment wave from Nex with a telemetry toast.

---

## 6. Phase 8: Critical Bug Fixes, Live Multimodal Upgrade, Real Hesitation Engine & 10-Section Landing Expansion

### 1. P0 Deprecated Model Replacement & Zero-Fallback Enforcement
- **Deprecation Root Cause:** `gemini-2.5-flash` returned 404 deprecation errors in production, causing council queries to silently fail into canned local templates.
- **Model Upgrades:**
  - Standardized Harmony agents to **`gemini-3.6-flash`** across `geminiHarmonyEngine.js`, `harmony.ts`, and Supabase edge proxies.
  - Standardized Live Multimodal WebSocket sessions to **`models/gemini-3.1-flash-live`** in `geminiConfig.js`.
  - Standardized Text-to-Speech (TTS) generation to **`gemini-3.1-flash-tts`** in `voiceSynthesizer.js`.
- **Degradation Detection:** Embedded `reportHarmonyDegradation` and custom `ai-harmony-fallback-alert` window event to alert developers in real time if any fallback is triggered.

### 2. Live NexLearn Audio & Vision Pipeline Fixes
- **Web AudioWorklet Migration:** Replaced deprecated main-thread `ScriptProcessorNode` with an inline `AudioWorkletNode` (`NexAudioCaptureProcessor`) for jitter-free 16kHz linear PCM audio capture.
- **Camera Timeout & Graceful Degradation:** Added an 8-second acquisition timeout with automatic retry for webcam initialization. If video fails, the live session seamlessly maintains voice-only mode without dropping the WebSocket connection.
- **Human-Readable Close Codes:** Replaced ambiguous "Reason: None provided" logs with a status code translator mapping WebSocket termination codes (1000, 1006, 1008, 1011) to plain-English explanations.

### 3. Real Hesitation-Detection Engine (`QuestionCard.tsx`)
- Measures continuous question dwell time and detects rapid option-switching oscillation.
- Renders an intelligent, non-intrusive Nex check-in when difficulty thresholds are breached, providing three clear options:
  - *Need a hint?* (progressive scaffolding)
  - *I'm stuck* (deconstructed step explainer whiteboard)
  - *I'm thinking* (resets dwell timer for 15s)

### 4. 10-Section Landing Page Expansion
Expanded the landing page to 10 sequential sections adhering strictly to the design system (monochrome palette, single coral accent `#FF6B4A`, 1px solid borders, Liquid Glass header, reveal-on-scroll animations) with zero fabricated social proof:
1. **Hero Section (`HeroSection.tsx`)**
2. **How It Works (`HowItWorksSection.tsx`)**
3. **Syllabus Section (`SyllabusSection.tsx`)**
4. **Live NexLearn Showcase (`LiveShowcaseSection.tsx`)**
5. **Educators Section (`ForTeachersSection.tsx`)**
6. **Student Hub Preview (`StudentHubPreviewSection.tsx`)**
7. **Council Methodology (`CouncilMethodologySection.tsx`)**
8. **FAQ Section (`FaqSection.tsx`)**
9. **Final CTA (`FinalCtaSection.tsx`)**
10. **Footer (`Footer.tsx`)**

---

## 7. Phase 9: Full Learning Session Flow, Live Teacher Screens, Real Vision & Branding

### 1. Curriculum Registration in Learning Hub
- `LearningHub.tsx` maps and presents all of the student's registered subjects:
  - **Grade 9:** Exactly 13 compulsory national syllabus subjects.
  - **Grades 10 & 11:** 6 core subjects + 3 chosen basket electives (strictly 9 subjects).
- Subject cards now launch into the dedicated setup sequence via `/session/setup?subject=...`.

### 2. Upfront Session Setup & Parallel Generation
- **Difficulty & Topic Selection (`/session/setup`):**
  - Select from Easy, Medium, or Hard with visual indicator of historical baseline mastery.
  - Generates 5 syllabus topics via `fetchTopicSuggestions(subject, grade)` powered by `gemini-3.6-flash`.
  - Includes "Choose for me" automated selection and "Regenerate topics".
- **Session Loading (`/session/loading`):**
  - Features the looping Nex mascot animation (subtle bobbing, blinking, and ambient radar pulse).
  - Parallel generation of all 5 session questions via `generateFullSessionConcurrently` with `Promise.all`.
  - Generates questions, answer choices, contextual hints, general methodology approach notes, and structured teaching steps.
  - Real percentage progress counter (0% to 100%) with 12s timeout guard. Automatically transitions to `/quiz`.

### 3. Integrated Quiz & Dedicated Teacher Screens
- **Question Card & Approach Note (`QuestionCard.tsx`):**
  - Displays visible "How to approach this" panel outlining general strategy without giving away the answer.
  - "I don't know how to solve" launches directly into the dedicated teaching room.
- **Dedicated Teaching Screen (`/session/teach`):**
  - Distraction-free, full-screen whiteboard environment.
  - Warm, caring Nex teacher persona.
  - Synchronized auto-advancing voice narration with step-by-step whiteboard derivations.
  - Manual step navigation, replay speech controls, and safe return back to the active quiz.
- **Dedicated Correction Screen (`/session/correct`):**
  - Detailed diagnostic on why the submitted answer was wrong.
  - Side-by-side conceptual breakdown showing where student intuition diverged from syllabus mechanics.
  - Voice narration explaining the corrective insight before returning to the quiz.
- **Cross-Session Adaptive Tracking:**
  - Saves completed session accuracy, timing, and errors to `localStorage['nexlearn_performance_history']`, dynamically adjusting the student's baseline difficulty for subsequent sessions.

### 4. Real Multimodal Vision Pipeline
- **Picture-in-Picture Preview in `LiveNexLearnModal.tsx`:** Renders live video stream from student's webcam or screen share.
- **High-Resolution Frame Capture:** Offscreen canvas generates 1280x720 snapshots at 0.75 JPEG compression.
- **"Snap & Send" Action:** Dispatches snapshot media payload directly to the Gemini Live multimodal WebSocket session with specialized prompt context for handwritten notes and diagrams.

### 5. Official Mascot Branding & Favicons
- **`NexLogo.tsx`:** Standardized SVG mascot logo component with animated glow, replacing placeholder lettermarks across header and footer.
- **Brand Favicons:** Vector SVG favicon (`favicon.svg`) and multi-resolution raster icons (`favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`) integrated into `index.html`.

---

## 8. Phase 10: Resilient Multi-Model Failover System

### 1. Architectural Overview
- **Layer 1 (Model Registry):** `src/lib/ai/modelRegistry.ts` maintains prioritized capability chains, cached in-memory and in `localStorage` with a 1-hour TTL, dynamically cross-referenced against live `models.list`.
- **Layer 2 (Resilient Model Call):** `src/lib/ai/resilientModelCall.ts` dispatches requests across candidate chains, classifies errors (404/429/5xx retryable vs 400/401/safety non-retryable), and manages a wall-clock time budget.
- **Layer 3 (Telemetry & Zero Fake Content):** `src/lib/ai/telemetry.ts` logs and dispatches structured events for failover recovery and chain exhaustion. All silent fake fallbacks were completely removed.
- **Dedicated Key Resolver:** `src/lib/ai/apiKey.ts` provides clean, circular-dependency-free key resolution across browser and Node SSR/test environments.





