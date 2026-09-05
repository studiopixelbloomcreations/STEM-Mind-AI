# NexLearn — Design Language

**Version 1.0 · The system's constitution**

This document describes the design system as it is actually implemented — not an
idealized version of it. The law lives in four files; this document is the
interpretation and the reasoning. When taste and code disagree, code wins until
the tokens change.

| Layer | Source of truth |
|---|---|
| Tokens (color, type, space, motion, z) | `src/design/tokens.css` |
| Primitives (reset, grid, labels, motion governance) | `src/design/base.css` |
| Component library (CSS) | `src/design/components.css` |
| Component library (React) | `src/components/ui/index.jsx` |
| Runtime (motion preference, tiers, settle) | `src/design/runtime.js` |
| Conventions & data contracts | `docs/CONTRACTS.md` |

---

## 01 · Positioning

NexLearn is **the operating system for a personal AI STEM education**.

The student is fifteen, sixteen, seventeen — grades 9 to 11, one to three years
from national examinations that will shape the rest of their life. They are old
enough to be under real pressure and young enough to be handed nothing but
pressure. They can smell condescension at a distance. The product treats them
the way a good instrument treats a player: no stickers on the violin.

So the register is **quiet confidence**. Not startup energy — no growth-hacking
grin, no exclamation marks, no countdown timers. Not childish EdTech — no
rounded-everything, no mascots high-fiving, no gamified confetti over a
fraction. A fifteen-year-old does not want to be entertained into learning;
they want to be taken seriously, and they want to win. The interface is on
their side of the table, and it is built like it expects to be used for years.

The system runs in three registers, one language:

- **The product** — dense, functional, instrument-panel discipline. Linear and
  Stripe are the reference class: every pixel is accountable.
- **The marketing site** — cinematic and spacious. The same ink, the same lamp,
  given room to breathe.
- **Nex, the tutor** — a character, not a mascot. A presence with a body, a
  face, and an opinion about your last answer.

All three consume the same tokens and the same components. The product never
borrows the site's drama; the site never borrows the product's density.

---

## 02 · The idea

**NexLearn is drawn as a premium instrument for learning.**

The whole visual system is an instrument panel — the kind of object that is
reassuring precisely because it is serious. Four moves make it up:

1. **Engraved surfaces.** Material is carried by borders, hairlines, and a
   top-light edge — the way a machined panel catches light — not by drop
   shadows and floating white cards. The surface is ink: deep, warm, matte.
2. **One warm amber light.** A single accent family — `--amber-400 #f5be5a`,
   the tutor's lamp. It marks where the system is paying attention: the
   selected answer, the live agent, the tutor's eyes. There is exactly one
   lamp in the room, and it is always pointing at something that matters.
3. **Mono microtype as instrumentation.** Labels, keys, timings, mastery
   values — everything the system *measures* is set in JetBrains Mono,
   uppercase, tracked, ticked with a hairline. The interface reads like it
   knows what it is doing because it does.
4. **Generous ink as negative space.** Emptiness is not wasted space; it is
   the dark field the lamp works against. Restraint is the luxury signal.

From this follows the classification test that governs every screen:

> **Everything on screen is either content, chrome, or light. Never decoration.**

- **Content** — the question, the diagram, the student's answer, the
  explanation. Content gets the largest type and the most room.
- **Chrome** — the panel itself: borders, labels, rails, rules, cells. Chrome
  is quiet, engraved, and mono where it is instrumental.
- **Light** — amber (attention), resolve (achievement), alert (trouble). Light
  is scarce on purpose; scarcity is what makes it mean something.

If a proposed element is none of the three — it is there to "add interest," to
"feel more AI," to fill a corner — it does not ship.

---

## 03 · Typography

### Three typefaces, three jobs

| Role | Face | Job | Why this one |
|---|---|---|---|
| Display | **Instrument Serif** | Heroes, section statements, major in-app moments, the wordmark | Editorial confidence at scale. It has real character — high contrast, a genuine voice — and it is emphatically not the geometric-sans default the category always reaches for |
| Text | **Satoshi** | Everything you read: body, UI, buttons, nav | A warm grotesque with a large x-height and calm rhythm. The legible workhorse; never the star |
| Mono | **JetBrains Mono** | Data, labels, agent monitors, timings, keys, microlabels | Instrumentation. Mono with tabular figures says *measured*, not *styled* |

