"use client";

/**
 * NEX — original procedural character rig (placeholder-tier geometry by design;
 * see docs/nex-character-spec.md for the production-asset brief this rig
 * implements 1:1, so a sculpted GLB can be swapped in without touching the
 * Behavior Engine or any product surface).
 *
 * Silhouette: hover-skid base → capsule torso with bolted seam → domed head
 * with a full-width dark visor → single antenna with a volt-tipped beacon.
 */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { NexBehaviorEngine, NexPose, onNex } from "./behavior";

const VOLT = "#d7ff4a";
const PORCELAIN = "#e8ece5";
const INKGLASS = "#0a0f0c";
const TRIM = "#24302a";

function damp(cur: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(cur, target, lambda, dt);
}

/* deterministic idle seed so two Nex instances never breathe in sync */
let instanceCounter = 0;

function NexRig({ engine }: { engine: NexBehaviorEngine }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const handL = useRef<THREE.Mesh>(null);
  const handR = useRef<THREE.Mesh>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const shineL = useRef<THREE.Mesh>(null);
  const shineR = useRef<THREE.Mesh>(null);
  const antennaTip = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const coreRing = useRef<THREE.Mesh>(null);
  const hoverGlow = useRef<THREE.MeshBasicMaterial>(null);
  const cur = useRef<NexPose>({
    headX: 0, headY: 0, headZ: 0, bodyY: 0, bodyRotY: 0, bodyRotX: 0, bob: 0,
    armL: 0, armR: 0, handL: 0, handR: 0, eyeSX: 1, eyeSY: 1, eyeDX: 0, eyeDY: 0,
    wink: 0, blink: 0, glow: 1, core: 0.55, antenna: 0,
  });
  const phase = useMemo(() => instanceCounter++ * 1.618, []);

  const mats = useMemo(
    () => ({
      porcelain: new THREE.MeshStandardMaterial({ color: PORCELAIN, roughness: 0.48, metalness: 0.18 }),
      trim: new THREE.MeshStandardMaterial({ color: TRIM, roughness: 0.5, metalness: 0.55 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: INKGLASS, roughness: 0.08, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.4,
      }),
    }),
    []
  );

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const target = engine.update(dt * 1000);
    const c = cur.current;
    const L = 9; // damp lambda — snappy but never pops
    for (const k of Object.keys(c) as (keyof NexPose)[]) {
      c[k] = damp(c[k] as number, target[k] as number, L, dt) as never;
    }
    const t = state.clock.elapsedTime + phase;

    if (root.current) {
      root.current.position.y = 0.62 + c.bob + Math.sin(t * 0.9) * 0.008;
      root.current.rotation.y = c.bodyRotY;
      root.current.rotation.x = c.bodyRotX;
    }
    if (body.current) body.current.position.y = c.bodyY;
    if (head.current) head.current.rotation.set(c.headX, c.headY, c.headZ);
    if (armL.current) armL.current.rotation.z = 0.18 + c.armL;
    if (armR.current) armR.current.rotation.z = -0.18 + c.armR;
    if (armL.current) armL.current.rotation.x = c.handL * -0.4;
    if (armR.current) armR.current.rotation.x = c.handR * -0.4;

    const blink = 1 - c.blink * 0.92;
    const winkL = c.wink === 1 || c.wink === 2 ? 0.12 : 1;
    const winkR = c.wink === -1 || c.wink === 2 ? 0.12 : 1;
    for (const [eye, shine, wk, side] of [
      [eyeL, shineL, winkL, 1],
      [eyeR, shineR, winkR, -1],
    ] as const) {
      if (!eye.current) continue;
      eye.current.scale.set(
        c.eyeSX * (0.9 + c.glow * 0.1),
        Math.max(0.06, c.eyeSY * blink * wk),
        1
      );
      eye.current.position.x = side * 0.115 + c.eyeDX * 0.05;
      eye.current.position.y = 0.02 + c.eyeDY * 0.05;
      const m = eye.current.material as THREE.MeshBasicMaterial;
      m.color.set(VOLT).multiplyScalar(0.75 + c.glow * 0.45);
      if (shine.current) {
        shine.current.position.x = eye.current.position.x + 0.018;
        shine.current.position.y = eye.current.position.y + 0.028;
        shine.current.visible = wk > 0.5 && blink > 0.6;
      }
    }

    if (antennaTip.current) {
      const m = antennaTip.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.75 + 0.25 * Math.sin(t * 2.2);
      m.color.set(VOLT).multiplyScalar(pulse * (0.5 + c.glow * 0.5));
    }
    if (coreMat.current) {
      coreMat.current.color.set(VOLT).multiplyScalar(Math.max(0.08, c.core));
      coreMat.current.opacity = 0.55 + Math.min(0.45, c.core * 0.4);
    }
    if (coreRing.current) {
      const s = 1 + c.core * 0.08 + Math.sin(t * 2.8) * 0.015 * c.core;
      coreRing.current.scale.setScalar(s);
    }
    if (hoverGlow.current) {
      hoverGlow.current.opacity = 0.16 + Math.sin(t * 1.4) * 0.04 + c.bob * 1.2;
    }
  });

  return (
    <group>
      <group ref={root}>
        {/* ── torso ── */}
        <group ref={body}>
          <mesh material={mats.porcelain} castShadow>
            <capsuleGeometry args={[0.3, 0.3, 12, 28]} />
          </mesh>
          {/* waist seam + bolts — visible precision */}
          <mesh material={mats.trim} position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.295, 0.012, 10, 40]} />
          </mesh>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <mesh
                key={i}
                material={mats.trim}
                position={[Math.cos(a) * 0.296, -0.06, Math.sin(a) * 0.296]}
                scale={[1, 0.6, 1]}
              >
                <sphereGeometry args={[0.014, 8, 8]} />
              </mesh>
            );
          })}
          {/* chest core */}
          <group position={[0, 0.1, 0.27]}>
            <mesh ref={coreRing} material={mats.trim}>
              <torusGeometry args={[0.085, 0.016, 12, 32]} />
            </mesh>
            <mesh position={[0, 0, 0.008]}>
              <circleGeometry args={[0.062, 24]} />
              <meshBasicMaterial ref={coreMat} color={VOLT} transparent opacity={0.8} />
            </mesh>
          </group>
          {/* shoulder pivots + arms */}
          <group ref={armL} position={[0.32, 0.1, 0]}>
            <mesh material={mats.trim} position={[0, -0.1, 0]}>
              <capsuleGeometry args={[0.055, 0.12, 8, 16]} />
            </mesh>
            <mesh ref={handL} material={mats.porcelain} position={[0, -0.21, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
            </mesh>
          </group>
          <group ref={armR} position={[-0.32, 0.1, 0]}>
            <mesh material={mats.trim} position={[0, -0.1, 0]}>
              <capsuleGeometry args={[0.055, 0.12, 8, 16]} />
            </mesh>
            <mesh ref={handR} material={mats.porcelain} position={[0, -0.21, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
            </mesh>
          </group>
        </group>

        {/* ── head ── */}
        <group ref={head} position={[0, 0.52, 0]}>
          <mesh material={mats.porcelain} scale={[1, 0.92, 0.98]} castShadow>
            <sphereGeometry args={[0.34, 32, 24]} />
          </mesh>
          {/* ear caps */}
          <mesh material={mats.trim} position={[0.335, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.075, 0.075, 0.05, 20]} />
          </mesh>
          <mesh material={mats.trim} position={[-0.335, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.075, 0.075, 0.05, 20]} />
          </mesh>
          {/* visor */}
          <RoundedBox
            args={[0.52, 0.3, 0.3]}
            radius={0.11}
            smoothness={6}
            position={[0, 0.01, 0.14]}
            material={mats.glass}
          />
          {/* eyes */}
          <mesh ref={eyeL} position={[0.115, 0.02, 0.3]}>
            <capsuleGeometry args={[0.045, 0.075, 8, 16]} />
            <meshBasicMaterial color={VOLT} />
          </mesh>
          <mesh ref={eyeR} position={[-0.115, 0.02, 0.3]}>
            <capsuleGeometry args={[0.045, 0.075, 8, 16]} />
            <meshBasicMaterial color={VOLT} />
          </mesh>
          {/* eye shines */}
          <mesh ref={shineL} position={[0.133, 0.048, 0.315]}>
            <sphereGeometry args={[0.011, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh ref={shineR} position={[-0.097, 0.048, 0.315]}>
            <sphereGeometry args={[0.011, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* antenna */}
          <group position={[0.1, 0.3, 0]} rotation={[0, 0, -0.16]}>
            <mesh material={mats.trim} position={[0, 0.09, 0]}>
              <cylinderGeometry args={[0.011, 0.014, 0.19, 8]} />
            </mesh>
            <mesh ref={antennaTip} position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.032, 14, 14]} />
              <meshBasicMaterial color={VOLT} />
            </mesh>
          </group>
        </group>
      </group>

      {/* hover glow under chassis */}
      <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial ref={hoverGlow} color={VOLT} transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color={TRIM} roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

export interface NexSceneProps {
  className?: string;
  cameraZ?: number;
  cameraY?: number;
  interactive?: boolean;
}

/**
 * Self-contained Nex stage: owns the Behavior Engine, subscribes to the global
 * nex bus (actions / gaze / amplitude), renders at a clamped DPR.
 */
export default function NexScene({ className, cameraZ = 2.7, cameraY = 0.78, interactive = true }: NexSceneProps) {
  const engineRef = useRef<NexBehaviorEngine | null>(null);
  if (!engineRef.current) engineRef.current = new NexBehaviorEngine();

  useEffect(() => {
    const engine = engineRef.current!;
    const off = onNex((d) => {
      if (d.kind === "action") engine.setAction(d.action);
      else if (d.kind === "gaze") engine.setGaze(d.x, d.y, d.weight ?? 0.55);
      else engine.setSpeaking(d.value);
    });
    return off;
  }, []);

  useEffect(() => {
    if (!interactive || typeof window === "undefined") return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        engineRef.current?.setGaze(x, y, 0.4);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [interactive]);

  return (
    <div className={className} aria-label="Nex — 3D AI companion" role="img">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, cameraY, cameraZ], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[2.4, 3.4, 2.6]} intensity={2.1} />
        <directionalLight position={[-3.2, 1.6, -1.8]} intensity={0.7} color={VOLT} />
        <directionalLight position={[0, 1.2, -3]} intensity={0.5} color="#8fccff" />
        <NexRig engine={engineRef.current} />
        <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={3.2} blur={2.6} far={1.2} resolution={256} />
      </Canvas>
    </div>
  );
}
