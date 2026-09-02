/**
 * NEX BEHAVIOR ENGINE — deterministic, framework-agnostic state machine.
 *
 * Three-layer architecture (see docs/nex-character-spec.md):
 *   1. AI layer      → emits a small structured NexAction JSON
 *   2. BehaviorEngine (this file) → validates it against a CLOSED animation
 *      vocabulary and sequences clips, gaze targets and mode transitions
 *   3. Renderer (NexModel.tsx) → samples engine.update(dt) every frame
 *
 * Hard guarantee: malformed LLM output can never crash or freeze Nex.
 * Unknown clips are discarded; a malformed action silently falls back to idle.
 */

export type NexMode = "idle" | "presenting" | "listening" | "teaching" | "live" | "sleeping";
export type NexEmotion =
  | "neutral"
  | "focused"
  | "encouraging"
  | "celebrating"
  | "curious"
  | "thinking";

export const NEX_CLIPS = [
  "idle", "breathe", "blink", "look_around", "notice", "look_at_target",
  "turn_toward", "point", "think", "head_tilt", "curious", "explain",
  "gesture", "nod", "emphasize", "celebrate", "encourage",
  "supportive_lean", "enter_teaching_mode", "exit_teaching_mode",
  "talk_loop", "listen_loop", "return_to_idle",
] as const;
export type NexClip = (typeof NEX_CLIPS)[number];

export interface NexAction {
  mode?: NexMode;
  emotion?: NexEmotion;
  speech?: string;
  animations?: string[];
  whiteboard_actions?: { type: string; target: string }[];
}

/** Full kinematic pose sampled by the renderer every frame. All fields are
 *  absolute targets; the renderer critically-damps toward them (no popping). */
export interface NexPose {
  headX: number; headY: number; headZ: number;
  bodyY: number; bodyRotY: number; bodyRotX: number;
  bob: number;
  armL: number; armR: number;      // shoulder raise radians
  handL: number; handR: number;    // hand spread
  eyeSX: number; eyeSY: number;    // eye scale
  eyeDX: number; eyeDY: number;    // gaze offset within visor
  wink: number;                    // 0 none · 1 left closed · -1 right · 2 blink mid-state
  blink: number;                   // 0 open → 1 closed
  glow: number;                    // eye luminance multiplier
  core: number;                    // chest core intensity
  antenna: number;                 // tip lean
}

const BASE: NexPose = {
  headX: 0, headY: 0, headZ: 0,
  bodyY: 0, bodyRotY: 0, bodyRotX: 0, bob: 0,
  armL: 0, armR: 0, handL: 0, handR: 0,
  eyeSX: 1, eyeSY: 1, eyeDX: 0, eyeDY: 0,
  wink: 0, blink: 0, glow: 1, core: 0.55, antenna: 0,
};

/* ── Gesture programs: t∈[0,1] → partial pose deltas ─────────────────────── */

type Delta = Partial<NexPose>;
type Program = { dur: number; fn: (t: number, p: Delta) => Delta };

const env = (t: number, up = 0.25, down = 0.75) =>
  t < up ? t / up : t > down ? Math.max(0, 1 - (t - down) / (1 - down)) : 1;