### Why serif-led

An educational product that wants to feel like a well-set textbook, not a chat
app. The chat app is a machine that talks at you; the textbook is a document
that respects you. Instrument Serif at display sizes carries a century of
"this was set with care" — the authority of print — while the surrounding mono
microtype keeps the whole thing unmistakably computational. The tension
between the two is the product: **a serious book, run by a live machine.**
A sans-led system would have collapsed into generic software; a serif-led
system reads as a publication with an engine inside it.

### The type scale

Fluid by design — `clamp()` everywhere, so one scale serves a phone and a
desktop without a breakpoint ladder. These are the implemented values:

| Token | Role | Value |
|---|---|---|
| `--text-display-xl` | Landing hero | `clamp(3.4rem, 9vw, 8.5rem)` |
| `--text-display-lg` | Section statements | `clamp(2.75rem, 6.5vw, 5.5rem)` |
| `--text-display-md` | Major in-app moments | `clamp(2.2rem, 4.5vw, 3.6rem)` |
| `--text-title-lg` | Page titles | `clamp(1.7rem, 3vw, 2.5rem)` |
| `--text-title` | Panel titles | `clamp(1.35rem, 2.2vw, 1.75rem)` |
| `--text-title-sm` | Card titles | `clamp(1.1rem, 1.6vw, 1.3rem)` |
| `--text-body-lg` | Lede | `clamp(1.05rem, 1.35vw, 1.25rem)` |
| `--text-body` | Body | `1rem` |
| `--text-body-sm` | Secondary body, hints | `0.875rem` |
| `--text-label` | Microlabel (mono, uppercase, tracked) | `0.75rem` |

Leading: `--leading-tight 1.04` (the landing hero only), `--leading-display 1.12`
(all serif display), `--leading-body 1.6` (all Satoshi reading text).

Rules that hold the system together:

- `h1–h3` are Instrument Serif, weight 400, tracking −0.015em,
  `text-wrap: balance`. `h4–h6` are Satoshi 600 — a deliberate step down in
  ceremony; not every heading deserves a serif.
- Paragraphs are `text-wrap: pretty`; ledes are capped at `62ch`; live-tutor
  captions at `max-width: 720px`. Measure is a typographic obligation, not a
  preference.
- Every number rendered anywhere is `.nx-num` / `.nx-cell__v` / mono with
  `font-variant-numeric: tabular-nums` — figures never jitter as values change.

### The microlabel — the signature editorial device

`.nx-label`: JetBrains Mono, 0.75rem, uppercase, letter-spacing 0.16em, in
`--text-lo`, preceded by an **18px amber hairline tick**:

```
— AGENT COUNCIL          — 03 · ASSESSMENT          — LIVE
```

It is the connective tissue of the whole interface — the way sections,
surfaces, and states introduce themselves. Variants: `--plain` (no tick, for
dense rows), `--amber` (the label itself is the signal). Related devices:
`.nx-index` (the section number, `02 · THE COUNCIL`, tracked at 0.2em) and the
hairline rules `.nx-rule` / `--faint` / `--amber`. Together they let a page be
labeled *richly* while remaining *quiet* — the editorial alternative to
boxes-within-boxes.

---

## 04 · Color

### The ink scale — warm graphite, never pure black

| Token | Hex | Use |
|---|---|---|
| `--ink-950` | `#0a0b0d` | Page base |
| `--ink-900` | `#101216` | Raised base, modals, agent rows |
| `--ink-850` | `#15181d` | Surface — cards, inputs, cells |
| `--ink-800` | `#1b1f26` | Surface high, meter tracks |
| `--ink-700` | `#262b33` | Strong border |
| `--ink-600` | `#3a414b` | Border |
| `--ink-500` | `#565e69` | Faint border, hover target |

**Why never `#000`:** pure black reads as "screen off" — the dead state of a
display. Warm graphite ink reads as **paper under lamplight**: the light is
on, someone is working. The warmth (a few points toward blue, a trace of
brown) does the emotional labor that pure black cannot; it makes a dark
interface feel inhabited rather than empty. Elevation follows the same logic:
on dark, **elevation is light, not shadow** — each raised surface carries a
1px inset highlight of warm white at 4–6% opacity, the machined top edge,
under a mass of near-black shadow (`--elev-1..3`).

