import { useEffect, useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { nexEngine } from '../../nex/behaviorEngine.js';
import { EMOTION_FACES, MODE_CORES } from '../../nex/clips.js';
import { useReducedMotion, detectTier } from '../../design/runtime.js';

/* ==========================================================================
   Nex — the original NexLearn companion avatar.
   Fully procedural: no stock GLB, no reskin. Primitives + one custom shader
   for the face display and chest core. A few hundred triangles total; ships
   in the JS bundle (zero 3D asset downloads).

   Design (docs/NEX_SPEC.md): bone-ceramic egg head floating over a rounded
   trapezoid plinth, graphite collar ring and belt line, dark-glass face
   display with amber eyes, chest core that patterns with state.
   One component serves hero / hub / quiz dock / teaching / live surfaces.
   ========================================================================== */

const TIER = detectTier();

/* --- Motion channels -------------------------------------------------------
   Each channel is (t, state) -> partial pose. The rig blends all active
   channels additively, so one-shot clips compose over the idle loop.
---------------------------------------------------------------------------- */

const EASE_OUT = (x) => 1 - Math.pow(1 - x, 3);
const WAVE = (t, period) => Math.sin((t / period) * Math.PI * 2);

function chBreathe(t, s) {
  const w = WAVE(t, 3600);
  return { posY: w * 0.035 * s.intensity, headPitch: w * 0.02 };
}
function chGazeDrift(t) {
  return { eyeX: WAVE(t, 7000) * 0.15, eyeY: WAVE(t, 9000) * 0.08 };
}
function chGazeLock() { return { eyeY: 0.02 }; }
function chBlink(_t, s) {
  const e = Math.min(1, s.clipElapsed / 180);
  const close = e < 0.5 ? e * 2 : 2 - e * 2;
  return { eyeScaleY: 1 - Math.max(0, close) * 0.9 };
}
function chGazeSweep(t) { return { eyeX: WAVE(t, 2400) * 0.3 }; }
function chHeadUp(_t, s) {
  const e = EASE_OUT(Math.min(1, s.clipElapsed / 400));
  return { headPitch: -0.12 * e * s.intensity, posY: 0.02 * e };
}
function chCoreFlicker(t) { return { coreBoost: 0.3 + WAVE(t, 260) * 0.3 }; }
function chTorsoTurn(_t, s) {
  const e = EASE_OUT(Math.min(1, s.clipElapsed / 800));
  return { torsoYaw: 0.18 * e * s.intensity };
}
function chArmPoint(_t, s) {
  const e = EASE_OUT(Math.min(1, s.clipElapsed / 600));
  return { armRaise: 0.9 * e * s.intensity };
}
function chHeadTiltDown(_t, s) {
  const e = EASE_OUT(Math.min(1, s.clipElapsed / 700));
  return { headRoll: 0.1 * e * s.intensity, headPitch: 0.08 * e };
}
function chHeadTiltSide(_t, s) {
  const e = EASE_OUT(Math.min(1, s.clipElapsed / 500));
  const release = s.clipElapsed > 700 ? EASE_OUT(Math.min(1, (s.clipElapsed - 700) / 400)) : 0;
  return { headRoll: 0.22 * (e - release) * s.intensity };
}
function chGazeUp() { return { eyeY: 0.22 }; }
function chLeanIn(_t, s) {
  const e = EASE_OUT(Math.min(1, s.clipElapsed / 600));
  return { posZ: 0.06 * e * s.intensity };
}
function chHeadNod(_t, s) {
  const rel = Math.min(1, s.clipElapsed / 900);
  return { headPitch: Math.sin(rel * Math.PI * 3) * 0.08 * (1 - rel) * s.intensity * 2 };
}
function chHeadNodSubtle(t, s) { return { headPitch: WAVE(t, 1300) * 0.02 * s.intensity }; }
function chArmPresent(_t, s) {
  const e = EASE_OUT(Math.min(1, s.clipElapsed / 500));
  return { armRaise: 0.45 * e * s.intensity };
}
function chArmOpen(_t, s) {
  const e = EASE_OUT(Math.min(1, s.clipElapsed / 500));
  return { armSpread: 0.5 * e * s.intensity };
}
function chArmStrike(_t, s) {
  const e = Math.min(1, s.clipElapsed / 800);
  return { armRaise: Math.sin(e * Math.PI) * s.intensity };
}
function chHop(_t, s) {
  const e = Math.min(1, s.clipElapsed / 1300);
  const hop = Math.abs(Math.sin(e * Math.PI * 2)) * 0.12;
  return { posY: hop * s.intensity };
}
function chArmsRaise(_t, s) {
  const e = EASE_OUT(Math.min(1, s.clipElapsed / 500));
  return { armRaise: 1.2 * e * s.intensity };
}
function chCoreBrighten() { return { coreBoost: 0.6 }; }
function chCoreThink(t) { return { coreBoost: 0.3 + WAVE(t, 700) * 0.2 }; }
function chCoreFlare(t) { return { coreBoost: 0.8 + WAVE(t, 300) * 0.2 }; }
function chTalkJaw(_t, s) {
  const amp = s.amplitude || 0.15;
  return { mouth: Math.max(0.06, amp) };
}
function chHeadSpeak(t, s) {
  return { headPitch: WAVE(t, 900) * 0.03 * (0.3 + (s.amplitude || 0)) };
}
function chGestureSubtle(t) { return { armRaise: 0.15 + WAVE(t, 1100) * 0.1 }; }
function chNodSubtle(t) { return { headPitch: WAVE(t, 1600) * 0.02 }; }
function chSettleReturn(_t, s) {
  const e = EASE_OUT(Math.min(1, s.clipElapsed / 900));
  return { posY: -0.02 * (1 - e), headRoll: 0, torsoYaw: 0 };
}

const CHANNELS = {
  breathe: chBreathe, gaze_drift: chGazeDrift, gaze_lock: chGazeLock, blink: chBlink,
  gaze_sweep: chGazeSweep, head_up: chHeadUp, core_flicker: chCoreFlicker,
  torso_turn: chTorsoTurn, arm_point: chArmPoint, head_tilt_down: chHeadTiltDown,
  head_tilt_side: chHeadTiltSide, gaze_up: chGazeUp, lean_in: chLeanIn,
  head_nod: chHeadNod, head_nod_subtle: chHeadNodSubtle, arm_present: chArmPresent,
  arm_open: chArmOpen, arm_strike: chArmStrike, hop: chHop, arms_raise: chArmsRaise,
  core_brighten: chCoreBrighten, core_think: chCoreThink, core_flare: chCoreFlare,
  talk_jaw: chTalkJaw, head_speak: chHeadSpeak, gesture_subtle: chGestureSubtle,
  nod_subtle: chNodSubtle, settle_return: chSettleReturn,
};

const EYE_SHAPE = { round: 0, narrow: 1, happy: 2, soft: 3, wide: 4 };
const CORE_PATTERN = { slow_pulse: 0, steady: 1, sweep: 2, ripple: 3 };

/* --- Face / core shader ---------------------------------------------------- */

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;
  uniform float uGlow;
  uniform int uPattern;
  uniform float uSquint;
  uniform int uEyeShape;
  uniform vec2 uEyeOffset;
  uniform float uEyeScaleY;
  uniform float uMouth;
  uniform float uIsCore;

  float sdEllipse(vec2 p, vec2 ab) {
    vec2 q = abs(p / ab);
    return length(q) - 1.0;
  }

  void main() {
    vec3 amber = vec3(0.96, 0.75, 0.35);
    vec3 dark = vec3(0.05, 0.055, 0.065);
    // SphereGeometry maps the +Z forward apex to u = 0.25; re-map so the
    // face's centered math (uv = 0.5) sits on the forward meridian.
    vec2 uv = vec2(fract(vUv.x + 0.25), vUv.y) - 0.5;
    vec3 col = dark;

    if (uIsCore > 0.5) {
      // CHEST CORE — state patterns
      vec2 c = (vUv - 0.5) * 2.0;
      float r = length(c);
      float inCore = smoothstep(0.95, 0.8, r);
      float ring = smoothstep(0.5, 0.52, r) * smoothstep(0.62, 0.60, r);
      float pulse = 0.5 + 0.5 * sin(uTime * 0.002);
      float p = 0.0;
      if (uPattern == 0) p = 0.35 + 0.2 * pulse;
      else if (uPattern == 1) p = 0.55;
      else if (uPattern == 2) p = step(fract(uv.y * 3.0 - uTime * 0.0004), 0.5) * 0.7;
      else p = 0.5 + 0.3 * sin(r * 12.0 - uTime * 0.003);
      float glowAmt = inCore * p * (0.5 + uGlow * 0.5) + ring * 0.6;
      col = mix(dark, amber, clamp(glowAmt, 0.0, 1.0));
    } else {
      // FACE DISPLAY — eyes + talk mouth, only on front-facing glass
      float faceOn = smoothstep(0.3, 0.45, vNormal.z);
      if (faceOn > 0.01) {
        vec2 eOff = uEyeOffset * 0.16;
        vec2 leftC = uv - vec2(-0.1, 0.06) - eOff;
        vec2 rightC = uv - vec2(0.1, 0.06) - eOff;

        vec2 eyeSize = vec2(0.055, 0.085 * uEyeScaleY);
        if (uEyeShape == 1) eyeSize = vec2(0.07, 0.05);
        if (uEyeShape == 4) eyeSize = vec2(0.06, 0.11);
        if (uEyeShape == 3) eyeSize = vec2(0.05, 0.065);
        if (uEyeShape == 2) eyeSize = vec2(0.06, 0.045);
        eyeSize.y *= (1.0 - uSquint * 0.6);

        float eyeL = smoothstep(0.0, 0.02, -sdEllipse(leftC, eyeSize));
        float eyeR = smoothstep(0.0, 0.02, -sdEllipse(rightC, eyeSize));

        float mouthGlow = 0.0;
        if (uMouth > 0.05) {
          vec2 mC = uv + vec2(0.0, 0.16);
          mouthGlow = smoothstep(0.0, 0.02, -sdEllipse(mC, vec2(0.05, 0.02 + uMouth * 0.05)));
        }

        float glowAmt = max(max(eyeL, eyeR) * uGlow, mouthGlow * uGlow * 0.9);
        col = mix(dark, amber * 1.2, glowAmt);
      }
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

class FaceCoreMaterialImpl extends THREE.ShaderMaterial {
  constructor({ isCore = 0, ...rest } = {}) {
    super({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uGlow: { value: 0.6 },
        uPattern: { value: 1 },
        uSquint: { value: 0 },
        uEyeShape: { value: 0 },
        uEyeOffset: { value: new THREE.Vector2(0, 0) },
        uEyeScaleY: { value: 1 },
        uMouth: { value: 0.04 },
        uIsCore: { value: isCore },
      },
      ...rest,
    });
  }
}
extend({ FaceCoreMaterial: FaceCoreMaterialImpl });

/* --- The rig ---------------------------------------------------------------- */

function NexRig() {
  const root = useRef(null);
  const head = useRef(null);
  const face = useRef(null);
  const core = useRef(null);
  const armL = useRef(null);
  const armR = useRef(null);
  const stateRef = useRef({
    mode: 'idle', emotion: 'neutral', clip: 'idle', clipElapsed: 0,
    clipDef: { channels: ['breathe'] }, intensity: 1, amplitude: 0,
  });

  useEffect(() => nexEngine.subscribe((s) => { stateRef.current = s; }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 1000;
    const s = stateRef.current;

    let posY = 0, posZ = 0, headPitch = 0, headRoll = 0, torsoYaw = 0;
    let eyeX = 0, eyeY = 0, eyeScaleY = 1, mouth = 0.04, coreBoost = 0;
    let armRaise = 0, armSpread = 0;

    for (const ch of s.clipDef?.channels || ['breathe']) {
      const fn = CHANNELS[ch];
      if (!fn) continue;
      const o = fn(t, s) || {};
      posY += o.posY || 0; posZ += o.posZ || 0;
      headPitch += o.headPitch || 0; headRoll += o.headRoll || 0;
      torsoYaw += o.torsoYaw || 0;
      eyeX += o.eyeX || 0; eyeY += o.eyeY || 0;
      if (o.eyeScaleY != null) eyeScaleY = Math.min(eyeScaleY, o.eyeScaleY);
      if (o.mouth != null) mouth = Math.max(mouth, o.mouth);
      if (o.coreBoost != null) coreBoost = Math.max(coreBoost, o.coreBoost);
      armRaise = Math.max(armRaise, o.armRaise || 0);
      armSpread = Math.max(armSpread, o.armSpread || 0);
    }

    if (root.current) {
      root.current.position.set(0, posY, posZ);
      root.current.rotation.y = torsoYaw;
    }
    if (head.current) {
      head.current.rotation.x = headPitch;
      head.current.rotation.z = headRoll;
    }
    if (face.current) {
      const f = EMOTION_FACES[s.emotion] || EMOTION_FACES.neutral;
      const u = face.current.material.uniforms;
      u.uTime.value = t;
      u.uGlow.value = f.glow;
      u.uSquint.value = f.squint;
      u.uEyeShape.value = EYE_SHAPE[f.eyeShape] ?? 0;
      u.uEyeOffset.value.set(eyeX, eyeY);
      u.uEyeScaleY.value = eyeScaleY;
      u.uMouth.value = mouth;
    }
    if (core.current) {
      const mc = MODE_CORES[s.mode] || MODE_CORES.idle;
      const u = core.current.material.uniforms;
      u.uTime.value = t;
      u.uPattern.value = CORE_PATTERN[mc.pattern] ?? 1;
      u.uGlow.value = Math.min(1.4, 0.5 + coreBoost);
    }
    if (armL.current) armL.current.rotation.z = 0.45 - armRaise * 0.5 - armSpread * 0.35;
    if (armR.current) armR.current.rotation.z = -0.45 + armRaise * 0.5 + armSpread * 0.35;
  });

  const shell = '#e8e2d6';
  const graphite = '#33373d';

  return (
    <group ref={root} position={[0, -0.5, 0]}>
      {/* Plinth — rounded trapezoid body */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.34, 0.44, 0.56, 32]} />
        <meshStandardMaterial color={shell} roughness={0.55} metalness={0.08} />
      </mesh>
      {/* Belt line */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.365, 0.365, 0.05, 32]} />
        <meshStandardMaterial color={graphite} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Chest core — the second expression channel */}
      <mesh ref={core} position={[0, 0.36, 0.33]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <faceCoreMaterial isCore={1} />
      </mesh>
      {/* Arms — capsule limbs, rest pose down along the body */}
      <group ref={armL} position={[-0.36, 0.34, 0]}>
        <mesh position={[0, -0.14, 0]}>
          <capsuleGeometry args={[0.045, 0.26, 6, 12]} />
          <meshStandardMaterial color={shell} roughness={0.55} metalness={0.08} />
        </mesh>
      </group>
      <group ref={armR} position={[0.36, 0.34, 0]}>
        <mesh position={[0, -0.14, 0]}>
          <capsuleGeometry args={[0.045, 0.26, 6, 12]} />
          <meshStandardMaterial color={shell} roughness={0.55} metalness={0.08} />
        </mesh>
      </group>
      {/* Collar */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.07, 32]} />
        <meshStandardMaterial color={graphite} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Head — the egg, floating above the collar */}
      <group ref={head} position={[0, 0.88, 0]}>
        <mesh>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color={shell} roughness={0.5} metalness={0.06} />
        </mesh>
        {/* Face display glass */}
        <mesh ref={face} position={[0, 0, 0.235]}>
          <sphereGeometry args={[0.215, 32, 32]} />
          <faceCoreMaterial isCore={0} />
        </mesh>
        {/* Ear disks */}
        <mesh position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 24]} />
          <meshStandardMaterial color={graphite} roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 24]} />
          <meshStandardMaterial color={graphite} roughness={0.4} metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/* --- Public component ------------------------------------------------------- */