const PROGRAMS: Partial<Record<NexClip, Program>> = {
  notice: {
    dur: 700,
    fn: (t, p) => {
      const e = env(t, 0.3, 0.8);
      return { ...p, headX: -0.12 * e, bob: 0.03 * Math.sin(t * Math.PI), antenna: -0.35 * e, glow: 1 + 0.7 * e };
    },
  },
  nod: {
    dur: 1100,
    fn: (t, p) => ({ ...p, headX: Math.sin(t * Math.PI * 2.2) * 0.22 * (1 - t * 0.4) }),
  },
  head_tilt: { dur: 1500, fn: (t, p) => ({ ...p, headZ: 0.3 * env(t, 0.2, 0.8) }) },
  curious: {
    dur: 1900,
    fn: (t, p) => ({ ...p, headZ: 0.32 * env(t), eyeSY: 1 + 0.2 * env(t), antenna: 0.25 * env(t) }),
  },
  think: {
    dur: 2200,
    fn: (t, p) => {
      const e = env(t, 0.25, 0.85);
      return { ...p, headX: -0.18 * e, eyeDX: 0.5 * e, eyeDY: 0.4 * e, eyeSY: 1 - 0.25 * e, core: 0.55 + 0.4 * Math.sin(t * Math.PI * 3) * e };
    },
  },
  point: {
    dur: 2000,
    fn: (t, p) => {
      const e = env(t, 0.18, 0.82);
      return { ...p, armR: -1.45 * e, handR: 1 * e, bodyRotY: -0.28 * e, headY: -0.3 * e, eyeDX: -0.55 * e };
    },
  },
  gesture: {
    dur: 1400,
    fn: (t, p) => ({ ...p, armL: -0.9 * Math.sin(t * Math.PI), handL: Math.sin(t * Math.PI) }),
  },
  explain: {
    dur: 2600,
    fn: (t, p) => {
      const a = Math.sin(t * Math.PI * 2);
      return { ...p, armL: -0.7 * env(t) + a * 0.15, armR: -0.7 * env(t) - a * 0.15, headZ: a * 0.06 };
    },
  },
  emphasize: {
    dur: 1200,
    fn: (t, p) => ({ ...p, headX: Math.sin(t * Math.PI * 4) * 0.1 * (1 - t), bob: Math.abs(Math.sin(t * Math.PI * 2)) * 0.02 }),
  },
  turn_toward: {
    dur: 1200,
    fn: (t, p) => {
      const e = env(t, 0.3, 1);
      return { ...p, bodyRotY: -0.5 * e, headY: -0.42 * e, eyeDX: -0.4 * e };
    },
  },
  celebrate: {
    dur: 2400,
    fn: (t, p) => {
      const bounce = Math.abs(Math.sin(t * Math.PI * 2.5)) * 0.09 * (1 - t * 0.5);
      const e = env(t, 0.12, 0.85);
      return {
        ...p, bob: bounce, armL: -1.5 * e, armR: -1.5 * e, handL: e, handR: e,
        eyeSY: 1 - 0.45 * e, eyeSX: 1 + 0.15 * e, core: 0.55 + 1.1 * Math.abs(Math.sin(t * Math.PI * 3)) * e,
        glow: 1 + 0.9 * e, antenna: Math.sin(t * Math.PI * 6) * 0.3 * (1 - t),
      };
    },
  },
  encourage: {
    dur: 1800,
    fn: (t, p) => ({ ...p, bodyRotX: 0.1 * env(t), headX: 0.08 * env(t), eyeSY: 0.88, glow: 1.25 }),
  },
  supportive_lean: {
    dur: 2200,
    fn: (t, p) => {
      const e = env(t, 0.25, 0.8);
      return { ...p, bodyRotX: 0.14 * e, headZ: 0.12 * e, eyeSY: 0.82, armL: 0.25 * e, glow: 1.2 };
    },
  },
  enter_teaching_mode: {
    dur: 1600,
    fn: (t, p) => {
      const e = env(t, 0.3, 1);
      return { ...p, bodyRotY: -0.45 * e, headY: -0.35 * e, armR: -1.15 * e, bob: 0.02 * e, glow: 1 + 0.4 * e };
    },
  },
  exit_teaching_mode: {
    dur: 1200,
    fn: (t, p) => {
      const e = 1 - env(t, 0, 0.7);
      return { ...p, bodyRotY: -0.45 * e, armR: -1.15 * e };
    },
  },
  look_around: {
    dur: 2600,
    fn: (t, p) => ({ ...p, eyeDX: Math.sin(t * Math.PI * 2) * 0.5, headY: Math.sin(t * Math.PI * 2) * 0.35 }),
  },
  look_at_target: { dur: 900, fn: (t, p) => p },
};

/* ── Engine ───────────────────────────────────────────────────────────────── */

interface ActiveClip {
  clip: NexClip;
  startedAt: number;
  program: Program;
}

const MODES: NexMode[] = ["idle", "presenting", "listening", "teaching", "live", "sleeping"];
const EMOTIONS: NexEmotion[] = ["neutral", "focused", "encouraging", "celebrating", "curious", "thinking"];