Text on ink is also warm, never pure white: `--text-hi #f2f0ea` (primary),
`--text-mid #a9aeb6` (secondary), `--text-lo #6e747d` (meta only — see
contrast rules below).

### The tutor's lamp — the single amber accent

| Token | Hex | Use |
|---|---|---|
| `--amber-100` | `#fff3d6` | Paper-passage highlight |
| `--amber-300` | `#ffd98a` | Large-type accents, on-ink display text |
| `--amber-400` | `#f5be5a` | **Primary accent — the lamp** |
| `--amber-500` | `#e8a93e` | Pressed |
| `--amber-600` | `#c98a26` | Engraved detail, borders |
| `--amber-glow / --amber-line` | `rgba(245,190,90,.14 / .32)` | State glows, hairlines |

Amber means **attention**. The selected option, the running agent, the focus
ring, the active nav marker, the meter fill, the caret, the lamp on Nex's
face. Warm, focused, and pointedly *not* the AI-cliché purple-blue: purple
reads synthetic, institutional, and borrowed; amber reads lamplight — a
tutor's desk at night, which is exactly the scene the product lives in. The
selection highlight, the scrollbar, the voice rings: one hue, one meaning,
everywhere.

### Resolve — green, spent like a verdict

`--resolve-400 #59d6a3` (with `--resolve-300`, `--resolve-600`,
`--resolve-glow`). **Sparing by law.** Resolve marks genuine achievement
only: a correct answer, a completed agent, a green core on a mastered run.
It never decorates, never brands, never appears "for positivity." The green
accent appears on maybe two hundred pixels of a given screen — and that is
why, when a quiz option turns green, it lands like a verdict rather than a
firework.

### Alert — for real trouble only

`--alert-400 #ff7a6b` (with `--alert-300`, `--alert-glow`). Errors, stuck
states, a failed agent. The danger button is an engraved outline, not a red
slab — the register reserves weight for actual danger.

### The paper passage — the control room in daylight

`--paper-50 #f5f2eb` through `--paper-200`, with `--paper-ink #14161a`,
`--paper-mid`, `--paper-amber #a06a14`, `--paper-line`. A deliberate light
passage, applied to teacher surfaces — the control room in daylight — and to
proof sections. It is the one sanctioned register shift in the system, and it
carries meaning: **when the room turns to paper, the person holding the
clipboard has entered.** Within `.nx-paper`, rules, labels, focus rings,
buttons, and inputs all swap to their paper equivalents; amber warms down to
`--paper-amber` so the light survives the brighter room. Paper is a passage,
never a theme — the system returns to ink.

### Contrast — measured, not assumed

Computed against the implemented hex values, on `--ink-950` unless stated:

| Pairing | Ratio | Rule |
|---|---|---|
| `--text-hi` on `--ink-950` | ≈ 17:1 | Body text; clears AAA |
| `--text-mid` on `--ink-950` | ≈ 8.8:1 | All secondary content; AA+ |
| `--text-lo` on `--ink-950` | ≈ 4.2:1 | **Meta only** — microlabels, keys, timestamps. Non-essential by definition; never carries content |
| `--amber-400` on `--ink-950` | ≈ 11.6:1 | Amber text clears AA at body size; fine at label size |
| `--amber-300` on `--ink-950` | ≈ 14.6:1 | The large-type accent register (hover states, display highlights) |
| `--resolve-400` / `--alert-400` on ink | ≈ 10.8 / 7.7:1 | Both clear AA comfortably |
| `--paper-ink` on `--paper-50` | ≈ 16:1 | Paper body text |
| `--paper-amber` on `--paper-50` | ≈ 4.1:1 | Paper accents and label ticks — large/accent use, never body copy |

The working rules: body and content text never drops below `--text-mid`;
`--text-lo` is for ornament-that-informs, not information; amber-as-text is
safe on any ink surface but `--amber-300` is the display-size register; on
paper, the amber warms down and body copy is always `--paper-ink`.

---

## 05 · Motion grammar

One vocabulary, everywhere. Three curves, four durations, no exceptions
outside them.

### The three curves