export default function Nex({ dock = false, className = '', speechBubble, ariaLabel = 'Nex, your AI tutor' }) {
  const reduced = useReducedMotion();

  if (reduced || TIER === 'low') {
    return <NexFlat dock={dock} speech={speechBubble} className={className} />;
  }

  return (
    <div
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={dock
        ? { position: 'relative', width: '100%', height: '100%' }
        : { position: 'relative', width: 160, height: 192 }}
    >
      <Canvas
        dpr={TIER === 'high' ? [1, 2] : [1, 1.5]}
        camera={{ position: [0, 0.2, 2.7], fov: 38 }}
        gl={{ antialias: TIER === 'high', alpha: true, powerPreference: 'low-power' }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} />
        <directionalLight position={[-2, 1, -1]} intensity={0.25} color="#f5be5a" />
        <NexRig />
      </Canvas>
      {speechBubble && <NexSpeech text={speechBubble} />}
    </div>
  );
}

function NexSpeech({ text }) {
  return (
    <div style={{
      position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ink-850)', border: '1px solid var(--ink-600)',
      borderRadius: 'var(--r-md)', padding: '6px 12px', fontSize: '0.8rem',
      color: 'var(--text-mid)', whiteSpace: 'nowrap', maxWidth: '90vw',
      overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{text}</div>
  );
}

/* 2D fallback — the character as SVG. Zero WebGL cost; shows state via the core color. */
function NexFlat({ dock, speech, className }) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Nex, your AI tutor"
      style={{ position: 'relative', width: dock ? '100%' : 148, aspectRatio: '5/6' }}
    >
      <svg viewBox="0 0 120 144" style={{ width: '100%', height: '100%' }} aria-hidden="true">
        <ellipse cx="60" cy="138" rx="30" ry="5" fill="rgba(0,0,0,0.4)" />
        <path d="M34 108 L86 108 L82 62 L38 62 Z" fill="#e8e2d6" />
        <rect x="37" y="74" width="46" height="6" fill="#33373d" />
        <circle cx="60" cy="86" r="12" fill="#14161a" />
        <circle cx="60" cy="86" r="7" fill="#f5be5a" opacity="0.75" />
        <rect x="47" y="32" width="26" height="8" rx="4" fill="#33373d" />
        <ellipse cx="60" cy="34" rx="23" ry="26" fill="#e8e2d6" />
        <ellipse cx="52" cy="32" rx="3.5" ry="6" fill="#f5be5a" />
        <ellipse cx="68" cy="32" rx="3.5" ry="6" fill="#f5be5a" />
        <rect x="25" y="28" width="5" height="12" rx="2.5" fill="#33373d" />
        <rect x="90" y="28" width="5" height="12" rx="2.5" fill="#33373d" />
      </svg>
      {speech && <NexSpeech text={speech} />}
    </div>
  );
}
