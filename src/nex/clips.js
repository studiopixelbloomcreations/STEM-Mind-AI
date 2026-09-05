/* ==========================================================================
   NexLearn — Nex animation clip library
   The closed V1 vocabulary. Each clip is a short procedural motion recipe
   the rig interprets: named channels, amplitude, and duration. The director
   and behavior engine ONLY speak these names — never raw coordinates.
   ========================================================================== */

export const CLIPS = {
  idle:                { channels: ['breathe', 'gaze_drift'], loop: true,  duration: 4000, intensity: 0.25 },
  breathe:             { channels: ['breathe'],               loop: true,  duration: 3600, intensity: 0.3 },
  blink:               { channels: ['blink'],                 loop: false, duration: 180,  intensity: 1 },
  look_around:         { channels: ['gaze_sweep'],            loop: false, duration: 2400, intensity: 0.6 },
  notice:              { channels: ['head_up', 'gaze_lock', 'core_flicker'], loop: false, duration: 700, intensity: 0.9 },
  look_at_target:      { channels: ['gaze_lock'],             loop: false, duration: 600,  intensity: 0.8 },
  turn_toward:         { channels: ['torso_turn'],           loop: false, duration: 800,  intensity: 0.7 },
  point:               { channels: ['arm_point'],             loop: false, duration: 1400, intensity: 0.8 },
  think:               { channels: ['head_tilt_down', 'core_think', 'gaze_up'], loop: true, duration: 2800, intensity: 0.6 },
  head_tilt:           { channels: ['head_tilt_side'],        loop: false, duration: 900,  intensity: 0.7 },
  curious:             { channels: ['head_tilt_side', 'lean_in'], loop: false, duration: 1100, intensity: 0.8 },
  explain:             { channels: ['arm_present', 'head_nod_subtle'], loop: true, duration: 2600, intensity: 0.65 },
  gesture:             { channels: ['arm_open'],              loop: false, duration: 1200, intensity: 0.7 },
  nod:                 { channels: ['head_nod'],              loop: false, duration: 900,  intensity: 0.8 },
  emphasize:           { channels: ['arm_strike', 'core_flicker'], loop: false, duration: 800, intensity: 1 },
  celebrate:           { channels: ['hop', 'arms_raise', 'core_flare', 'eyes_happy'], loop: false, duration: 1300, intensity: 1 },
  encourage:           { channels: ['lean_in', 'head_nod'],   loop: false, duration: 1200, intensity: 0.75 },
  supportive_lean:     { channels: ['lean_in', 'head_tilt_side'], loop: false, duration: 1500, intensity: 0.6 },
  enter_teaching_mode: { channels: ['torso_turn', 'arm_present', 'core_brighten'], loop: false, duration: 900, intensity: 0.9 },
  exit_teaching_mode:  { channels: ['arm_relax', 'torso_return'], loop: false, duration: 800, intensity: 0.6 },
  talk_loop:           { channels: ['talk_jaw', 'head_speak', 'gesture_subtle'], loop: true, duration: 1800, intensity: null },
  listen_loop:         { channels: ['lean_in', 'gaze_lock', 'nod_subtle'], loop: true, duration: 2400, intensity: 0.5 },
  return_to_idle:      { channels: ['settle_return'],        loop: false, duration: 900,  intensity: 0.4 },
};

export const CLIP_NAMES = Object.keys(CLIPS);

/** Emotion -> face display state, consumed by the rig's face shader. */
export const EMOTION_FACES = {
  neutral:     { eyeShape: 'round', glow: 0.55, squint: 0 },
  curious:     { eyeShape: 'round', glow: 0.75, squint: 0.1 },
  thinking:    { eyeShape: 'narrow', glow: 0.5, squint: 0.35 },
  encouraging: { eyeShape: 'round', glow: 0.8, squint: 0 },
  celebrating: { eyeShape: 'happy',  glow: 1.0, squint: 0 },
  supportive:  { eyeShape: 'soft',   glow: 0.7, squint: 0.15 },
  attentive:   { eyeShape: 'wide',   glow: 0.7, squint: 0 },
};

/** Mode -> core (chest) display pattern. */
export const MODE_CORES = {
  idle:     { pattern: 'slow_pulse', color: 'amber' },
  quiz:     { pattern: 'steady',     color: 'amber' },
  teaching: { pattern: 'sweep',     color: 'amber' },
  live:     { pattern: 'ripple',     color: 'amber' },
};