/** Defensive parse of director/LLM output — the reason Nex can never freeze. */
export function sanitizeAction(raw: unknown): Required<NexAction> {
  const fallback: Required<NexAction> = {
    mode: "idle", emotion: "neutral", speech: "", animations: [], whiteboard_actions: [],
  };
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  return {
    mode: MODES.includes(r.mode as NexMode) ? (r.mode as NexMode) : fallback.mode,
    emotion: EMOTIONS.includes(r.emotion as NexEmotion) ? (r.emotion as NexEmotion) : fallback.emotion,
    speech: typeof r.speech === "string" ? r.speech : "",
    animations: Array.isArray(r.animations)
      ? r.animations.filter((a): a is string => typeof a === "string" && (NEX_CLIPS as readonly string[]).includes(a))
      : [],
    whiteboard_actions: Array.isArray(r.whiteboard_actions)
      ? (r.whiteboard_actions as { type: string; target: string }[]).filter(
          (w) => w && typeof w.type === "string" && typeof w.target === "string"
        )
      : [],
  };
}

export class NexBehaviorEngine {
  mode: NexMode = "idle";
  emotion: NexEmotion = "neutral";
  speech = "";

  private queue: NexClip[] = [];
  private active: ActiveClip | null = null;
  private time = 0;
  private blinkAt = 1.8;
  private blinkT = -1;
  private gaze: { x: number; y: number } = { x: 0, y: 0 };
  private gazeWeight = 0.55;
  private amp = 0;
  private teaching = false;
  private lastWb: { type: string; target: string }[] = [];

  /** Consume a director action (already sanitised or raw — we sanitise again). */
  setAction(raw: unknown) {
    const a = sanitizeAction(raw);
    this.mode = a.mode;
    this.emotion = a.emotion;
    this.speech = a.speech;
    this.lastWb = a.whiteboard_actions;
    this.teaching = a.mode === "teaching";
    const clips = a.animations.length ? (a.animations as NexClip[]) : ["notice" as NexClip];
    if (this.teaching) this.queue = ["enter_teaching_mode", ...clips.filter((c) => c !== "enter_teaching_mode")];
    else this.queue = [...clips];
  }

  setGaze(x: number, y: number, weight = 0.55) {
    this.gaze = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    this.gazeWeight = weight;
  }

  /** amplitude 0..1 — drives the content-independent talk cycle + core pulse */
  setSpeaking(amplitude: number) {
    this.amp = Math.max(0, Math.min(1, amplitude));
  }

  get whiteboardActions() {
    return this.lastWb;
  }

  private baseForMode(): Delta {
    const t = this.time;
    switch (this.mode) {
      case "presenting":
        return { headX: 0.05, glow: 1.15, bob: Math.sin(t * 1.1) * 0.012 };
      case "listening":
        return { bodyRotX: 0.08, headX: 0.1, eyeSY: 1.14, glow: 1.25, bob: Math.sin(t * 1.3) * 0.01 };
      case "teaching":
        return { bodyRotY: -0.35, headY: -0.1, bob: Math.sin(t * 1.2) * 0.012, core: 0.75 };
      case "live":
        return { eyeSY: 1.06, glow: 1.3, bob: Math.sin(t * 1.5) * 0.014, core: 0.8 };
      case "sleeping":
        return { headX: 0.42, blink: 1, glow: 0.15, core: 0.2, bob: Math.sin(t * 0.6) * 0.008 };
      default:
        return { bob: Math.sin(t * 0.9) * 0.012 };
    }
  }

  private baseForEmotion(): Delta {
    switch (this.emotion) {
      case "celebrating": return { eyeSY: 0.75, eyeSX: 1.08, glow: 1.5, core: 0.9 };
      case "encouraging": return { eyeSY: 0.9, glow: 1.2, headX: 0.06, bodyRotX: 0.05 };
      case "curious": return { headZ: 0.16, eyeSY: 1.12, antenna: 0.2 };
      case "focused": return { eyeSY: 0.82, glow: 1.35, headX: 0.04 };
      case "thinking": return { eyeDY: 0.25, eyeDX: 0.25, eyeSY: 0.85 };
      default: return {};
    }
  }

