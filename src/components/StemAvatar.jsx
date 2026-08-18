import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, useAnimations, useGLTF } from '@react-three/drei';

useGLTF.preload('/avatar/stem.glb');

const CLIP_ALIASES = {
  idle: ['Idle', 'idle', 'Idle_01'],
  wave: ['Wave', 'wave', 'Greeting'],
  walk: ['Walking', 'Walk', 'walk'],
  dance: ['Dance', 'dance'],
  jump: ['Jump', 'jump'],
  yes: ['Yes', 'yes', 'ThumbsUp'],
  sit: ['Sitting', 'sit'],
};

function pickClip(actions, kind) {
  const names = Object.keys(actions || {});
  const wanted = CLIP_ALIASES[kind] || [];
  const found = wanted.find((name) => actions[name]);
  return found || names.find((name) => /idle/i.test(name)) || names[0];
}

function StemRig({ mood = 'wave', talking = false }) {
  const group = useRef();
  const { scene, animations } = useGLTF('/avatar/stem.glb');
  const { actions, names } = useAnimations(animations, group);
  const current = useRef('');

  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    if (!actions || names.length === 0) return undefined;
    const nextName = pickClip(actions, mood);
    if (!nextName || current.current === nextName) return undefined;
    const next = actions[nextName];
    const prev = current.current ? actions[current.current] : null;
    next.reset().fadeIn(0.25).play();
    prev?.fadeOut(0.25);
    current.current = nextName;
    return undefined;
  }, [actions, mood, names]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.y = Math.sin(t * 1.4) * 0.06;
    group.current.rotation.y = Math.sin(t * 0.35) * 0.18 + (talking ? Math.sin(t * 6) * 0.04 : 0);
    group.current.rotation.z = talking ? Math.sin(t * 8) * 0.03 : 0;
  });

  return (
    <group ref={group} dispose={null} position={[0, -1.15, 0]} scale={0.92}>
      <primitive object={cloned} />
    </group>
  );
}

export default function StemAvatar({
  mood = 'wave',
  talking = false,
  onTap,
  dockStyle,
  caption,
}) {
  return (
    <div className="stem-stage" style={dockStyle}>
      <button type="button" className="stem-stage-hit" onClick={onTap} aria-label="Talk to Stem">
        <Canvas camera={{ position: [0, 0.9, 3.1], fov: 32 }} dpr={[1, 1.75]} gl={{ alpha: true }} style={{ background: 'transparent' }}>
          <ambientLight intensity={0.85} />
          <directionalLight position={[3, 5, 4]} intensity={1.4} color="#c4b5fd" />
          <directionalLight position={[-3, 2, -2]} intensity={0.7} color="#67e8f9" />
          <Suspense fallback={null}>
            <StemRig mood={mood} talking={talking} />
          </Suspense>
          <ContactShadows opacity={0.35} scale={6} blur={2.4} far={3} />
        </Canvas>
      </button>
      {caption ? <div className="stem-bubble">{caption}</div> : null}
      <div className="stem-nameplate">Stem · official avatar</div>
    </div>
  );
}
