# NexLearn — System Contracts

The single source of truth for data shapes, module boundaries, naming, and
coding conventions. Every workstream programs against this document. If a
workstream needs a new field, it must be added here first.

---

## 1. Naming

- Product/platform: **NexLearn** — always one word, capital N, capital L.
- The avatar: **Nex** — never "NexLearn" the character, never "Nex" the platform.
- CSS prefix: `nx-` (BEM-ish: `nx-block`, `nx-block--modifier`, `nx-block__el`).
- CSS custom properties: `--ink-*` (base), `--amber-*` (accent), `--resolve-*`
  (success), `--alert-*` (errors), `--paper-*` (light passages), `--nex-*`
  (avatar materials), plus `--space-*`, `--dur-*`, `--ease-*`, `--z-*`.
- JS components: PascalCase files in `src/components/`, hooks `useThing` in
  `src/hooks/`, services in `src/services/`, engine code in `src/nex/` and
  `src/council/`.

## 2. Visual language (see `src/design/tokens.css`)

Art direction: **"a premium instrument for learning."** Warm graphite ink
(never pure black), one amber accent ("the tutor's lamp"), one green accent
("resolve," used sparingly for correct answers), a warm paper passage for
teacher surfaces. Typography-led: Instrument Serif display + Satoshi text +
JetBrains Mono for data/labels. Hairlines and mono microlabels, not glow and
gradient. Motion vocabulary: `--ease-settle` (entrances), `--ease-exit`,
`--ease-spring` (interactive feedback only), durations `--dur-1..4`.

App UI leans dense and functional (Linear/Stripe discipline); the marketing
site leans cinematic and spacious. Both share tokens and components.

## 3. Core data contracts

### 3.1 Question (produced by the council, consumed by QuizView)

```js
{
  question: string,                      // question text
  questionType: 'MCQ'|'TRUE_FALSE'|'FILL_BLANK'|'SHORT_ANSWER'|'NUMERICAL'|'CONCEPTUAL',
  choices: string[] | null,               // MCQ/TRUE_FALSE only; else null
  correctAnswer: string,                 // for NUMERICAL, canonical numeric string
  hints: string[],                        // 1-3 progressive hints
  difficulty: 'easy'|'medium'|'hard',
  syllabusRef: string,                   // Sri Lankan curriculum alignment note
  conceptTags: string[],                 // e.g. ['Ohm's law', 'series circuits']
  steps: TeachingStep[],                 // whiteboard-ready steps (may be lazily filled)
  examTips: string,                      // exam coach note
  motivator: string,                      // one-line support (correct/incorrect variants via director)
  confidence: number,                    // council confidence 0-100
}
```

### 3.2 TeachingStep (whiteboard scenes)

```js
{
  id: string,                    // stable, e.g. 's1'
  caption: string,               // short on-screen step title
  narration: string,             // voice-over + on-screen narration text
  board: BoardScene,              // structured whiteboard scene (never HTML)
  conceptTags: string[],
}
BoardScene {
  kind: 'expression'|'diagram'|'comparison'|'numberline'|'progress',
  expression?: string,           // e.g. "V = IR", rendered by the math renderer
  items?: [{ label, value?, unit?, note? }],
  rows?: [{ left, right, op?, note? }],   // comparison rows
  from?: number, to?: number, step?: number, value?: number,  // numberline
  value?: number, total?: number, // progress
  note?: string,
}
```

### 3.3 DirectorAction (Nex behavior engine input)

```js
{
  mode: 'idle'|'quiz'|'teaching'|'live',
  emotion: 'neutral'|'curious'|'thinking'|'encouraging'|'celebrating'|'supportive'|'attentive',
  speech: string,                 // what Nex says (spoken + captioned)
  animations: ClipName[],         // ordered clips from the closed vocabulary
  gazeTarget: 'screen'|'student'|'board'|'camera'|'off',
  boardHighlight?: { target: 'board'|'expression'|'items'|'note', pct?: number },
  intensity: 0-1,                 // scales motion amplitude
}
```

### 3.4 Council run events (for the Agent Activity Monitor)

```js
AgentSpec { id, name, role }      // static roster definition
AgentStatus { status: 'queued'|'running'|'done'|'error', startedAt, endedAt, output? , error? }
CouncilRun { id, agentEvents: Record<agentId, AgentStatus>, fused: Question|null, error }
```

### 3.5 Student / roster / analytics (Supabase tables — unchanged)