  update(dtMs: number): NexPose {
    const dt = dtMs / 1000;
    this.time += dt;

    // advance queue
    if (!this.active && this.queue.length) {
      const clip = this.queue.shift()!;
      const program = PROGRAMS[clip];
      if (program) this.active = { clip, startedAt: this.time, program };
    }

    // spontaneous blinking (suppressed while speaking or sleeping)
    this.blinkAt -= dt;
    if (this.blinkT < 0 && this.blinkAt <= 0 && this.mode !== "sleeping") {
      this.blinkT = 0;
      this.blinkAt = 1.6 + Math.random() * 3.4;
    }

    let pose: NexPose = { ...BASE };

    // 1. mode base (breathe cycles etc.)
    pose = { ...pose, ...this.baseForMode() };

    // 2. emotion overlay
    const emo = this.baseForEmotion();
    for (const k of Object.keys(emo) as (keyof Delta)[]) {
      const v = emo[k];
      if (typeof v === "number") pose[k] = ((pose[k] as number) || 0) + v;
    }

    // 3. active gesture program (absolute deltas, weakest precedence issues resolved by ordering)
    if (this.active) {
      const { program, startedAt } = this.active;
      const t = (this.time - startedAt) / (program.dur / 1000);
      if (t >= 1) this.active = null;
      else {
        const delta = program.fn(Math.min(1, t), {});
        for (const k of Object.keys(delta) as (keyof Delta)[]) {
          const v = delta[k];
          if (typeof v === "number") pose[k] = (k === "core" || k === "glow" ? v : ((pose[k] as number) || 0) + v) as never;
        }
      }
    }

    // 4. gaze (cursor / board target) — eyes lead, head follows
    if (this.mode !== "sleeping") {
      pose.eyeDX = Math.max(-0.6, Math.min(0.6, pose.eyeDX + this.gaze.x * this.gazeWeight));
      pose.eyeDY = Math.max(-0.4, Math.min(0.4, pose.eyeDY - this.gaze.y * 0.45 * this.gazeWeight));
      pose.headY = Math.max(-0.65, Math.min(0.65, pose.headY + this.gaze.x * 0.4 * this.gazeWeight));
      pose.headX = Math.max(-0.5, Math.min(0.5, pose.headX - this.gaze.y * 0.3 * this.gazeWeight));
    }

    // 5. blink overlay
    if (this.blinkT >= 0) {
      this.blinkT += dt * 7.5;
      const b = this.blinkT < 1 ? Math.sin(this.blinkT * Math.PI) : 0;
      pose.blink = Math.max(pose.blink, b);
      if (this.blinkT >= 1) this.blinkT = -1;
    }

    // 6. talk cycle — amplitude-driven, content-independent (mouth-free design:
    //    eyes squish + body micro-bounce + core pulse carry "speaking")
    if (this.amp > 0.03) {
      const t = this.time;
      pose.eyeSY = Math.max(0.4, pose.eyeSY - this.amp * 0.28 * (0.6 + 0.4 * Math.sin(t * 11)));
      pose.bob += this.amp * 0.014 * Math.abs(Math.sin(t * 9));
      pose.core = Math.min(1.6, pose.core + this.amp * (0.55 + 0.45 * Math.sin(t * 13)));
      pose.headZ += this.amp * 0.03 * Math.sin(t * 5);
    }

    pose.eyeSX = Math.max(0.3, pose.eyeSX);
    pose.eyeSY = Math.max(0.12, pose.eyeSY);
    return pose;
  }
}

/* ── Tiny event bus so any part of the app can direct Nex without prop drilling ── */

type NexEventDetail =
  | { kind: "action"; action: NexAction }
  | { kind: "gaze"; x: number; y: number; weight?: number }
  | { kind: "amp"; value: number };

const BUS_KEY = "nex:bus";

export function emitNex(detail: NexEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BUS_KEY, { detail }));
}

export function onNex(handler: (detail: NexEventDetail) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = (e: Event) => handler((e as CustomEvent<NexEventDetail>).detail);
  window.addEventListener(BUS_KEY, fn);
  return () => window.removeEventListener(BUS_KEY, fn);
}
