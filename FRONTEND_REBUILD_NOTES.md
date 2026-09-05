# Frontend Rebuild Notes — NexLearn Phase 2

## 1. What Was Built

An entirely fresh, TypeScript-first frontend rebuild for **NexLearn** (Grades 9–11 adaptive AI STEM education platform):

### Design System & Styling
- **`src/styles/tokens.css`**: Strict implementation of the dark-mode-first token specification:
  - Colors: Deep Field (`#0B0D12`), Surface (`#14171F`), Surface Alt (`#1C202B`), Light Passage (`#FAFAF7`), Signal Coral (`#FF6B4A`), Indigo Pulse (`#5B7CFA`), Success (`#3DD9A4`), Warning (`#FFC15E`), Danger (`#FF5C6C`), Border (`#262B38`).
  - Typography: Self-hosted/loaded Fontshare **Cabinet Grotesk** (display headlines) and **General Sans** (body/UI) with fluid `clamp()` sizing.
  - Full spacing, radius, and elevation tokens.
- **`tailwind.config.ts`**: Configured with exact token overrides.

### Component Primitives (`src/components/ui/`)
- `Button.tsx`: Framer Motion hover & active tap feedback, variants (primary with coral glow shadow, secondary, ghost, danger, success, stuck).
- `Card.tsx`: Surface and surface-alt treatments, interactive elevation, glow hover.
- `Input.tsx`: Custom styled inputs with labels, helper text, and error states.
- `Modal.tsx`: Accessible dialog with Framer Motion backdrop and escape key listener.
- `Badge.tsx`: Topic and difficulty tag pills.
- `ProgressBar.tsx`: Animated progress indicator.
- `Icon.tsx`: Shared wrapper standardizing all Lucide icons to `strokeWidth={1.75}`.
- `Skeleton.tsx`: Custom shimmer/skeleton loader adhering to the anti-spinner design mandate.
- `Tooltip.tsx`: Micro-interaction tooltips.

### The Mascot Placeholder (`src/components/mascot/NexPlaceholder.tsx`)
- 2D animated SVG blob/orb with `--color-accent-primary` gradient, gentle breathing loop (1 → 1.03 → 1, 3s loop), and spontaneous random eye blinking every 4–6 seconds.
- Header comment included verbatim per section 2.7.

### Landing Page Sections (`src/components/landing/`)
1. **HeroSection**: Left-aligned 60% viewport with Cabinet Grotesk display headline, social proof metrics, and right 40% reserved for the interactive mascot card.
2. **HowItWorksSection**: 4-beat guided loop (*Targeted Assessment → Misconception Caught → Whiteboard Proof → Mastery Calibrated*).
3. **SubjectsSection**: Horizontal scroll-snapping row of Sri Lankan STEM subjects (Physics, Math, Chemistry, Biology, Combined Maths, ICT) with accent-tinted glows on hover.
4. **TutorTeaserSection**: Introducing the evolving companion concept with honest, non-overpromising capabilities.
5. **ForTeachersSection**: Visual register shift to `--color-bg-light` (`#FAFAF7`), previewing the high-density teacher control room.
6. **FinalCtaSection**: Full-width dark CTA section without redundant intermediate buttons.
7. **Footer**: Editorial layout with large wordmark and structured link columns.

### Application Routes (`src/app/routes/`)
- **Landing** (`/`): Orchestrating the full 7-section landing page.
- **Onboarding** (`/onboarding`): Multi-step (name, grade, subjects) with animated transitions.
- **LearningHub** (`/hub`): Calibrated subject picker, docked Nex mascot, active session launcher.
- **Quiz** (`/quiz`): Question card, adaptive inputs (MCQ chips, numerical single input, short answer textarea), "I'm Stuck" sequence, step-by-step whiteboard feedback, docked Nex mascot.
- **Results** (`/results`): Session summary with `canvas-confetti` trigger restricted to >80% mastery scores.
- **TeacherDashboard** (`/teacher`): Control room featuring `StudentRoster` and `StudentAnalyticsPanel` powered by `recharts`.
- **Settings** (`/settings`): Clean local environment preferences.

### Backend Integration Layer (`src/lib/api/`)
- `harmony.ts`: Wraps `geminiHarmonyEngine.js` for question generation, curriculum topics, step explanations, and includes a curriculum-aligned Sri Lankan O/L & A/L offline question bank.
- `auth.ts`: Wraps Firebase Google login and session subscriptions.
- `database.ts`: Wraps Supabase student queries and provisioning with fallback demo telemetry.

---

## 2. Preserved Backend Integration & TODOs

Per Section 2.8, all kept backend logic (`src/harmony/`, `src/services/`, `src/config/`, `src/live/`, `src/utils/`) was left untouched and accessed solely through `src/lib/api/`.

- **TODO (Edge Function Live Turns):** The `geminiLiveService` and `stemLiveService` were preserved in `src/services/`. When the live conversational voice/vision mode is integrated into the new React Router tree in future iterations, connect `src/lib/api/live.ts` directly to `sendStemLiveTurn`.
- **TODO (Supabase Realtime Sync):** If multi-teacher shared rosters are enabled in production, wire Supabase Realtime channel subscriptions into `src/lib/api/database.ts`.

---

## 3. Motion & Accessibility Compliance

- **`prefers-reduced-motion`**: Fully respected across tokens (`src/styles/tokens.css`), Framer Motion components (`Button`, `Card`, `Modal`, `NexPlaceholder`), and progress bars.
- **Micro-Interactions**: Hover, focus, and active/pressed states defined on all interactive elements.