```
students(id, teacher_id, name, grade, age, subjects)
quizzes(student_id, subject, topic, difficulty, questions, score, time_spent, completed_at)
analytics(student_id, strengths, weaknesses, topic_mastery, last_updated)
teachers(id, email, created_at)
```

- `registerStudent(name, grade, age, subjects)` — create profile (AppContext).
- `recordQuizResult(studentId, subject, topic, difficulty, questions, score, timeSpent)` — persists + re-analyzes.
- `getStudentHistoryAndAnalytics(studentId)` — `{ quizzes, analytics }`.

### 3.6 Live tutor session state

```js
{
  status: 'idle'|'listening'|'thinking'|'speaking'|'error',
  caption: string, transcript: [{speaker:'student'|'nex', text, at}],
  micLevel: number 0-1,          // real-time amplitude from analyser
  cameraOn: boolean,
}
```

## 4. Model-call security (hard rule)

All Gemini calls go through the **`council-proxy` Supabase edge function**:
`POST /functions/v1/council-proxy` with Firebase auth bearer token; body
`{ agent, payload, temperature }`. The client never sees or holds a Gemini key.
Missing/unconfigured key → the proxy returns a typed error; the client falls
back to the offline question bank so the product still works (demo-safe).

## 5. The council (12 agents, real concurrency)

Defined in `src/council/roster.js` (id, name, role, system prompt, JSON
contract, temperature). Orchestration in `src/council/orchestrator.js` runs a
DAG: independent agents run concurrently (`Promise.allSettled`); dependent
agents (director, fusion) run in later waves. Every agent start/resolve
emits an event consumed by the Agent Activity Monitor. One failed agent
never blocks the rest — `allSettled` + typed fallbacks.

**DAG (question cycle):**
- Wave 1 (concurrent): curriculum, difficulty, motivator_baseline, examCoach, ...
- Wave 2 (concurrent, after wave 1): teacher (needs difficulty), visualTeacher, stepExplainer (need question)
- Wave 3: fusion → director (needs fused question)
- Client-side evaluation + per-event UI updates stream throughout.

## 6. Nex behavior engine (three layers)

1. **Director** (`src/nex/director.js`): pure function
   `deriveDirectorAction(event, context) -> DirectorAction`. Event types:
   `question_shown`, `answer_correct`, `answer_incorrect`, `student_stuck`,
   `teaching_started`, `teaching_step`, `teaching_ended`, `live_listening`,
   `live_thinking`, `live_speaking`, `session_idle`. Deterministic templates +
   optional LLM refinement of `speech` only (through the proxy).
2. **Behavior engine** (`src/nex/behaviorEngine.js`): framework-agnostic state
   machine. `dispatch(action)`, queues clips, exposes `subscribe` for the
   renderer. Unknown clip/malformed action → silent fallback to `idle`.
3. **Renderer** (`src/components/nex/Nex.jsx` + `src/nex/rig.js`): React
   Three Fiber. Procedural rig (no external GLB) built from primitives +
   custom shaders for the face display and chest core. Same component used
   everywhere (hero, hub, quiz dock, teaching mode, live mode) with a `scale`
   and `dock` prop.

**Closed animation vocabulary (V1):** `idle, breathe, blink, look_around,
notice, look_at_target, turn_toward, point, think, head_tilt, curious,
explain, gesture, nod, emphasize, celebrate, encourage, supportive_lean,
enter_teaching_mode, exit_teaching_mode, talk_loop, listen_loop,
return_to_idle`.

## 7. Routing / app structure

`src/App.jsx` — top-level: marketing site at `/` (public), login gate, then
app shell. `marketing/` lazy-loaded below the fold; `components/` app code.
Routes: `/` (landing), `/app` (teacher dashboard), `/app/students/:id` (hub),
quiz and teaching mode live inside the hub route as overlays, live tutor as a
full-screen mode.

## 8. Coding conventions

- React 19, functional components + hooks only. No class components.
- All styling via the design system classes (`src/design/*.css`) — inline
  `style` objects forbidden except for truly dynamic values (progress %,
  transform values).
- Framer Motion allowed only for app micro-interactions; choreographed
  landing sequences use GSAP + ScrollTrigger.
- `prefers-reduced-motion` respected by every animated surface (the CSS layer
  handles most of it; canvases check `useReducedMotion()`).
- Accessibility: semantic HTML, WCAG AA contrast, all interactive elements
  keyboard-operable, focus visible everywhere.
- File header comment where non-obvious constraints exist; otherwise no
  comments narrating the obvious.
