import { CLIPS, CLIP_NAMES } from './clips.js';

/* ==========================================================================
   NexLearn — Nex behavior engine
   The deterministic middle layer. A plain-JS state machine that consumes
   DirectorAction JSON and sequences animation clips, gaze and mode
   transitions. Framework-agnostic: no React, no Three.js. The renderer
   subscribes and interpolates.

   Hard rule (contract §6): an unknown clip name or malformed action NEVER
   throws — it falls back to idle silently. The avatar must never crash or
   freeze because an LLM produced a bad JSON shape.
   ========================================================================== */

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class BehaviorEngine {
  constructor() {
    this.state = {
      mode: 'idle',
      emotion: 'neutral',
      clip: 'idle',
      clipStartedAt: 0,
      clipQueue: [],
      gaze: 'screen',
      amplitude: 0,        // live audio amplitude 0-1 (drives talk_loop)
      intensity: 1,
    };
    this.listeners = new Set();
    this.timers = [];
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => this.listeners.delete(fn);
  }

  snapshot() {
    const s = { ...this.state };
    s.clipElapsed = now() - s.clipStartedAt;
    s.clipDef = CLIPS[s.clip] || CLIPS.idle;
    return s;
  }

  emit() {
    const snap = this.snapshot();
    this.listeners.forEach((fn) => {
      try { fn(snap); } catch { /* listener must not break the engine */ }
    });
  }

  /** Live audio amplitude feed (0-1) from the voice mode. */
  setAmplitude(a) {
    const v = Number.isFinite(a) ? Math.max(0, Math.min(1, a)) : 0;
    if (Math.abs(v - this.state.amplitude) > 0.02) {
      this.state.amplitude = v;
      this.emit();
    }
  }

  /** Apply a DirectorAction (contract §3.3). Malformed input falls back safe. */
  dispatch(action) {
    if (!action || typeof action !== 'object') return this.playFallback();

    const mode = ['idle', 'quiz', 'teaching', 'live'].includes(action.mode)
      ? action.mode : this.state.mode;
    const emotion = ['neutral', 'curious', 'thinking', 'encouraging', 'celebrating', 'supportive', 'attentive']
      .includes(action.emotion) ? action.emotion : 'neutral';
    const gaze = ['screen', 'student', 'board', 'camera', 'off'].includes(action.gazeTarget)
      ? action.gazeTarget : this.state.gaze;
    const intensity = Number.isFinite(Number(action.intensity))
      ? Math.max(0, Math.min(1, Number(action.intensity))) : 1;

    const animations = Array.isArray(action.animations)
      ? action.animations.filter((c) => CLIP_NAMES.includes(c)).slice(0, 5)
      : [];

    this.state.mode = mode;
    this.state.emotion = emotion;
    this.state.gaze = gaze;
    this.state.intensity = intensity;

    if (animations.length) {
      this.playSequence(animations);
    } else if (this.state.clip !== 'idle') {
      this.playFallback();
    } else {
      this.emit();
    }
  }

  /** Queue clips in order; loops hold until replaced. */
  playSequence(names) {
    this.clearTimers();
    const queue = [...names];
    this.state.clipQueue = queue;
    this.playNext();
  }

  playNext() {
    const next = this.state.clipQueue.shift();
    if (!next) {
      // Sequence finished — return to the resting loop.
      this.setClip('idle');
      return;
    }
    const def = CLIPS[next];
    if (!def) return this.playNext(); // already validated, but never trust twice
    this.setClip(next);
    if (!def.loop) {
      this.timers.push(setTimeout(() => this.playNext(), def.duration * (2 - this.state.intensity)));
    }
  }

  setClip(name) {
    if (!CLIP_NAMES.includes(name)) name = 'idle';
    this.state.clip = name;
    this.state.clipStartedAt = now();
    this.emit();
  }

  /** Silent graceful fallback — mandated by the brief. */
  playFallback() {
    this.clearTimers();
    this.state.clipQueue = [];
    this.setClip('idle');
  }

  clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  destroy() {
    this.clearTimers();
    this.listeners.clear();
  }
}

/** Module singleton — one engine instance app-wide. */
export const nexEngine = new BehaviorEngine();
