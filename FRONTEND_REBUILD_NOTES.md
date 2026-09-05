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
