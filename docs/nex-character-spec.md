# NEX — Character Design Specification v1

The single most important asset in the product. This document is written to be
handed, as-is, to a character designer / 3D artist (or an AI generation tool
such as Meshy/Rodin). The current build ships an **original procedural
primitive rig** (`src/components/nex/NexModel.tsx`) that implements this spec
1:1 — geometry groups map to the same hierarchy, so a sculpted GLB can be
swapped in without touching the Behavior Engine, the renderer pipeline, or any
product surface. It is not a reskinned stock model.

## 1. Character brief

A small, futuristic educational companion robot. **Curious, intelligent,
patient, quietly encouraging. Playful but never childish; confident but never
arrogant.** The emotional register of a genuinely great human tutor expressed
through a non-human form — Pixar-grade restraint, not sci-fi menace, not a
toy-store mascot. Must feel right for a 15–17 year old: respected, not
condescended to.

## 2. Silhouette (the originality test)

Nex must be identifiable from silhouette alone:

```
      ·  ← single antenna, volt-tipped beacon, slight forward rake
     ╭─╮    domed head (wider than tall), continuous with visor below
    ( ◠ )   full-width dark visor band, two capsule eyes
   ╭─────╮
   │  ◉  │  capsule torso, bolted waist seam, glowing chest core
  ⌠│     │⌡  short stub arms ending in simple mitts
    ╲___╱
     ▔▔▔    hover-skid base with a soft volt ground-glow — NO LEGS
```

Distinctive elements: the **single antenna + volt beacon**, the **hover-skid**
(no legs/wheels — he floats with a gentle bob), the **bolted waist seam**
(precision engineering cue), and the **2:1 head-to-body ratio** (approachability).

## 3. Construction & materials

| Part | Material | Notes |
|---|---|---|
| Shell (head dome, torso, mitts) | Matte/satin porcelain `#E8ECE5`, roughness ≈ .48 | "Premium engineered object", not glossy toy plastic |
| Trim (seam, bolts, arms, antenna, ear caps) | Satin gunmetal `#24302A` | Visible precision: 8 waist bolts, seam torus |
| Visor | Piano-black glass `#0A0F0C`, clearcoat 1.0 | The frame for the face; light lives here, not on the shell |
| Eyes | Emissive Volt `#D7FF4A` capsules + white micro-shine | The shine dots are the "alive" trick — keep them |
| Core | Volt disk + gunmetal retaining ring | Second expression channel |
| Hover glow | Volt radial disk, additive, soft | Sells levitation without animation cost |

Colour identity: deliberately matched to NexLearn's Volt/Deep-Field palette —
Nex glows in the brand accent because *he is where the brand lives*. His
porcelain shell is the one warm-neutral note in the system.

## 4. Expression system (no human facial rig)

- **Eyes carry emotion**: scale (wide = curious/attentive, narrowed = focused,
  arcs = celebrating), position (gaze), blink (1.6–5 s spontaneous), glow
  intensity (0.15 sleeping → 1.9 peak delight).
- **Head carries attitude**: tilts (curious), nods (affirm), droop (sleeping).
- **Core carries state**: idle pulse → thinking flicker → celebration flare.
- **Antenna carries micro-personality**: notice-lift, celebrate-wobble.

## 5. Animation vocabulary (closed set, V1)

```
idle · breathe · blink · look_around
notice · look_at_target · turn_toward · point
think · head_tilt · curious
explain · gesture · nod · emphasize
celebrate · encourage · supportive_lean
enter_teaching_mode · exit_teaching_mode
talk_loop (amplitude-driven) · listen_loop · return_to_idle
```

Talking is **amplitude-driven and content-independent** (eye squish + body
micro-bounce + core pulse at speech amplitude). Phoneme lip-sync is explicitly
out of scope: Nex has no mouth by design.

## 6. Behavior architecture

1. **AI/reasoning layer** — the council's `director` agent emits a small JSON
   action: `{ mode, emotion, speech, animations[], whiteboard_actions[] }`.
2. **Behavior Engine** — `src/components/nex/behavior.ts`: deterministic,
   framework-agnostic state machine. Validates the action against the closed
   vocabulary; unknown clips are discarded, malformed actions fall back to
   `idle` silently. The LLM never touches raw coordinates.
3. **Renderer** — `NexModel.tsx` (R3F): critically-damped spring toward the
   pose the engine emits each frame; GPU failure → `NexPoster` SVG.

## 7. Production asset requirements (when commissioning the GLB)

- glTF/GLB, Draco or Meshopt compressed, **< 5 MB**, base mesh **< 15 k tris**
- PBR (metallic-roughness), drei-compatible out of the box
- Rig/aim targets: `head_group`, `eye_L/R`, `arm_L/R_shoulder`, `core`, `antenna_tip`,
  named exactly so the Behavior Engine maps 1:1
- Clips: the 23-name vocabulary above, 24–48 fps baked, plus `idle_breathe` loop
- Blend-shapes for eye scale are acceptable instead of bone-driven eyes