| Token | Curve | Meaning |
|---|---|---|
| `--ease-settle` | `cubic-bezier(0.22, 1, 0.36, 1)` | **The signature entrance.** Arrive, then rest — decelerating into place like something set down carefully |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | **Quicker, decisive.** Accelerating away. Leaving is never lingered over |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | **Interactive feedback only.** The overshoot (1.56) is a physical acknowledgment — a button pressed, an option taken |
| `--ease-scroll` | `cubic-bezier(0.65, 0, 0.35, 1)` | Scroll-linked choreography |

### The duration scale

| Token | Value | Register |
|---|---|---|
| `--dur-1` | `150ms` | Micro: hover, focus, chip states |
| `--dur-2` | `300ms` | Standard UI transitions |
| `--dur-3` | `600ms` | Settle entrances |
| `--dur-4` | `900ms` | Cinematic: hero, section reveals |

### The grammar

- **Entrances settle.** `[data-settle]` + `.is-settled` is the *only* entrance
  channel: 14px rise and opacity over `--dur-3`, with `--settle-delay` for
  stagger. Driven by IntersectionObserver (`.15` threshold, one-shot) via the
  `<Settle>` component — content arrives when it becomes visible, then rests.
- **Exits are quicker than entrances.** A thing leaves at `--dur-2` on
  `--ease-exit` at most. Attention should be spent on what is arriving.
- **Springs are for interactive feedback only.** `:active` scale
  (`0.97` on buttons, `0.995` on quiz options — calibrated to the element's
  size), the 4px arrow nudge, the pressed tone. Never for entrances; a page
  that bounces in is a page that is unsure of itself.
- **The only infinite animations are living states, and they always mean
  something.** `nx-pulse` (1.8s) on status dots; the 1.1s pulse on a running
  agent's rail; Nex's idle breathe. If something is pulsing, a live system is
  on the other end of it. Nothing loops for ambience — ambience is what the
  ink is for.

### Directed motion, not decorative

- **On the landing**, motion is scroll-linked storytelling (GSAP +
  ScrollTrigger): sections reveal on the settle curve as the page is read.
  The site performs once, for an audience, in order.
- **In the app**, motion is state-driven. Every transition answers a state
  change — an agent starting, an answer landing, a step advancing. Meters
  fill on the settle curve (`--dur-3`), agent output lines reveal on
  `--dur-2`, nothing moves that the system did not cause.
- **Nex's every move is a director decision.** The avatar never improvises;
  the director layer (`src/nex/director.js`) derives every action from a real
  event — `answer_correct`, `student_stuck`, `teaching_step` — and the
  behavior engine queues clips from a **closed vocabulary**. Unknown or
  malformed input falls silently to `idle`. Character animation with the
  same discipline as UI animation: nothing arbitrary, everything accounted
  for.
- Voice rings in live mode are driven by **real audio amplitude** from the
  analyser, and Nex's mouth opens with his actual speech level. When motion
  is data-driven, it earns its place automatically.

---

## 06 · Grid & spacing

### The 12-column editorial grid

| Token | Value |
|---|---|
| `--grid-max` | `1360px` |
| `--grid-pad` | `clamp(20px, 4.5vw, 56px)` |
| `--grid-gap` | `clamp(16px, 2vw, 32px)` |
| `--grid-col` | `calc((100% - 11 × gap) / 12)` |

`.nx-grid` centers at `--grid-max`, pads with `--grid-pad`, spans twelve
columns with `--grid-gap` gutters. Spans 1–12 via `.nx-c-1` … `.nx-c-12`.
Responsive collapse is two steps, not a ladder: at `≤1023px` everything folds
to 6 columns, at `≤719px` to 12 (full width). A grid you can hold in your
head.

The grid is **editorial, not dashboard**: columns are asymmetric by default —
a 7/5 statement-and-aside, a 4/8 label-and-content — because a page that
reads like columns-of-cards reads like software, and this is a publication
with an engine.

### The section rhythm

| Token | Value |
|---|---|
| `--space-3xs` → `--space-3xl` | `4, 8, 12, 16, 24, 40, 64, 96, 160px` |
| `--space-section` | `clamp(96px, 12vw, 200px)` |

`--space-section` is the vertical rhythm of the site — generous to the point
of being the design. On a premium instrument, air is the expensive material;
the section gap is where it is spent. Marketing sections (`.nx-mkt-section`)
pad on it. The 4px base scale (`--space-3xs` upward) handles everything
within a surface.

### Deliberate breaks only

