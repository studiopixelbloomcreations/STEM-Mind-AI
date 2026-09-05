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
