# NexLearn Design Language v1

> "The operating system for a personal AI STEM education." Quiet confidence —
> a research instrument, not a cartoon; an editorial page, not a dashboard
> template pretending to have a personality.

## Naming

- **NexLearn** — the platform, the brand, the company. Never the character.
- **Nex** — the 3D AI companion who lives inside NexLearn. Never the platform.

## Typography (type leads; icons follow)

| Role | Face | Why |
|---|---|---|
| Display | **Space Grotesk** (400–700) | Engineered grotesque with genuine character — slightly idiosyncratic curves that read as "designed", not default. Carries headlines, buttons, numbers. |
| Text | **Inter** (400–600) | The legibility workhorse for body copy and dense UI. |
| Data/mono | **JetBrains Mono** (400–600) | The "infrastructure voice": labels, timings, agent output, marking schemes. Its presence signals *real systems*. |

Fluid scale via `clamp()` tokens: `--fs-hero … --fs-xs` (see `src/app/globals.css`).

## Color

**Base — "Deep Field"** `#060B0A`: a near-black with a green cast. Never pure
`#000` (harsh, flat) and emphatically not the default purple-blue AI gradient.
Deep Field is the colour of a darkroom — it makes the accent feel emitted, not
printed.

**Primary accent — "Volt"** `#D7FF4A`: the colour of a highlighter pen on a
well-used textbook; the phosphor of an oscilloscope trace. It is specific to
education *and* to live systems, which is exactly the product. Restraint rule:
Volt marks the single most important thing on any screen, never decoration.

**Secondary — "Signal Coral"** `#FF5A3C`: reserved for wrong answers, weak-area
alerts and hesitation telemetry. It means "pay attention", never "danger".

**Tertiary — "Glacier"** `#8FCCFF`: teaching-mode and focus states only.

**Light passage — "Paper"** `#F2EFE6`: the For Teachers section flips to a warm
paper register — the control-room feeling of printouts and mark schemes, a
deliberate breath of light inside a dark-mode-primary identity.

Contrast: Volt on Deep Field ≈ 15:1; body text (`#EEF4EA` at 62%) ≥ 4.5:1 on all
surfaces. WCAG AA holds inside the dark palette.

## Grid & space

12-column, max 1440px, `72px` engineering-grid backdrop (`.grid-bg`) masked to
a radial so it reads as graph paper, not wallpaper. 8pt spacing scale with
editorial extensions (`--sp-24/32`). Density is reserved for app surfaces;
marketing breathes.

## Iconography

Lucide, restyled: 15px default size (not 16/24), stroke inherits text color,
never filled, never multi-color, always paired with a mono caps label in
functional contexts. No emoji as UI iconography.

## Motion grammar (directed, not decorative)

| Token | Value | Use |
|---|---|---|
| `--ease-settle` | `cubic-bezier(.16,1,.3,1)` | Signature entrances; long-tail settle ("exo-out") |
| `--ease-exit` | `cubic-bezier(.7,0,.84,0)` | Exits; decisive, no overshoot |
| `--ease-spring` | `cubic-bezier(.34,1.4,.44,1)` | Interactive feedback; small honest overshoot |
| `--ease-steady` | `cubic-bezier(.45,0,.55,1)` | Continuous loops (pulses, scans) |
| durations | 120 / 240 / 480 / 960 ms | snap / quick / settle / story |

Rules: every animation must carry meaning (the agent scanline = work happening;
the story-loop pin = conducting attention through the product loop; Nex's bob =
alive). `prefers-reduced-motion` collapses all non-essential motion incl. the
GSAP pin and the 3D avatar (static poster).

## The Agent Monitor (a brand surface, not a loading spinner)

Trading-terminal register: mono caps labels, per-row status orbs, volt
scanlines while an agent runs, real per-agent timings and output snippets.
Every specialist is visible simultaneously — the concurrency *is* the product
claim, so it is rendered as infrastructure, honestly.

## Tokens

Single source of truth: `src/app/globals.css` (`@theme` + custom properties),
mirrored for JS in `src/lib/tokens.ts`. Both marketing and app consume these —
one hand designed everything.