`.nx-break-out` pulls an element to full-bleed — `1 / -1`, extending past the
grid pad. A break is an event: the hero's stage, a section's showcase. The
rule is that **a break must announce itself**; an accidental full-width
element is a bug wearing a layout. Hairlines (`.nx-rule`) do the rest of the
structural work — the poster register — dividing space with 1px ink rather
than more surface.

---

## 07 · Components

One library, shared by site and app. BEM under `nx-`; the React side
(`src/components/ui/index.jsx`) is thin bindings to the same classes — no
styling logic lives in JavaScript. No one-off inline styles; anything
dynamic (a fill percentage, a transform) comes through as a custom property
or a single dynamic value.

### Buttons — one system, four registers

| Register | Material | Voice |
|---|---|---|
| `.nx-btn--primary` | Amber fill, ink text | **The ask.** One per view, high conviction, weight 650 |
| `.nx-btn--secondary` | Engraved outline on ink | Considered action |
| `.nx-btn--ghost` | Text only, `--text-mid` | Quiet, in-flow actions |
| `.nx-btn--danger` | Alert outline, alert glow on hover | Reserved for real errors |

Sizes `sm 38px / default 52px / lg 60px`; pressed state springs to `0.97`;
disabled fades to `0.45` and refuses to move. Buttons are full-radius pills
— the one soft shape in a square-ish system, and the reason it reads as a
control rather than a tile. `IconButton` is the 38px square with a mandatory
`aria-label`.

### Inputs

`.nx-input / .nx-select / .nx-textarea`: `--ink-850` field, `--ink-600`
border, `--r-sm`. Focus is the lamp doing its job — border to `--amber-400`,
field lifts to `--ink-800`, nothing else moves. `Field` wraps a mono
uppercase label and an optional hint. Three content registers, matched to
question type (below), exist beyond the standard input.

### Cards — engraved, not SaaS

`.nx-card`: `--ink-850` body, `--ink-600` border, `--r-md`, hover brightens
the *border*, not the shadow. `--engraved` adds the 2.5% top-light gradient —
the machined edge. **Border and substance carry the material; there is no
"shadow card" in the system.** A shadow says "floating above"; an edge says
"set into." We are a panel, not a stack of paper.

### The control-room atoms

- **`.nx-cell`** — key/value data cell: mono uppercase key at `0.68rem`,
  tabular mono value at `1.35rem`, tonal variants (amber/resolve). The atom
  of the dashboard.
- **`.nx-chip`** — mono uppercase tag at `0.7rem`, tonal variants, with the
  status dot (`.nx-dot`, `--live` pulses) for live truth.
- **`.nx-meter`** — 4px engraved track, amber fill, width transitions on the
  settle curve; `role="meter"` with ARIA values. The mastery bar.
- **`.nx-spark` (Spark)** — inline SVG polyline, 1.5px stroke, amber or
  resolve. Trend as a gesture, not a chart library.
- **`.nx-table`** — the roster: mono tracked headers, hairline rows, quiet
  hover. Dense, ruled, unembellished.

### The agent monitor — the system showing its work

`.nx-agent` rows: a 3px status rail (queued `--ink-600`, running amber with
the 1.1s living pulse, done resolve, error alert), mono name + role +
tabular timing, and a streaming output line that unfolds on `--dur-2`. This
is the council made visible — **real concurrency, rendered honestly**: each
row is an actual agent in an actual DAG wave, each pulse a live process.
It is the product's proof of seriousness, and it is why the interface can
afford to be quiet everywhere else.

### Quiz registers — an input per question type

| Question type | Register |
|---|---|
| MCQ / TRUE_FALSE | `.nx-quiz-option` rows — mono key (A/B), selected = amber, correct = resolve, wrong = alert. Press feedback springs to `0.995` |
| NUMERICAL | `.nx-num-input` — **the instrument**: huge mono (`clamp(1.6rem, 3vw, 2.2rem)`), centered, underlined only, amber caret. A value being entered, not a form being filled |
| CONCEPTUAL | `.nx-concept-input` — calm prose textarea, `1.7` line-height, room to think |
| SHORT_ANSWER / FILL_BLANK | Standard input register |

The register *is* the pedagogy: recall gets rows, computation gets an
instrument, reasoning gets space to write.

### The whiteboard

`.nx-board` — `--ink-900` surface, `--r-lg`, SVG scenes rendered from the
structured `BoardScene` contract (expression, diagram, comparison,
numberline, progress). **Never HTML fragments.** The board is a drawing
surface with a grammar, which is why the same scene can be stepped through,
highlighted by Nex's gaze, and re-scaled without re-authoring.

### Chrome & presence

`.nx-shell` (248px sidebar + main, collapsing to a drawer at `≤1023px`),
topbar at 64px, `.nx-nav-item` with the 3px amber active marker,
`.nx-overlay` + `.nx-modal` (blur scrim, Escape to close, `aria-modal`),
`.nx-live-stage` with 720px captions and amplitude-driven voice rings, and
`.nx-dock` — **Nex's persistent presence**: 148×176 desktop, 108×132 mobile,
fixed bottom-right, unobtrusive by footprint, unforgettable by presence.
Marketing primitives (`.nx-mkt-section`, `-h1`, `-h2`, `-lede`, `.nx-mark`
with the mono "Adaptive STEM" registration) complete the kit.

### Icon stance

**No emoji. Anywhere.** Not in buttons, not in toast messages, not in
celebration. A serif-led, lamp-lit system cannot survive emoji's tonal
collapse — one party emoji and the room is a kindergarten. Icons are
**Lucide, restyled**: 1.5px stroke at 20px (16px in dense rows), currentColor
at `--text-mid`, amber only when the icon itself carries state. Line icons
sit correctly against hairlines; filled or rounded icon sets would fight the
engraving.

---

## 08 · Nex's material identity

Nex is a bone-ceramic instrument with a lamp for a face. Not a stock robot,
not a reskinned mascot — an original character built from primitives and one
custom shader (`src/components/nex/Nex.jsx`).

**The materials** (`--nex-*`):

| Token | Value | Role |
|---|---|---|
| `--nex-shell` | `#e8e2d6` | Satin bone ceramic — head, plinth, arms (roughness 0.55, metalness 0.08) |
| `--nex-shell-deep` | `#c9c2b2` | Shaded shell |
| `--nex-graphite` | `#33373d` | Collar, belt, ear disks — the joints (metalness up to 0.5) |
| `--nex-visor` | `#14161a` | Face display glass — dark, matte |
| `--nex-display` | `var(--amber-400)` | Eyes + core emissive — **the lamp** |
| `--nex-core-resolve` | `var(--resolve-400)` | The mastered state |

The silhouette: an egg head floating above a rounded plinth, collar and belt
in graphite, capsule arms, ear disks. Ceramic-and-graphite is the
product's own material story told in an object — **engraved panel (graphite)
carrying something warm and alive (bone, light)**.

**One light, one system.** Nex's eyes and chest core emit `--amber-400`, and
a dedicated amber fill light rakes him from behind-left in the scene. The
tutor's lamp is not a metaphor Nex borrows — **it is literally his face.**
When the student's selected answer glows amber and Nex's eyes glow the same
amber, the student and the tutor are in the same room, under the same lamp.
No other brand color touches him. When he resolves, he goes green like
everything else resolves.

**Two expression channels.** The face display renders seven emotions as eye
geometry (round, narrow, happy, soft, wide) with glow and squint — curious
brightens, thinking narrows, celebrating goes wide. The chest core is the
mode dial, its pattern reading the session: `slow_pulse` idle, `steady`
quiz, `sweep` teaching, `ripple` live. Face is how he feels; core is what
he's doing. The core flares when he celebrates, flickers when he thinks.

**Every move is directed.** The director layer derives each action from
real events; the behavior engine blends additive motion channels (28 of
them) from a closed vocabulary — `breathe`, `blink`, `lean_in`, `head_tilt`,
`point`, `celebrate`, `talk_jaw`... One-shot clips compose over the idle
loop, so a wave rides a breath rather than replacing it. Intensity is a
directed parameter. No improvised motion, ever — and an unknown clip fails
silently to idle.

**Procedural economy.** A few hundred triangles, no GLB, no downloads — he
ships in the JS bundle and lights the hero, the hub, the quiz dock, teaching
mode, and live mode as **one component** with `scale` and `dock` props. One
character, five surfaces, zero asset cost.

---

## 09 · Accessibility & performance

Accessibility here is not a compliance layer; it is the same instrument
built so anyone can operate it.

### Reduced motion — a first-class path everywhere

- A global CSS kill-switch collapses animation/transition durations to
  `0.01ms` and disables smooth scroll under `prefers-reduced-motion: reduce`.
- `<Settle>` short-circuits: reduced-motion users get content immediately
  visible, no observer, no stagger.
- `useReducedMotion()` (reactive, via `matchMedia`) drives every canvas:
  reduced-motion users receive **NexFlat** — the character as a zero-cost 2D
  SVG that still shows state through its amber core. The companion remains;
  only the dimension is dropped.
- Scroll-choreographed marketing sections degrade to static composition —
  they were designed to be read first.

### Semantics & keyboard

- Semantic HTML throughout; `role="meter"` with live values on mastery bars;
  `role="dialog"` + `aria-modal` + Escape on modals; mandatory `aria-label`
  on icon-only buttons; decorative elements (`nx-dot`, sparklines, the SVG
  character) `aria-hidden`; `.nx-u-sr` for screen-reader-only text.
- Every interactive element is keyboard-operable (native elements wherever
  possible), and focus is **visible everywhere**: 2px `--amber-400` outline,
  3px offset — the lamp finds you. On paper, the ring warms to
  `--paper-amber`.
- Contrast rules per §04; body text never below `--text-mid` on ink.

### Performance — the 3D budget

- **Tiering:** `detectTier()` reads cores, device memory, network type,
  save-data, pointer, and motion preference. `low` (or reduced motion) → 2D
  SVG Nex; `mid` → dpr 1.5, no antialias; `high` → dpr up to 2, antialias,
  and only on fine-pointer devices with ≥8 cores. All canvases run
  `powerPreference: 'low-power'`.
- **Zero asset downloads for the avatar** — a few hundred triangles and one
  shader in the bundle. The most-seen 3D object in the product costs nothing
  to load.
- **Lazy-loading:** marketing routes load below the fold; ML pipelines load
  on first use behind progress UI; 3D stages sit at `--z-canvas: 1`, behind
  the content they light — the page renders and reads before anything
  animates.
- Transitions ride cheap properties (opacity, transform, background,
  border-color) and tabular figures prevent layout jitter.
- **Budget: Lighthouse 90+ on mobile.** A premium instrument that loads
  slowly is an expensive joke; performance is part of the design language.

---

## 10 · What we deliberately did not do

The anti-generic checklist. Each of these was a decision, made once, on
purpose:

1. **No purple-blue gradients.** The default skin of every AI product since
   2022. It reads as synthetic and borrowed — and it is the one register that
   would have made NexLearn look like a wrapper. The tutor's lamp is amber:
   warm, physical, and pointed at a student. The counter-position *is* the
   brand.
2. **No stock robot.** A marketplace GLB reskinned in brand colors is
   someone else's character wearing our jacket — and a licensing and
   silhouette cliché besides. Nex is procedural: a few hundred triangles, one
   shader, an original silhouette, lit by our own lamp. Original character at
   zero download cost.
3. **No particle starfields.** The other default. Particles signify
   "space," which is to say *nothing*, and they spend GPU budget the mobile
   budget cannot afford — for no meaning. The only infinite animations in
   the system are status pulses that mean *a live process is running*. If it
   moves forever, it had better be alive.
4. **No emoji iconography.** Emoji are tonal collapse in a single glyph; one
   party emoji and the instrument is a toy. Icons are Lucide restyled — 1.5px
   stroke, 20px, currentColor — which sits correctly against the hairlines
   and the mono.
5. **No "SaaS card" signature.** No white rounded cards floating on soft
   shadows, the Tailwind-era default that makes every product look like every
   other product. Surfaces are engraved ink: border, top-light edge,
   substance. An edge says *set into a panel*; a shadow says *content
   management system*.
6. **No centered-hero cliché.** No stacked logo-headline-screenshot in the
   middle of the page. The landing is an editorial composition on the
   12-column grid — asymmetric spans, hairline structure, a section index,
   type that is set rather than centered.
7. **No fake numbers.** No "10,000+ happy learners," no vanity metrics, no
   illustrative dashboards. Every number rendered in the system is a real
   measurement — a real mastery value, a real agent timing, a real confidence
   score — set in tabular mono because it is instrumentation. Data displays
   in an instrument panel are evidence, not decoration; the moment a number
   is decorative, the whole panel stops being credible.

---

*The test, always: content, chrome, or light. If it is none of them, it is
not NexLearn.*
