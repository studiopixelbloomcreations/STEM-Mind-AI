# NEX — Character Design Specification

**NexLearn avatar program · canonical character document**

| | |
|---|---|
| Version | 1.0 |
| Date | 2026-08-30 |
| Status | Canonical. Referenced by `docs/CONTRACTS.md` §3.3 + §6 and by the header comment in `src/components/nex/Nex.jsx`. |
| Character | **Nex** — the NexLearn AI tutor avatar. (Nex = the character; NexLearn = the product. Never interchange.) |
| Sources of truth | `src/components/nex/Nex.jsx` (procedural rig as built), `src/nex/clips.js` (closed animation + face vocabulary), `src/nex/behaviorEngine.js` (state machine), `src/nex/director.js` (event→action mapping), `src/design/tokens.css` (`--nex-*` material tokens) |

**How to use this document**

- **Commissioned 3D artist** — read everything; your deliverable is defined by §7 and the master measurement table in Appendix A. §2 and §3 are the design intent behind every number.
- **AI 3D generation tool (Meshy / Rodin / similar)** — read §2 and §3, then use the generation prompts in §7.7 verbatim. The face display is *not* generated; the app draws it (§4.8).
- **Engineer** — §4–§6 define the runtime contract the GLB must satisfy. Appendix B lists every place the current procedural placeholder deviates from this spec; those are the gaps the production asset closes.

**Units.** All measurements are in the rig's abstract unit system (1 unit ≈ 35–40 cm at 1:1 desktop-object scale; the absolute scale is set by the component's CSS box, not the model). Internal consistency is what matters: total figure height is **1.46 units** in the production target, **1.18 units** in the placeholder as built (the head nests into the collar; see Appendix B). Ground plane is **y = 0**, forward is **+Z** (the face display faces +Z), origin at the center of the plinth's base.

---

## 1. Character brief

### 1.1 One line

Nex is a small ceramic presence that pays attention — a stationed companion the size and temperament of a good desk lamp, whose entire body is an instrument for showing that it is listening, thinking, and staying with you.

### 1.2 Personality

| Trait | Concrete meaning in behavior |
|---|---|
| **Curious** | Head tilts before answers arrive. Eyes brighten at a new question (`curious` face: glow 0.55 → 0.75) rather than at a correct answer. Interest is directed at the *problem*, not the performance. |
| **Intelligent** | Processing is *shown* as withdrawal, not chatter: `think` narrows the eyes (squint 0.35), drops the head 0.08 rad, lifts the gaze 0.22, and dims the eyes (glow 0.5). Nex visibly goes quiet to compute. |
| **Patient** | Wrong answers trigger `supportive_lean` — a 0.06-unit lean *toward* the student at low intensity (0.6, tied for the gentlest gesture in the library; only `return_to_idle` settles softer, at 0.4). Slowing down is encoded as smaller motion, never as longer scolding. |
| **Quietly encouraging** | Praise is a nod and a lean (`nod` + `encourage`), not a spectacle. Full celebration (`celebrate`, intensity 1) is reserved for a streak of 3+ correct answers — it is *earned*, which is what makes it mean something. |
| **Playful, never childish** | Wit lives in the *speech*, not the body: "Clean work. You saw the trap and walked past it." The body never mugs — no spinning, no wobbling, no oversized bounce. |
| **Confident, never arrogant** | Nex states, demonstrates, and points. It never hovers, hypes, or apologizes for the material. Gestures are declarative (`point`, `emphasize`), not performative. |

### 1.3 Age register

Nex addresses students aged **15–17** (Sri Lankan senior curriculum). The register is a **peer mentor — a slightly older lab partner**, not a teacher, not a mascot, not a children's TV host:

- Vocabulary: precise, subject-fluent, zero slang-forcing.
- Sentences: short declaratives. "Not this time — and that's fine. Let's see where it turned." No exclamation stacking; no gushing; no baby talk; no emoji-equivalent motion.
- Humor: dry, brief, occasionally there ("That answer hides a common mistake. Worth taking apart."). Never sarcastic about the *student* — only ever about the trap in the question.
- Emotional temperature: an adult instrument, a teenage peer voice. The character design must not push either way — no suit-and-tie authority, no rounded-baby friendliness.
- Voice (when voiced): mid-register, calm, slightly warm; rate ≈ 1.0; never an up-pitched "assistant" chirp.

### 1.4 What Nex is NOT

| Nex is not | Why the disqualification exists |
|---|---|
| **Never human** | No skin, hair, gender, nose, brows, lips, or hands. A human face on this body would instantly resolve the design into "person in a suit" and inherit every uncanny-valley failure mode. Expression comes from *light* (§4) and *posture* (§6), not from anatomy. |
| **Never cyberpunk / military** | No armor plating, no tactical paneling, no weapons, no HUD glyphs, no camo, no hard-edged chamfered shell. Those registers say "surveillance" and "combat" — the opposite of a tutor. |
| **Never a toy mascot** | No chibi proportions, no plush roundness, no sparkle, no bounce-idle. A 15–17-year-old will drop a cute mascot in one session. |
| **Never a stock robot** | Not a reskin of any marketplace or example-library robot (explicitly including Three.js's `RobotExpressive` — see §8). Nex is an original silhouette (§2) with an original material story (§3). |

### 1.5 Emotional register: Pixar-grade restraint

The rule that governs every animation decision:

> **Emotion is transmitted by changing the amplitude and timing of signals that already exist — never by adding new parts, effects, or extremes.**

In practice, from the actual clip library:

- The full dynamic range of joy is: a 0.12-unit double hop, arms swinging 0.7 rad outward, eyes switching to the `happy` shape, and the core flaring from 0.5 to 1.4. That is the ceiling of the entire character. There is no confetti, no particle burst, no camera shake, no sound-design stinger implied by the rig.
- The full dynamic range of disappointment is *nothing visible* — an incorrect answer produces a **lean toward** the student and a head tilt. Nex never slumps, never facepalms, never signals "you failed."
- Every channel has a hard ceiling (the amplitude table in §6.3). No clip may exceed it. If an emotion cannot be made legible within the ceilings, the design has failed — you do not raise the ceiling.

This restraint is what makes the two big moments (`celebrate`, `notice`) read as events instead of noise.

### 1.6 Where Nex lives

One instance of one component appears across every surface: marketing hero, teacher dashboard, student hub, quiz dock, teaching mode, live voice mode. Nex is the continuity of the product — the same presence, scaled (`scale` prop) or docked (`dock` prop), never restyled per-surface. Default canvas is **160×192 px (5:6 aspect, locked)**; dock mode fills its container. Under `prefers-reduced-motion`, low device tier, or `saveData`, the 3D canvas is replaced by the 2D SVG fallback (§2.8) — so the character must be fully legible as a flat silhouette, not only in 3D.

---

## 2. Silhouette & form language

### 2.1 The silhouette test

Squint at Nex until materials vanish. What remains must be:

1. **Three separate masses, two air gaps.** A truncated-cone plinth, a floating graphite ring, and an egg — with *nothing physically connecting them*. This stack (plinth – air – ring – air – egg) is the signature. It is the property no competitor robot shares, and it must survive to 32 px.
2. **One pinch.** The collar is the narrowest point of the whole figure (0.48 units wide vs. head 0.60, plinth top 0.68, plinth base 0.88). All silhouette drama concentrates at that waist.
3. **Two amber marks.** At minimum resolution Nex is: a dark band between two light masses, plus two amber pixels (eyes) and, if there's room, one amber dot (chest core). If the eyes and the core are not both individually visible at 64 px, the domes are too small.

If any of the three fail, the design fails — regardless of how good the render looks.

### 2.2 The stack, with production measurements

All values are the production target (y from ground; radial measures from the central axis):

| Stack position | y range | Part | Geometry | Radii / size |
|---|---|---|---|---|
| Mass 1 | 0.00 → 0.56 | **Plinth body** | Rounded-trapezoid cylinder (frustum), 32 radial segments | top r **0.34**, bottom r **0.44**, height **0.56** |
| — inset | 0.155 → 0.205 | **Belt line** (graphite) | Inset band following the local wall radius (≈ 0.40–0.41) | height **0.05**, inset 0.01–0.015 |
| **AIR GAP A** | 0.56 → 0.585 | — | **0.025 units** of clear separation between plinth top and collar | 2% of total height |
| Mass 2 | 0.585 → 0.655 | **Collar ring** (graphite) | Frustum, tapering inward toward the top | bottom r **0.24**, top r **0.20**, height **0.07** |
| **AIR GAP B** | 0.655 → 0.72 | — | **0.065 units** — the head gap, the loudest negative space in the design | 4.5% of total height |
| Mass 3 | 0.72 → 1.46 | **Head** | Egg — a sphere of r **0.30** stretched 1.23× vertically | width **0.60**, height **0.74**, depth **0.58**, center y **1.09** |

Total height: **1.46 units**. Maximum width: **0.88** (plinth base) → overall W:H ≈ **0.60**.

**Height proportion.** Design intent: **head ≈ 45% of total height.** As sketched with the full egg the head occupies 50–51% (0.74 of 1.46); the proportion floor of 44–45% corresponds to the unstretched 0.60-tall head. **Permitted band: 44–52%.** Below 44% Nex reads as an action figure (a body that happens to have a head); above 55% Nex collapses into toy/chibi territory. The head being *nearly half the figure* is a deliberate decision, not an accident: the head is the mount for the face display — the primary expressive surface — and a large head registers *attention* and *intelligence* rather than *labor*.

**The egg ratio.** Head height = **1.23 × head width** ("slightly taller than wide, 23% taller than the ideal width"). A taller-than-wide egg reads alert; a wider-than-tall egg reads sleepy or cute. The placeholder ships a sphere (0.60 × 0.60 × 0.60) — a documented simplification (Appendix B, D-1); the production asset restores the stretch.

### 2.3 Every form decision, and why

**The floating head, no neck.** The head is where attention lives, and attention must appear *held*, not *attached*. A neck makes the figure one continuous object — "a body wearing a head" — and drags the read toward action figure. The air gap does three jobs at once: (a) it makes the head an independent attention magnet that can tilt, rise, and hop with zero deformation cost — there is no neck to crease, stretch, or rig; (b) it creates the single most identifiable silhouette feature Nex owns; (c) it lets head pitch/roll be *large* (±0.22 rad) while still reading as calm, because the head is visibly a free object.

**The floating collar ring.** The graphite ring is *not* a socket and *not* a neck stand-in — it hovers with its own 0.025-unit gap above the plinth. Its job is to be the pinch point: it separates "body" from "head" so the egg never visually rests on the plinth, and its dark value slices the silhouette into the three-mass read. Its taper (bottom 0.24 → top 0.20) points *upward*, directing the eye toward the head.

**No legs.** A legged robot implies locomotion, and locomotion implies that Nex might leave. Nex is a **stationed companion** — it occupies a place on the desk the way an instrument or a lamp does, and says so with every proportion. The wide-at-base plinth (0.44 vs 0.34) is the visual statement of that: center of mass low, nothing about to go anywhere. Practically, it also removes walk cycles, foot IK, and ground-contact physics from the asset budget forever — scope that is spent instead on the face.

**The rounded-trapezoid plinth.** A pure cylinder is a can; a pure cone is a traffic device. The frustum (softly rounded in production — edge fillet ≈ 0.02–0.03) reads as a *plinth/pedestal*, which is exactly the museum-object register the product wants: Nex is an instrument placed in the room, not a creature loose in it. The taper also gives the resting arms something to hug (below).

**The big head.** Covered in §2.2 — but restate the *why*: the face display needs area. The amber eye system (§4) works at 25–35%-of-face-width eye scales precisely because the face itself is nearly half the character. A smaller head forces either larger eyes (toy) or an unreadable face (dead).

**Capsule arms, resting down the body.** Teaching requires deixis — *pointing at the board* is the single most important gesture a tutor makes (`point`, `enter_teaching_mode`, `explain`). So Nex has arms. But the default is rest: arm pivots at (±0.36, 0.34), arms as capsules (radius 0.045, total length 0.35) tilted **0.45 rad (≈ 26°) inward** so they lie flush against the plinth's outward taper — *hugging the body*, tangent to the wall, protruding ≤ 0.02 beyond the silhouette. No hands, no fingers, no elbows in V1: Nex points with the whole forearm capsule, which keeps every gesture a clean readable line and keeps the artist out of the uncanny valley of robot fingers. Resting arms keep the idle *calm* — a character whose default is "arms at sides, down" reads composed; a character whose default is "arms half-raised, ready" reads eager/clownish.

**Ear disks.** Two flat graphite cylinders (r 0.07, thickness 0.04, axis horizontal) mounted on the head's equator at ±x, protruding only 0.02. They do three jobs: (a) they anchor the head visually in the side view — without them the profile is a blank egg; (b) they are the *audio* metaphor for a voice-first tutor (live mode: Nex listens through them) without resorting to a whip antenna, which would read radio/military/bug; (c) their dark value adds a third material beat to the head, breaking up the ceramic. Keep them *flat disks* — never domes, never spheres, never antenna.

**The chest core.** A second, ambient expression channel (§5): the state of the session (idle / quiz / teaching / live) is readable *without looking at the face* — peripherally, from across the room, or when Nex is facing the board. A companion that can tell you what it's doing without demanding eye contact is a companion you can keep on screen all day.

### 2.4 Text turnaround

**FRONT (0°)**
- Bottom to top, the outline widths are: **0.88 → 0.68** (plinth taper) · inset to **0.48** (collar) · out to **0.60** (egg at equator) · ear disks add 0.02 each side (head-zone width 0.64) · egg curves to the crown at y 1.46.
- The pinch-to-head ratio: collar 0.48 is **80% of head width** and **71% of plinth-top width**. This is the proportion that makes the stack read as "floating" rather than "stacked."
- On the front of the plinth, centered at **y 0.36**, the chest core dome protrudes **0.084** from the wall (r 0.13 sphere, two-thirds exposed — §5).
- On the front of the head, the dark glass face dome: base radius **0.21** (covering ~71% of head width), protruding **0.15** proud of the head's front surface — a smooth watch-glass bulge, apex at z ≈ 0.45 from the head center.
- Two amber eyes on the glass, upper-center (§4.3). Two graphite ear disks flanking the egg. Two capsule arms tangent to the plinth's lower flanks.

**SIDE (90°)**
- The body is a **surface of revolution**: every cross-section of plinth, collar, and head is circular. There is no front-bias in the body geometry — all asymmetry is additive: face dome (+Z), core dome (+Z at y 0.36), ear disks (±X).
- Depth: plinth 0.68 at top → 0.88 at base; head depth 0.58 (egg is slightly shallower than wide). Face dome apex reaches z = 0.45 from head center — the only strong forward protrusion.
- The two air gaps read as horizontal dark slots across the profile: gap A (0.025) above the plinth's top face, gap B (0.065) above the collar. Gap B must read as *daylight* from at least 15° above the horizon.
- Ear disks read as circles (r 0.07) on the egg's flanks. Collar reads as a 0.07-tall ring edge.

**THREE-QUARTER (45°) — the signature view**
- The default presentation angle of the product. Gap B reads as a **dark crescent** between the collar's rim and the egg's underside — the money shot of the design.
- The face dome catches the key light; the amber back-rim (light at (−2, 1, −1), §3.3) licks the far silhouette edge of the head and plinth — Nex lit from behind by the tutor's lamp.
- Both ear disks must remain visible at 45°; if the far disk disappears, the disks are too shallow (protrusion floor: 0.02).
- The chest core dome is visible but foreshortened; its glow still reads.

### 2.5 Proportion quick-reference (artist's card)

| Ratio | Value |
|---|---|
| Total height (production / placeholder) | 1.46 / 1.18 units |
| Head width : height : depth | 0.60 : 0.74 : 0.58 (1 : 1.23 : 0.97) |
| Head share of total height | 45–52% (target band; see §2.2) |
| Collar width : head width | 0.48 : 0.60 = 0.80 |
| Plinth base : head width | 0.88 : 0.60 = 1.47 |
| Head gap (gap B) : total height | 0.065 : 1.46 ≈ 4.5% |
| Arm length : plinth height | 0.35 : 0.56 = 0.63 |
| Ear disk diameter : head width | 0.14 : 0.60 ≈ 0.23 |
| Face dome width : head width | ≈ 0.71 |
| Core dome diameter : plinth height | 0.26 : 0.56 ≈ 0.46 |

### 2.6 Lighting rig for all turnarounds and previews

Match the app so material approvals transfer (from `Nex.jsx`):

- Ambient: 0.55, neutral.
- Key: directional, intensity 1.1, from (2, 3, 2) — warm-white, upper right front.
- Amber rim/fill: directional, intensity 0.25, color `#f5be5a`, from (−2, 1, −1) — behind-left. This is *the tutor's lamp* (§3.3); do not remove it from turnaround renders.
- Camera: fov 38°, position (0, 0.2, 2.7), looking at the figure centered via a −0.5 y offset.
- Background: the product's `--ink-950` (#0a0b0d). No gradient backdrops in review renders.

### 2.7 Adjacency — nearest famous neighbors and how Nex differs

| Neighbor | Shared | Deliberate difference |
|---|---|---|
| EVE (*WALL-E*) | Egg head, dark screen face, no neck | EVE is gloss-white, blue-lit, legless-teardrop, toy-cute. Nex is **bone-warm satin** (not white, not gloss), **amber**-lit, has **arms** and a **plinth** (not a sealed capsule body), and a graphite collar ring EVE lacks. Nex reads *instrument*; EVE reads *product-design toy*. Do not drift toward gloss or blue. |
| BB-8 | Floating-seeming head mass, compact | BB-8 is a wheeled sphere-on-sphere droid, face on a physical screen, motion-forward. Nex is stationary, arm-bearing, display is *glass with drawn light*, and the three-mass-with-air-gaps stack is unique to Nex. |
| Baymax | Soft rounded companion, minimal face | Baymax is a balloon-soft vinyl climber with human legs and a two-dot face on vinyl. Nex is *hard ceramic* (matte instrument), legless, with light-drawn eyes on dark glass. |
| Stock robots (`RobotExpressive`, marketplace bots) | None — that's the point | Different mass stack, different material system, different palette, no anthropomorphic head plates. See §8. |

### 2.8 The 2D fallback (silhouette proof)

`NexFlat` in `Nex.jsx` renders the character as an SVG (viewBox 120×144, 5:6) for `prefers-reduced-motion`, low-tier, and `saveData` users. It is the standing proof that the design survives as a flat silhouette: bone trapezoid + graphite belt + dark face ellipse with two amber eyes + graphite collar + bone egg + ear disks + a chest dot whose **color/opacity carries state**. The production asset must not depend on 3D-only cues (specular, parallax, shadow) for any legibility — the SVG remains the reduced-motion contract.

---

## 3. Materials & color

### 3.1 The material system — exactly three families, no exceptions

Nex's body uses **two surface families plus one glass plus one emissive channel**. No trim chrome, no accent panels, no third finish. If a proposed detail needs a fourth material, the detail is wrong.

| Family | Role | Surfaces |
|---|---|---|
| **Bone ceramic shell** (satin matte) | The character's substance — 100% of plinth, head, arms | Plinth, belt-adjacent wall, egg, arm capsules |
| **Graphite** (satin, semi-metal) | Joints and separations — every place two forms meet or a part mounts | Collar ring, belt line, ear disks |
| **Dark glass** (the one glossy accent) | The single specular surface: the face display | Face dome on the head |
| **Amber emissive** (the one emissive channel) | Everything Nex *says with light*: eyes and chest core | Drawn on the face glass; the chest core dome |

Production note: the eyes and core are the *same* emissive channel — amber — expressed on two displays. There is no second emissive color anywhere in V1 (see the reserved green, §3.6).

### 3.2 PBR values (precise, for the artist)

**Bone ceramic shell**

| Property | Value |
|---|---|
| Base color | `#e8e2d6` (token `--nex-shell`) |
| Roughness | **0.50–0.55** (head 0.50, plinth and arms 0.55 in the rig) |
| Metalness | **0.06–0.08** |
| Sheen / clearcoat | None. This is satin, not gloss, not chalk |
| Shade variant | `#c9c2b2` (`--nex-shell-deep`) for any AO-baked or crevice-tinted vertex zones |

The read is **unglazed bone porcelain / satin studio ceramic** — warm, slightly off-white (it must never read pure white, which is the Apple-bot / EVE failure). Permitted micro-detail: a very subtle roughness variation (±0.03, fine noise or a faint vertical satin-brush at 2K or in roughness vertex bake) to keep large shells from going dead-flat under the key light. No clearcoat, no metal flake, no painted panel lines.

**Graphite joints**

| Property | Value |
|---|---|
| Base color | `#33373d` (token `--nex-graphite`) |
| Roughness | **0.40–0.50** (ear disks 0.40, collar 0.50, belt 0.60 in the rig — hold production to 0.40–0.50, belt may sit at 0.55–0.60 as a slightly softer band) |
| Metalness | **0.20–0.50** (belt 0.20, collar 0.30, ear disks 0.50 — brighter-metal at the small disks, softer at the large bands) |

The read is **anodized warm graphite** — a machined dark gray with a blue-warm cast that never reaches true black (never `#000`; the darkest Nex surface is the visor glass at `#14161a`). The graphite is the *joint language*: it appears only where two bone forms separate (collar, belt) or where a component mounts (ear disks, core bezel).

**Dark glass face display — the one glossy accent**

| Property | Value |
|---|---|
| Base color | `#14161a` (token `--nex-visor`); the shader's unlit display field renders at ≈ `#0d0e11` |
| Roughness | **0.12–0.18** |
| Metalness | **0.0** (dielectric) |
| Clearcoat (if the workflow supports it) | 0.6–0.8 |
| IOR | ≈ 1.5 |

Opaque is fine — this is *dark glass*, not transmission glass; skip refraction entirely (cheaper and visually identical at this scale). The only specular event on the whole character should be the soft studio reflection on this dome. No mirror finish, no environment-map sparkle beyond a soft neutral HDR.

**Amber emissive — the one emissive channel**

| Property | Value |
|---|---|
| Emissive color | `#f5be5a` (`--amber-400` = `--nex-display`); hot variant `#ffd98a` (`--amber-300` = `--nex-display-hi`) for the face's brightest state |
| Shader literal | `vec3(0.96, 0.75, 0.35)` ≈ `#f5bf59`; the face renders it ×1.2 (pushed toward amber-300) so eye/mouth pixels stay crisp on the dark field |
| Emissive intensity range | Eyes: **0.5–1.0** (emotion-driven, §4.4). Core: **0.5–1.4** (state + gesture-driven, §5.4) |
| Base color under the emissive | Near-black (`#0d0e11`) so the display reads as *off* where nothing is drawn |

Full amber ramp for reference: `#fff3d6` (100) · `#ffd98a` (300) · `#f5be5a` (400) · `#e8a93e` (500) · `#c98a26` (600). The character uses 400 as its body of light, 300 only at peak (`celebrating`), and 500–600 never on the character (they exist for UI borders).

### 3.3 Why amber on bone (and not the default sci-fi palette)

The default shorthand for "AI character" is **electric cyan + violet glow on navy** — cold, high-alert, machine-time. It says *surveillance, combat, nightclub*. NexLearn's art direction (CONTRACTS §2) is a **premium instrument for learning**, warm graphite ink with **one amber accent: "the tutor's lamp."**

So Nex's light is *the product's own light*: the character is **lit by the same lamp the interface uses** — the eyes and core emit exactly `--amber-400`, the same value that highlights a correct step on the whiteboard. When the student sees amber on Nex's face and amber on the board, they are seeing one continuous source of insight. That single decision does the brand work of an entire style guide.

And it encodes the register correctly:

- **Warm vs. cold.** A lamp is domestic — a desk, an evening, a person sitting with you. Cold blue light is a server room.
- **Education vs. military.** Amber is a reading light; cyan is an HUD. The palette *is* the anti-cyberpunk, anti-military clause made physical (§1.4, §8).
- **One light, not a light show.** One glossy surface, one emissive color, one family of warmth — restraint in the materials echoes restraint in the motion (§1.5). The character earns its two bright moments because everything around them is matte and quiet.

Bone ceramic is the other half of the argument: it is an *object* material (pottery, instruments, gallery plinths) — human-hand, human-time — as opposed to machine-housing materials (gloss ABS, brushed aluminum, anodized neon). Nex is a warm object that happens to think, not a machine that happens to be friendly.

### 3.4 Accent discipline

- **One glossy accent**: the face glass. Every other surface is matte or satin. No second specular.
- **One emissive channel**: amber. No RGB, no cyan rim, no violet underlight, no bi-color eyes.
- **No gradients** on any Nex material. The brand's rule — hairlines and mono microlabels, not glow and gradient — extends to the character.
- No glow/bloom postprocessing on the avatar canvases. The amber reads as *bright*, not as *haloed*.

### 3.5 The reserved second light (do not ship in V1)

`--nex-core-resolve` (`#59d6a3`, resolve green) exists in `tokens.css` and is reserved for a possible correct-answer micro-flash on the chest core. **V1 ships amber-only** (all `MODE_CORES` entries are `amber`). Introducing green to the character requires a CONTRACTS §3.3 change first. Artists: do not bake green anywhere into the model.

### 3.6 Material count and draw calls (production)

4 materials / ≤ 5 draw calls: shell (merged plinth + head + arms), graphite (merged collar + belt + disks + bezel), glass (face dome), emissive (core dome — or driven by the app's display shader, see §7.5).

---

## 4. The face display

### 4.1 Principle: a digital face, no literal features

Nex's face is a **dark glass display with light drawn on it** — never sculpted features. There is no nose, no brow, no lips, no cheekbones, no jaw hinge, on the shell or in relief on the glass. Everything a face needs to communicate here is achieved with **two eye shapes + one optional mouth ellipse + light**.

Why: sculpted anthropomorphic features on an abstract body are the single fastest route to the uncanny valley, and — worse for a tutor — they *pre-date* the emotion: a sculpted smiling face can't stop smiling when the student is stuck. A drawn face re-renders every frame and can be exactly right at all times.

Hard rules:

1. **No eyebrows.** Expression comes from eye *shape*, not brow position. Brows are the most human-adjacent feature and the first thing that makes an egg uncanny.
2. **No mouth at rest.** The mouth exists only while speaking (§4.6), and only as an ellipse of light.
3. **No features on the shell.** Eyes and mouth live on the glass only. The ceramic never has cut features.

### 4.2 The face canvas (coordinates for the artist)

Two nested circles define the canvas. The face lens (sphere r 0.215, centered 0.235 forward of the head center) exits the head shell as a spherical cap **0.43 units wide** (71% of head width); the shader's view gate lights a slightly smaller disc — fully on within ~63° of the dome's forward apex (**0.38 units wide**), fading to zero by ~73° (**0.41 wide**). Features are authored inside the fully-lit disc and dissolve through the fade band; nothing ever paints around the side of the head.

Feature positions in both the app's shader-UV space and seam-free angular terms (longitude ± from the forward meridian; latitude from the dome equator, + up):

| Feature | Shader UV (u, v) | Angular position | Note |
|---|---|---|---|
| Eye centers | u 0.40 and 0.60 (±0.10 from u 0.50), v 0.56 | **±36° longitude, +11° latitude** | upper-center |
| Eye separation | 0.20 u | **72° of longitude — chord 0.248 units, 58% of the visible face width** | wide-set, calm |
| Mouth center | u 0.50, v 0.34 | **0° longitude, −29° latitude** | lower third of the canvas |

- **Camera-facing gate**: features fade out as the surface normal turns away from the viewer — the shader gates on view-space normal z between **0.30 and 0.45** (fully on within ~63° of the camera axis, gone by ~73°). Production reproduces this as an angle mask on the display material, never a hard clip: as the head turns, features slide toward the rim and dissolve rather than snapping off.
- **UV seam warning (critical, see D-0)**: three.js `SphereGeometry` maps the forward apex (+Z) to **u = 0.25**; the u = 0.50 meridian is the dome's **+X side**, 90° off the face. Every display mesh must therefore be generated with `phiStart = 3π/2` (which puts u = 0.50 at +Z, making the UV table above literal), or the shader must re-map u — `u = fract(u + 0.25)` — before doing any centered math. The placeholder skips this and paints its face onto the side of the dome.

### 4.3 Eye shapes (the five glyphs)

Eye sizes in shader UV (x, y = half-extents), with full angular extent (a glyph of UV half-extent *a* spans **360° × a** of longitude / **180° × a** of latitude — the sphere maps u to 2π and v to π), and the size relative to the visible face disc (145° across, 0.41 units — §4.2):

| Shape (id) | UV half-extent | Full angular extent | % of visible face (W × H) | Read |
|---|---|---|---|---|
| `round` (0) | (0.055, 0.085) | 39.6° × 30.6° | **27% × 21%** | Neutral open attention — the resting glyph |
| `narrow` (1) | (0.07, 0.05) | 50.4° × 18° | **35% × 12%** | Processing — wide-shallow slit, the "working" face |
| `happy` (2) | (0.06, 0.045) | 43.2° × 16.2° | **30% × 11%** | Success — flattened arc; **production target: an upward-curving crescent** (classic closed-eye smile) rather than the placeholder's flat ellipse |
| `soft` (3) | (0.05, 0.065) | 36° × 23.4° | **25% × 16%** | Empathy — smaller, lowered-lid gentle oval |
| `wide` (4) | (0.06, 0.11) | 43.2° × 39.6° | **30% × 27%** | Reception — enlarged oval, alert listening |

`wide` is the ceiling glyph: no eye may ever be drawn wider than 35% or taller than 27% of the visible face (§8, row 6).

Rules of proportion: each eye is 25–35% of the visible face width at its widest glyph (the hard ceiling is the `wide` shape, 30% W × 27% H — §8, row 6); eye centers 72° of longitude apart (0.20 shader-u; chord 0.248 units ≈ 60% of face width — wide-set reads calm, close-set reads shifty); the gap between inner edges ≈ 30% of face width. All shapes are **ellipses or arcs of light** with soft edges (shader smoothstep 0.02 — a 2%-of-UV soft falloff; never pixel-hard, never blurry-glowed).

**Squint law**: any shape's height multiplies by `(1 − 0.6 × squint)` — squint is a 0–1 parameter that closes the lids downward without moving the eye centers.

### 4.4 The seven emotions — complete parameter map

From `EMOTION_FACES` (`src/nex/clips.js`) plus the shape geometry above. Glow is the emissive intensity of the eye glyphs; squint per the law above.

| Emotion | eyeShape | Glow | Squint | Effective eye size (angular W° × H° / % of visible face) | Design note |
|---|---|---|---|---|---|
| `neutral` | round | **0.55** | 0 | 39.6° × 30.6° (27% × 21%) | Resting attention. Present, not performative. |
| `curious` | round | **0.75** | **0.1** | 39.6° × 28.8° (27% × 20%) | Brighter + slightly lidded: focus, not surprise. Curiosity is *squeezed* attention. |
| `thinking` | narrow | **0.5** | **0.35** | 50.4° × 11.7° (35% × 8%) | Widest and shortest glyph at the *lowest* glow — thinking is visibly *less* light. |
| `encouraging` | round | **0.8** | 0 | 39.6° × 30.6° (27% × 21%) | Maximum open warmth — same shape as neutral, more light. |
| `celebrating` | happy | **1.0** | 0 | 43.2° × 16.2° (30% × 11%) | The only emotion at full glow; the smile-eye crescent. |
| `supportive` | soft | **0.7** | **0.15** | 36° × 20° (25% × 14%) | Smaller, lowered lids — the gentleness shape for wrong answers. |
| `attentive` | wide | **0.7** | 0 | 43.2° × 39.6° (30% × 27%) | Largest area, moderate light — receiving, not projecting. Used for live listening and teaching attention. |

Squint in the numbers: the squint law multiplies glyph height by `(1 − 0.6 × squint)`, so `curious` (0.1) compresses the round eye to 0.94× height, `thinking` (0.35) to 0.79×, `supportive` (0.15) to 0.91×.

Cross-check the intended read: the brightness ordering is `thinking (0.5) < neutral (0.55) < curious/supportive/attentive (0.7–0.75) < encouraging (0.8) < celebrating (1.0)`. Emotion on this face is a *dimmer*, first and foremost — which is exactly the Pixar-grade restraint of §1.5: the same two glyphs, re-lit.

### 4.5 Blink

- One-shot, **180 ms** total: 90 ms close, 90 ms open — a symmetric triangular profile.
- Implemented as eye **scaleY dipping from 1.0 to 0.10** (i.e., 90% height reduction, never a full close to zero — a thin bright line remains, which keeps the face "on" and avoids a dead-frame pop).
- In the renderer, blink always wins over other eye-scale contributions (blend rule: **min**, §6.4).
- Production cadence: auto-blink every **3–7 s (randomized)**; suppressed during `think` (a thinking face does not blink mid-computation — it breaks the withdrawal read).

### 4.6 Talk — the mouth, and why it is not lip sync

While `talk_loop` is active, a **mouth ellipse of light** appears at the mouth position:

- Width: **36° of longitude** (UV 0.05 half-extent → **25% of face width**, fixed).
- Height: **7° → 25° of latitude** (UV 0.02 + amp × 0.05 half-extent), driven by live audio amplitude, floored at `max(0.06, amplitude)`, gated to draw only when mouth drive > 0.05 (i.e., only while speech audio is actually running). At floor amplitude 0.06 the mouth is 8° tall (6% of face height); at full voice 25° (17%).
- Shape: a rounded ellipse. No corners, no teeth, no tongue, no visemes.

**The deliberate choice: amplitude-driven, never phoneme lip sync.** Reasons, in order of weight:

1. **Reliability.** The mouth is driven by a single scalar from the audio analyser (`micLevel`/`setAmplitude`, contract §3.6). It cannot desynchronize, because there is nothing to synchronize — the mouth is *the sound's own envelope*. Viseme systems depend on knowing the TTS engine's exact timing; a wrong viseme is dramatically more uncanny than a simple ellipse, and this stack has no way to guarantee timing across browsers, voices, and network jitter.
2. **Character.** Nex is calm. A chattering jaw reads as puppet; a breathing ellipse of light reads as *speech as light* — consistent with a character whose whole face is a display.
3. **Cost.** Zero viseme assets, zero per-frame mouth targets, one uniform.

The production GLB carries this forward as a single morph target (`mouth_open`, 0–1) driven by the same amplitude scalar (§7.4).

### 4.7 Gaze

The eyes translate on the display (they do not rotate a ball — there is no eyeball):

- Horizontal travel: **±0.048 UV** (±17° of azimuth on the dome) — from `gaze_sweep` at ±0.3 × 0.16 scaling; ambient drift is ±0.15 × 0.16 ≈ ±0.024 UV.
- Vertical travel: **−0.013 to +0.035 UV** (ambient drift down −0.08 × 0.16; `gaze_up` +0.22 × 0.16 for the thinking look).
- Gaze states (contract §3.3): `screen`, `student`, `board`, `camera`, `off`. The renderer maps named gaze targets to eye-offset + head-pose combinations; `gaze_lock` (used by `notice`, `look_at_target`, `listen_loop`) fixes the eyes with a slight +0.02 upward bias — the "making eye contact" position.
- Production: gaze is a state, not a clip — it must compose with any active clip (idle eyes continue drifting under a locked gaze is *wrong*; locked means locked).
- **The gaze offsets are in the same UV space as the eye positions (§4.2) and therefore inherit the D-0 seam rule** — apply the same u re-map, or the eyes drift toward the dome's side instead of the intended direction.

### 4.8 Production note — the display stays in the app

**The display stays in the app.** The face display is **not baked into the GLB**. The app already owns a tuned shader (`FaceCoreMaterial` in `Nex.jsx`) that draws the five glyphs, squint, blink, gaze offset, mouth, and the camera-facing gate. The production asset ships the face dome as **blank dark glass geometry** (with material values per §3.2); the app assigns the display material to that node. This keeps one source of truth for the face, keeps ~1 MB of animated-emissive texture out of the download, and sidesteps the fact that no AI generation tool can produce a correct five-glyph shader face. The GLB's obligation is geometric only: a dome of the specified curvature with clean, seam-free (or seam-corrected) UVs on its front cap — see the seam warning in §4.2.

**Two implementation notes for the app-side shader** (the current `Nex.jsx` material, to be fixed with the production pass):

1. **UV seam (D-0, cosmetic-critical):** `SphereGeometry` puts u = 0 at −X and the +Z forward apex at **u = 0.25**, so the shader's u = 0.50 "center" is actually the dome's +X side. As built, the left eye lands 54° off the forward meridian, the right eye paints on the dome's flank inside the head shell (the lens cap ends at u ≈ 0.52; 0.60 is past it), and the mouth sits on the lateral equator where the view gate suppresses it. Fix once, in the shader, by re-mapping: `u = fract(u + 0.25)` before any centered math (or generate the display sphere with `phiStart = 3π/2`). After the re-map, the §4.2/§4.3 UV tables are literal.
2. **Emissive-only mesh:** the display material is unlit/`emissive` with no specular response of its own (the glass specular lives on the base material beneath the glyph layer, per §3.2).

---

## 5. The chest core

### 5.1 Role

The core is the **second expression channel**: a small amber dome on the chest that reports *what Nex is doing* (mode) and *how hard* (gesture-driven brightness) — legible peripherally, without eye contact, and even when Nex is turned toward the board. The face is for *emotion*; the core is for *state*. Keeping them on separate channels means a student can read "it's teaching now" from across the room while the face does encouragement.

### 5.2 Geometry and mounting

- Sphere, **r 0.13**, center at **(0, 0.36, 0.33)** — mounted on the plinth's front face, two-thirds exposed: it protrudes **0.084** beyond the body wall at that height (a raised dome, not a flat panel or an inset screen). Raising it gives the core a lobe that catches the amber rim light and reads from oblique angles.
- Vertical placement: **0.36 y** — upper-center of the plinth (plinth spans 0–0.56), i.e., chest height, in line with the face dome above it so the two amber displays sit on one vertical axis (the figure's "spine of light").
- A **graphite bezel ring** surrounds the dome: an annulus at normalized radius 0.50–0.62 of the core face, holding a constant 0.6 glow contribution — a machined ring separating ceramic from light. This is the fourth and final graphite placement (collar, belt, ear disks, core bezel). Like the patterns, the bezel is drawn with centered UV math and inherits the D-0 seam defect as built; after the u re-map it circles the visible apex.

### 5.3 The four mode patterns

From `MODE_CORES` (`clips.js`) and the core branch of the shader. All amber. `r` = normalized radial coordinate (0 center → 1 dome edge):

| Mode | Pattern | Shader | Timing/geometry | Reads as |
|---|---|---|---|---|
| `idle` | **slow_pulse** | `0.35 + 0.2 × (0.5 + 0.5·sin(t × 0.002))` | **~3.1 s** breathing cycle, gentle radial falloff | "Alive, at rest" — the standby heartbeat |
| `quiz` | **steady** | constant 0.55 | flat, unwavering | "Locked on the task" — a held breath, steady attention |
| `teaching` | **sweep** | `step(fract(y × 3 − t × 0.0004), 0.5) × 0.7` | **3 hard-edged horizontal bands**, one transiting the core every **~0.8 s**, full cycle **2.5 s** | "Processing/progressing" — a scanner sweep, knowledge moving through |
| `live` | **ripple** | `0.5 + 0.3 × sin(r × 12 − t × 0.003)` | Concentric rings, radial frequency 12 (~1.9 wavelengths across the dome), **~2.1 s** cycle | "Listening/waveform" — concentric water rings, sound arriving |

Pattern discipline: the sweep is the only hard-edged (binary `step`) pattern — deliberate, it reads as *machine* against the three smooth ones; idle/quiz/ripple must stay soft. Patterns are mode-exclusive (one at a time, set by DirectorAction.mode); they are never layered. **All four patterns are authored in raw sphere-UV centered math (`vUv − 0.5`) and therefore center on the core sphere's UV origin (0.5, 0.5) — its +X point, which is buried inside the plinth.** As built (D-0), pulse and ripple read as off-center partial rings on the visible dome, and the bezel ring circles a point inside the body. Apply the same u re-map (`fract(u + 0.25)`) to the core mesh so all patterns center on the forward apex; the sweep's bands (y-only) read correctly either way but should span v 0.30–0.70 of the forward face.

### 5.4 Brightness — the gesture channel

The core's emissive intensity follows `glow = min(1.4, 0.5 + coreBoost)`, where `coreBoost` comes from animation channels and therefore from what Nex is *doing*:

| Source channel | coreBoost | Effective glow | Triggered by |
|---|---|---|---|
| (none — resting) | 0 | **0.5** | baseline |
| `core_flicker` | 0.3 ± 0.3 wave @ 260 ms | 0.5–1.1 | `notice`, `emphasize` |
| `core_think` | 0.3 + 0.2·wave @ 700 ms | 0.6–1.0 | `think` (loop) |
| `core_brighten` | +0.6 | **1.1** | `enter_teaching_mode` |
| `core_flare` | 0.8 + 0.2·wave @ 300 ms | **1.3–1.4 (capped)** | `celebrate`, `emphasize` |

So the brightness ladder is: idle 0.5 → thinking ~0.8 → noticing ~0.8 → **entering teaching 1.1** → **celebrating 1.4 (ceiling)**. The two spec-mandated moments: **flare on `celebrate`** (the visual peak of the entire character, capped at 1.4 — never brighter) and **brighten on `enter_teaching_mode`** (a +0.6 step that says "the lamp turns up when the lesson starts").

Blend rule: when multiple core channels are active, the renderer takes the **max** (§6.4) — a flare is never halved by a concurrent think.

### 5.5 What the core is not

Not a speaker grille, not a power button, not a power meter, not a battery, not a heart. It has no iconography, no text, no percentage arc. It is an abstract state light — the more concrete it becomes, the more it implies functions the product does not have.

---

## 6. Animation vocabulary

### 6.1 The three-layer architecture

The behavior system is deliberately split so that **no LLM ever moves a joint**:

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. DIRECTOR — src/nex/director.js                                    │
│    deriveDirectorAction(event, context) -> DirectorAction            │
│    A pure, synchronous function mapping learning-state events        │
│    (question_shown, answer_correct, student_stuck, teaching_step,    │
│    live_speaking, session_idle, ...) to a DirectorAction (contract    │
│    §3.3): mode, emotion, speech, animations[], gazeTarget,           │
│    intensity. Deterministic templates; the LLM may refine SPEECH     │
│    only, through the council proxy, sanitized against the closed     │
│    vocabulary. Structure, clips, gaze: always decided here.           │
├──────────────────────────────────────────────────────────────────────┤
│ 2. BEHAVIOR ENGINE — src/nex/behaviorEngine.js                        │
│    Framework-agnostic state machine (no React, no Three). dispatch() │
│    validates every field against whitelists, queues clips in order,   │
│    holds loops until replaced, times one-shots, exposes subscribe(). │
│    HARD RULE: unknown clip or malformed action NEVER throws —         │
│    silent fallback to idle.                                          │
├──────────────────────────────────────────────────────────────────────┤
│ 3. RENDERER — src/components/nex/Nex.jsx (NexRig)                     │
│    R3F. Subscribes to the engine snapshot; evaluates the active      │
│    clip's channels into a pose; drives the face/core shaders.        │
└──────────────────────────────────────────────────────────────────────┘
```

**"The LLM names clips, never coordinates."** The LLM's only motion authority is selecting from the closed list of 23 clip names (max 4 after sanitization, 5 after dispatch). It cannot specify a duration, an angle, a bone, or a blend. Every number below is code, not prompt. This is what makes the character safe to put in front of students: the worst possible LLM output is a slightly odd *ordering* of approved motions — never a glitch pose, never a frozen frame, never a crash. Malformed input degrades to `idle` silently at three independent gates: `sanitizeDirectorPayload` (director), the whitelist filter in `dispatch` (engine), and `setClip`'s name check (engine) — plus a try/catch around every listener emit so a renderer bug cannot break the engine either.

### 6.2 The closed V1 vocabulary — all 23 clips

Durations are the library definitions in `clips.js`. Actual playback of a one-shot lasts `duration × (2 − intensity)` (§6.5). "Intensity" is the clip's authored amplitude default; the DirectorAction's `intensity` field scales it at runtime.

| # | Clip | Channels | Type | Duration | Intensity | Intent |
|---|---|---|---|---|---|---|
| 1 | `idle` | breathe, gaze_drift | **loop** | 4000 ms | 0.25 | Resting baseline: breath + slow eye wander. The default clip and the fallback target. |
| 2 | `breathe` | breathe | **loop** | 3600 ms | 0.30 | Ambient respiration alone (idle minus gaze drift). |
| 3 | `blink` | blink | one-shot | 180 ms | 1 | Eye scaleY dip to 0.1 and back (§4.5). |
| 4 | `look_around` | gaze_sweep | one-shot | 2400 ms | 0.60 | Eyes sweep ±0.3 UV — scanning, checking the room. |
| 5 | `notice` | head_up, gaze_lock, core_flicker | one-shot | 700 ms | 0.90 | The attention snap: head lifts 0.12 rad, eyes lock, core flickers. Highest-contrast one-shot after `celebrate`. |
| 6 | `look_at_target` | gaze_lock | one-shot | 600 ms | 0.80 | Fix the eyes (slight up-bias) without moving the head. |
| 7 | `turn_toward` | torso_turn | one-shot | 800 ms | 0.70 | Body yaws 0.18 rad (~10°) toward the student/board. |
| 8 | `point` | arm_point | one-shot | 1400 ms | 0.80 | The teaching gesture — arm raises to `armRaise` 0.9. Deixis is the tutor's core verb. |
| 9 | `think` | head_tilt_down, core_think, gaze_up | **loop** | 2800 ms | 0.60 | The processing hold: head tips down +0.08 rad and rolls 0.1, eyes rise 0.22, core thinks. Holds until replaced (used for `live_thinking`). |
| 10 | `head_tilt` | head_tilt_side | one-shot | 900 ms | 0.70 | Head rolls 0.22 rad (~13°) and releases — the "hmm?" tilt. |
| 11 | `curious` | head_tilt_side, lean_in | one-shot | 1100 ms | 0.80 | Tilt + 0.06 lean toward the target: interest with body. |
| 12 | `explain` | arm_present, head_nod_subtle | **loop** | 2600 ms | 0.65 | The teaching cadence: arm half-raised (0.45) presenting, head bobbing ±0.02. |
| 13 | `gesture` | arm_open | one-shot | 1200 ms | 0.70 | Arms spread outward 0.5 — open-palm "you see it?" beat. |
| 14 | `nod` | head_nod | one-shot | 900 ms | 0.80 | 1.5-cycle decaying confirm nod (±0.13 rad peak). |
| 15 | `emphasize` | arm_strike, core_flicker | one-shot | 800 ms | **1** | Sharp single beat: arm strikes (sin pulse to 1.0), core flickers. |
| 16 | `celebrate` | hop, arms_raise, core_flare, eyes_happy | one-shot | 1300 ms | **1** | The peak: 0.12-unit double hop, arms swing out (armRaise 1.2), core flares to 1.4, eyes switch to `happy`. Everything else in the library is quieter than this on purpose. |
| 17 | `encourage` | lean_in, head_nod | one-shot | 1200 ms | 0.75 | Lean + nod: "you've got this." |
| 18 | `supportive_lean` | lean_in, head_tilt_side | one-shot | 1500 ms | 0.60 | The wrong-answer response: lean in, tilt, *low* intensity. Empathy is slow and small. |
| 19 | `enter_teaching_mode` | torso_turn, arm_present, core_brighten | one-shot | 900 ms | 0.90 | The mode shift: turn, present the board, core steps to 1.1. |
| 20 | `exit_teaching_mode` | arm_relax, torso_return | one-shot | 800 ms | 0.60 | Release: arms down, body returns to square. *(Channels not yet implemented in the placeholder rig — Appendix B, D-4.)* |
| 21 | `talk_loop` | talk_jaw, head_speak, gesture_subtle | **loop** | 1800 ms | amplitude-driven | Speech: mouth ellipse from live amplitude (§4.6), ±0.03 head cadence scaling with loudness, subtle arm motion 0.15–0.25. The only amplitude-driven clip. |
| 22 | `listen_loop` | lean_in, gaze_lock, nod_subtle | **loop** | 2400 ms | 0.50 | Live listening: leaned in, eyes locked, ±0.02 nod. |
| 23 | `return_to_idle` | settle_return | one-shot | 900 ms | 0.40 | The graceful land: settle −0.02, zero the roll and yaw, then the engine drops to `idle`. |

The director's event→clip map (for reference, from `director.js`): `question_shown` → notice, turn_toward, head_tilt (curious, 0.8) · `answer_correct` → nod, encourage (streak < 3) or celebrate, nod (streak ≥ 3) · `answer_incorrect` → supportive_lean, head_tilt (0.6) · `student_stuck` → notice, supportive_lean, enter_teaching_mode (0.9) · `teaching_started` → enter_teaching_mode, point · `teaching_step` → point, explain · `teaching_ended` → exit_teaching_mode, nod · `live_listening` → listen_loop · `live_thinking` → think · `live_speaking` → talk_loop · `session_idle` → return_to_idle.

### 6.3 The channel library and its ceilings

28 named channels, each `(t, state) -> partial pose`. These amplitudes are the **hard ceilings of the character** (§1.5) — no clip may exceed them:

| Channel | Pose contributions | Ceiling / law |
|---|---|---|
| `breathe` | posY ±0.035·int, headPitch ±0.02 | 3600 ms sine |
| `gaze_drift` | eyeX ±0.15 @ 7 s, eyeY ±0.08 @ 9 s | slow wander |
| `gaze_lock` | eyeY +0.02 | fixed gaze |
| `blink` | eyeScaleY 1 → 0.10 → 1 | triangular, 180 ms |
| `gaze_sweep` | eyeX ±0.3 | 2400 ms |
| `head_up` | headPitch −0.12·e, posY +0.02·e | ease-out 400 ms |
| `core_flicker` | coreBoost 0.3 ± 0.3 | 260 ms wave |
| `torso_turn` | torsoYaw +0.18·e | ease-out 800 ms |
| `arm_point` | armRaise 0.9·e | 600 ms rise |
| `head_tilt_down` | headRoll 0.1·e, headPitch +0.08·e | 700 ms |
| `head_tilt_side` | headRoll 0.22·(e − release) | rise 500 ms, release 700→1100 ms |
| `gaze_up` | eyeY +0.22 | hold |
| `lean_in` | posZ +0.06·e | 600 ms |
| `head_nod` | headPitch sin(3π·rel)·0.08·(1−rel)·2 | 900 ms, decaying |
| `head_nod_subtle` | headPitch ±0.02·int | 1300 ms |
| `arm_present` | armRaise 0.45·e | 500 ms |
| `arm_open` | armSpread 0.5·e | 500 ms |
| `arm_strike` | armRaise sin(π·e) | 800 ms, peak 1.0 |
| `hop` | posY \|sin(2π·e)\|·0.12 | 1300 ms, two hops |
| `arms_raise` | armRaise 1.2·e | 500 ms |
| `core_brighten` | coreBoost +0.6 | hold |
| `core_think` | coreBoost 0.3 + 0.2·wave | 700 ms |
| `core_flare` | coreBoost 0.8 + 0.2·wave | 300 ms |
| `talk_jaw` | mouth max(0.06, amplitude) | live amplitude |
| `head_speak` | headPitch ±0.03·(0.3 + amp) | 900 ms |
| `gesture_subtle` | armRaise 0.15 + 0.1·wave | 1100 ms |
| `nod_subtle` | headPitch ±0.02 | 1600 ms |
| `settle_return` | posY −0.02·(1−e), headRoll 0, torsoYaw 0 | ease-out 900 ms |
| `arm_relax` *(declared)* | arms to rest | **unimplemented in placeholder (D-4)** |
| `torso_return` *(declared)* | torsoYaw → 0 | **unimplemented in placeholder (D-4)** |

Arm pose law (the only two joints with rotation math): `armL.rotation.z = 0.45 − 0.5·armRaise − 0.35·armSpread`; `armR` mirrored. Rest is ±0.45 rad inward (arms hugging the plinth taper); `arm_point` brings an arm to 0 (vertical); `arms_raise` at 1.2 reaches −0.15 rad (≈ 9° *outward* past vertical) — **Nex's arms never approach horizontal in V1**, which is exactly why the resting read dominates.

### 6.4 How clips and channels compose

Two levels of composition:

1. **Sequence level (engine).** Clips replace each other in queue order: a dispatched `animations: [notice, turn_toward, head_tilt]` plays `notice` for its (intensity-scaled) duration, then `turn_toward`, then `head_tilt`, then the engine drops to `idle`. Loop clips (`idle, breathe, think, explain, talk_loop, listen_loop`) hold the slot until another clip replaces them — no timer. A loop in mid-sequence holds the rest of the queue until replaced (the director never emits loops mid-sequence; V1 treats this as acceptable).
2. **Channel level (renderer), additive over the idle loop.** Within the active clip, every listed channel contributes a partial pose, blended by channel type:

| Pose property | Blend | Rationale |
|---|---|---|
| posY, posZ, headPitch, headRoll, torsoYaw, eyeX, eyeY | **sum** (additive) | channels stack — a nod over a breathe over a lean is one coherent pose |
| eyeScaleY | **min** | a blink always wins |
| mouth | **max** | the loudest speech moment drives the mouth |
| coreBoost | **max** | a flare is never dimmed by a concurrent think |
| armRaise, armSpread | **max** | one arm intention at a time; never sum two gestures into an overshoot |

**The design intent for the production rig**: the idle loop (breathe + gaze drift) stays *always active*, and one-shot clips layer additively on top of it — a celebrating Nex still breathes; a thinking Nex still drifts. The placeholder evaluates only the active clip's channels, so breathing pauses during one-shots (Appendix B, D-6). The GLB must implement true layering: `idle` permanently blended at 1.0, the sequenced clip blended on top, exactly per the blend table.

### 6.5 Timing laws

- **Intensity scaling**: a one-shot advances after `duration × (2 − intensity)`. Intensity 1 → nominal speed; 0.5 → 1.5× slower; 0.4 (the calmest the director sends, `session_idle`) → 1.6× slower. Calm moments are *slow* moments — the same law that makes supportive_lean gentle.
- **Queue capacity**: max 5 clips per dispatch (4 from a sanitized LLM payload). Longer sequences are truncated, never error.
- **Loop replacement**: a loop holds until another clip is dispatched; there is no loop exit timer.
- **Sequence end** → `idle`, always. Nex never holds a gesture.
- **Amplitude feed**: `setAmplitude(0–1)` from the voice pipeline, deadband 0.02, drives `talk_loop` only.

### 6.6 Failure semantics (the part that makes this production-safe)

| Failure | Behavior |
|---|---|
| Non-object / malformed DirectorAction | `playFallback()` → clear timers, empty queue, `idle`. No throw. |
| Unknown clip name | Filtered out before queueing; if the list empties, current clip continues or falls back. |
| Invalid mode / emotion / gaze / intensity | Whichever fails keeps its previous valid value; others apply. |
| Listener (renderer) throws | Caught per-listener; the engine keeps emitting. |
| Any error in any layer | The avatar shows `idle` — never a freeze, never a T-pose, never a black canvas. |

The one-line acceptance test: **hand the engine garbage JSON and the student sees a calmly breathing Nex.**

---

## 7. Production asset brief (the final GLB)

### 7.1 Budgets (hard limits)

| Budget | Limit | Notes |
|---|---|---|
| Triangles (base mesh, all parts) | **< 15,000** | Placeholder runs ~7–8k at 32-seg primitives. Target 8–12k: the forms are simple; spend the budget on the egg's smoothness and the dome's curvature, not on detail. |
| File size | **< 5 MB** compressed | Draco (`KHR_draco_mesh_compression`) or Meshopt (`EXT_meshopt_compression`). With the no-texture route (§7.6) expect < 1.5 MB. |
| Materials | 4 | shell / graphite / glass / core-emissive (§3.6) |
| Draw calls | ≤ 5 | merge shell parts; merge graphite parts |
| Skinned meshes | 0 preferred | A rigid node hierarchy is sufficient — no mesh deformation exists in the vocabulary (Appendix A node tree). Skin only if the tooling requires it. |
| Texture resolution | **2K max per map** | and see §7.6 — the preferred route uses *no textures* |

### 7.2 Format and runtime compatibility

- **glTF 2.0, binary (`.glb`)**, PBR metal-rough workflow — no specular/gloss workflow, no unlit extensions on the shell.
- Loads via **react-three-fiber + drei** (`useGLTF`, `useAnimations`) in the existing app: the asset must be indexable by animation name (drei keys animations by their glTF name — hence §7.4's exact naming).
- **Units and axes**: author at the spec's unit scale (total height 1.46), origin at the plinth-base center (**y = 0**), **forward = +Z** (R3F's default camera looks down −Z at a +Z-facing model — the face must meet the camera with no rotation), up = +Y. Include a single root node named `NexRoot` at the origin.
- **Topology**: clean quads where retopology allows (glTF triangulates anyway); the egg must be a smooth revolutions/loft with no visible pole artifacts on the front dome; the plinth's top and bottom edges get a 0.02–0.03 fillet — *no hard chamfers anywhere* (chamfer language is the military read, §8).

### 7.3 Node tree

```
NexRoot                      (origin y=0, +Z forward; receives posY/posZ/hop/lean, torsoYaw)
├─ Plinth                    (frustum r0.44→r0.34, y 0–0.56; bone shell)
│  ├─ BeltInset              (recessed graphite band, y 0.155–0.205 — must be VISIBLE; see D-2)
│  ├─ CoreDome               (r0.13 sphere at (0, 0.36, 0.33), 2/3 exposed; dark base material)
│  │  └─ CoreBezel           (graphite ring r 0.50–0.62 of core face)
│  ├─ ArmL                   (pivot (−0.36, 0.34, 0); rest rot z +0.45; capsule r0.045 len 0.35)
│  └─ ArmR                   (pivot (+0.36, 0.34, 0); rest rot z −0.45; mirrored)
├─ Collar                    (frustum r0.24→r0.20, y 0.585–0.655; floats — gap A below, gap B above; graphite)
└─ Head                      (pivot at egg center (0, 1.09, 0); receives headPitch/headRoll)
   ├─ FaceGlass              (dome base r≈0.21, protrudes 0.15; BLANK dark glass, clean front-cap UVs — display drawn by the app, §4.8)
   ├─ EarDiskL               (r0.07 × 0.04 cylinder at (−0.30, 1.09, 0), axis X; graphite)
   └─ EarDiskR               (mirrored)
```

Pivot placement matters: the head pitches and rolls **about the egg's center** (not its base) — that is how the placeholder behaves and it is the correct feel for a floating head (a base pivot would swing the face like a pendulum).

### 7.4 Animation requirements and exact clip naming

The GLB must contain **all 23 clips as named animations**, named *exactly* (ASCII, snake_case, no spaces, no prefixes, no case variants — the engine whitelists against this literal list, and a mismatched name is a silently dropped clip):

```
idle  breathe  blink  look_around  notice  look_at_target  turn_toward  point
think  head_tilt  curious  explain  gesture  nod  emphasize  celebrate
encourage  supportive_lean  enter_teaching_mode  exit_teaching_mode
talk_loop  listen_loop  return_to_idle
```

Required rig supports behind those names:

| Support | Requirement |
|---|---|
| **Idle / breathing loop** | `idle` = 4 s loop: body posY ±0.035, head pitch ±0.02, ambient eye drift. Never stops (§6.4 layering). |
| **Blink cycle** | 180 ms scaleY dip to 0.1, auto-triggered every 3–7 s randomized, suppressed during `think`. Exposed as either the `blink` clip or a `blink` morph the app can trigger. |
| **Head / eye tracking** | Head pitch ±0.22 rad, roll ±0.22 rad, (production: add yaw ±0.18 for gaze targets); eye translation per §4.7 (±0.048 UV horizontal). Driven by gaze state, composed with any clip. |
| **Gesture library** | The 23 clips, respecting every ceiling in §6.3. `point` must read as a real deictic gesture — arm to ≥ 75° elevation toward +Z (the placeholder's arm only relaxes to vertical; D-7). Arms never exceed 90° elevation in any clip. |
| **Amplitude talk cycle** | A single `mouth_open` morph target, 0–1, driven by the live audio amplitude scalar; mouth geometry per §4.6 (25% face width, 6–17% face height). No visemes, no jaw bone required. |
| **Face display** | Not animated in the GLB (§4.8). Optionally ship 5 eye-shape morphs (`eye_round, eye_narrow, eye_happy, eye_soft, eye_wide` as emissive-mask morphs) — optional; the app shader is the primary route. |

Export as individually named animations (not one timeline with frame ranges) — drei's `useAnimations` indexes by name.

### 7.5 Face and core: who owns what

**Recommended (Option A — matches the current architecture):** the GLB ships blank glass for `FaceGlass` and a plain dark dome for `CoreDome`; the app assigns its existing `FaceCoreMaterial` shader to those nodes. Zero extra payload, one source of truth, guaranteed glyph correctness. **Option B (fallback):** bake the display as emissive: a small atlas texture (five eye glyphs + mouth) with morph or uniform switching — only if a future surface needs the face outside R3F. Do not attempt Option B with an AI generation tool; the glyphs will be wrong.

### 7.6 Texture policy

**Preferred: no textures at all.** Bake **vertex colors** (bone `#e8e2d6` shell, `#c9c2b2` crevice tint, `#33373d` graphite, `#14161a` glass) and drive roughness/metalness from the 4 materials (§3.2). Rationale: the design has no painted detail — no panel lines, no decals, no labels — so textures buy nothing; vertex colors hold the silhouette at any LOD, survive aggressive compression, and match the brand's "hairlines not gradients" discipline. If micro-roughness variation is wanted (§3.2), a single 1K roughness map is the only texture worth its bytes. Absolute ceiling if textures are used: **2K per map**, KTX2/BasisU compressed, single material set, no normal maps beyond an optional 1K ceramic micro-noise.

### 7.7 For AI 3D generation tools (Meshy / Rodin / similar)

**Geometry pass only — the face display is built by the app, never generated** (§4.8). Use the positive prompt verbatim, at the highest available tier, then retopologize and verify against Appendix A:

> **Positive:** "A small original desktop companion character, stationery product-design object, not a toy: matte bone-cream ceramic egg-shaped head (slightly taller than wide) floating with a clear visible air gap above a dark graphite ring collar, which floats with a smaller air gap above a bone-cream rounded trapezoid plinth body that is wider at its base. No neck. No legs. Two short rounded capsule arms rest downward against the sides of the body, hugging its taper. Two flat dark graphite disk details on the left and right sides of the head. One smooth dark glass dome panel bulging from the front of the head, completely blank. Warm off-white #e8e2d6 satin matte ceramic, dark graphite #33373d ring and disks, satin finish. Studio product lighting, warm key light with a soft amber rim light, very dark background, centered front three-quarter view, full figure visible, clean simple topology, minimal surface detail, no panel lines."

> **Negative:** "human face, eyes, eyebrows, nose, mouth, lips, teeth, human proportions, skin, hair, legs, feet, wheels, hands, fingers, antenna, weapons, gun, armor, military, tactical, cyberpunk, neon, cyan, blue, purple, violet, RGB, glowing seams, LED strips, glossy white plastic, apple-style white, toy, chibi, cute mascot, baby robot, big eyes, stock robot, famous robot, movie robot, text, logo, numbers, panel lines, screws, bolts, vents, grill, gradient, bloom"

**Known AI-tool failure modes to check before accepting output** (in order of frequency): (1) it will draw literal eyes/lips on the glass — reject; (2) it will connect head to body with a neck or merge the volumes — reject (the air gaps are the signature, §2.1); (3) it will add legs or a base skirt — reject; (4) it will gloss the shell white — reject (satin bone-warm only); (5) it will add panel seams/vents — reject. Accept no output that fails the 32 px silhouette test (§2.1).

### 7.8 The swap-in plan

The procedural rig is a **functional placeholder** — it ships in the JS bundle (zero asset downloads), implements the full engine contract, and is the character you see in the product today. The production GLB is a **drop-in for `NexRig` internals only**:

```
        unchanged                                    replaced
┌───────────────────────┐   engine snapshot   ┌──────────────────────┐
│ director.js           │ ──────────────────▶ │ NexRig internals:     │
│ behaviorEngine.js     │  { clip, clipDef,    │  primitives+channels  │
│ clips.js (CLIPS,      │    clipElapsed,      │      ↓ becomes ↓      │
│  EMOTION_FACES,       │    emotion, mode,    │ GLB + useAnimations   │
│  MODE_CORES)          │    amplitude,        │ + the same blend      │
│ Nex.jsx public props  │    intensity, gaze } │   rules (§6.4)        │
│ (dock, scale, class,  │                      │ + FaceCoreMaterial    │
│  speechBubble, aria)  │                      │   on FaceGlass node   │
└───────────────────────┘                      └──────────────────────┘
```

- The DirectorAction contract (§3.3), the engine's dispatch/queue/fallback semantics (§6.6), the emotion and mode tables, and the public `<Nex>` component surface do not change.
- The GLB rig must consume the identical engine snapshot and honor the identical timing law (`duration × (2 − intensity)`), blend table (§6.4), channel ceilings (§6.3), and face/core parameter maps (§4.4, §5.3–5.4).
- The reduced-motion/low-tier path (NexFlat SVG) is unchanged — no GLB is loaded there at all.
- The 2D fallback remains the floor: if a surface can't afford WebGL, the character is still present.

### 7.9 Acceptance tests (definition of done for the GLB)

1. **Silhouette test**: 32 px render passes all three checks of §2.1; both air gaps visible at 64 px.
2. **Proportion audit**: every measurement in Appendix A within ±5%.
3. **Material audit**: 4 materials, values per §3.2 under the §2.6 lighting rig; the only specular is the face dome; no green anywhere.
4. **Clip audit**: all 23 animation names present and distinct — `celebrate` vs `nod` vs `encourage` must be distinguishable at 50% speed in a dock-sized viewport.
5. **Emotion audit**: all 7 emotions distinguishable at 64 px face size (§4.4).
6. **Fallback audit**: dispatching garbage JSON yields a breathing idle; `prefers-reduced-motion` yields the SVG.
7. **Budget audit**: < 15k tris, < 5 MB, ≤ 5 draw calls, 60 fps on a mid-tier laptop with dpr [1, 1.5].
8. **Anti-generic audit**: passes every row of §8.

---

## 8. Anti-generic checklist

Any single item below **disqualifies** a design, a render, or a submitted asset. These are the review gates; check every row against every iteration.

| # | Disqualifier | Why it fails | The correction |
|---|---|---|---|
| 1 | **Stock `RobotExpressive` reskin** (or any marketplace/example-library robot, renamed) | The silhouette, proportions, and joint language are recognizable on sight; it reads as a demo, not a character — and it drags every prior use of that asset into the brand. | Original three-mass stack per §2.2; no borrowed topology, period. |
| 2 | **Toy proportions** — head > 55–60% of total height, stubby nub limbs, spherical mitten hands | Collapses the register from "senior peer" to "plush" (§1.3); a 15–17-year-old disengages immediately. | Head 44–52%; arms as full capsules that reach the plinth mid-body (§2.2). |
| 3 | **Cyan / violet / blue-violet palette on navy** | The default sci-fi shorthand: cold, machine-time, surveillance (§3.4). It also breaks the brand — Nex's light must be the product's amber. | Bone `#e8e2d6` + graphite `#33373d` + amber `#f5be5a` only. |
| 4 | **Human face** — nose, lips, brows, jawline, cheekbones; or a photographic/humanoid skin face texture | Instant uncanny valley on an abstract body; and it pre-bakes an emotion the state system needs to control (§4.1). | Two amber eye glyphs + amplitude mouth on dark glass; nothing else. |
| 5 | **Weapons / military paneling** — armor plates, hard chamfers, tactical rails, camo, HUD glyphs, vents, greebles, screws | Reads combat/surveillance — the exact opposite of a tutor's register; hard-edge language also fights the ceramic form. | Soft fillets, matte ceramic, no hardware detail at all. |
| 6 | **Cute-mascot exaggeration** — oversized eyes (> 35% of face width each), sparkle/glint pupils, bounce-idle, blush marks, antenna wobble | Toy register again, plus it drowns the two real peaks (`celebrate`, `notice`) in constant noise (§1.5). | Eyes 25–35% of face width (`wide` is the ceiling glyph); idle is breathing; amplitude ceilings per §6.3. |
| 7 | **Gloss-white "Apple-bot"** | White gloss reads consumer-product-toy, kills the warm-instrument story, and drifts toward EVE (§2.7). | Warm satin bone ceramic, roughness 0.50–0.55, never pure white, never gloss. |
| 8 | **Locomotion implications** — legs, feet, wheels, treads, hover thrusters, a *hint* of a walk cycle | Movement implies the companion might leave; Nex is stationed (§2.3). | Plinth base 0.44 wide, on the ground, forever. |
| 9 | **Second/third emissive colors** — RGB accents, status-LED strips, colored rim lights, bi-color eyes | Breaks "one emissive channel" (§3.4); reads gamer-hardware. | Amber only; green is reserved and not shipped (§3.5). |
| 10 | **Robot hands with fingers** | Fingers are the uncanny super-feature and invite micro-gestures the vocabulary doesn't have. | Capsule forearms; pointing with the whole arm. |
| 11 | **Neck, or merged head-body volume** | Destroys the signature (the two air gaps) and the free-head motion range (§2.1). | Two visible gaps: 0.025 and 0.065 units. |
| 12 | **IP adjacency** — anything reading as EVE, BB-8, Baymax, or a named film/game robot | Legal exposure plus borrowed character; the design stops being Nex. | Run the §2.7 adjacency diff on every review. |
| 13 | **Text, logos, numbers, icons on the shell or core** | The character is not a UI surface; glyphs on the body date instantly and violate brand restraint. | Blank ceramic; state lives in the core's *pattern*, not its labeling (§5.5). |
| 14 | **Whip antenna / microphone boom / camera eye** | Reads radio/military/surveillance device (§2.3). | Flat ear disks, protruding 0.02, nothing else. |
| 15 | **Bloom/glow post on the avatar, gradient materials** | The brand rule is hairlines and light, not glow and gradient (§3.4); haloing also fakes legibility the geometry must own. | Bright amber values, no post. |

A submitted asset that passes §7.9 but fails any row above is rejected at review, regardless of render quality.

---

## Appendix A — Master measurement table (rig space, y from ground)

Every value below is either the as-built placeholder value from `src/components/nex/Nex.jsx` or the production target where they differ (marked **P**). Placeholder total height is 1.18 (head nests into the collar); production total is 1.46 (head floats).

| Part | Geometry | Size | Center / position | Span / placement |
|---|---|---|---|---|
| **Plinth body** | Cylinder frustum, 32 seg | top r 0.34, bottom r 0.44, h 0.56 | (0, 0.28, 0) | y 0.00 → 0.56 |
| **Belt line** | Cylinder band | r 0.365, h 0.05 (placeholder — buried; see D-2) | (0, 0.18, 0) | y 0.155 → 0.205 |
| **Belt — P** | Inset band, following wall radius ≈ 0.40–0.41 | h 0.05, inset 0.01–0.015 | wall-following | y 0.155 → 0.205, **visible** |
| **Air gap A — P** | — | 0.025 | — | y 0.56 → 0.585 |
| **Collar ring** | Cylinder frustum, 32 seg | bottom r 0.24, top r 0.20, h 0.07 | (0, 0.62, 0) | y 0.585 → 0.655 |
| **Air gap B — P** | — | 0.065 | — | y 0.655 → 0.72 |
| **Head** | Sphere r 0.30, 32 seg (placeholder) | 0.60 × 0.60 × 0.60 | (0, 0.88, 0) | y 0.58 → 1.18 |
| **Head — P** | Egg (sphere stretched 1.23× vertical) | W 0.60 × H 0.74 × D 0.58 | (0, 1.09, 0) | y 0.72 → 1.46 |
| **Face display glass** | Sphere lens r 0.215, 32 seg | dome base r ≈ 0.21, protrusion 0.15, apex z 0.45 | head-local (0, 0, 0.235) | covers ~71% of head width, front |
| **Ear disks** | Cylinders r 0.07, h 0.04, axis X, 24 seg | protrusion 0.02 | head-local (±0.30, 0, 0) | x → ±0.32 at head equator |
| **Arm L / R** | Capsules r 0.045, cylinder length 0.26, 6×12 seg | total length 0.35 | pivots (±0.36, 0.34, 0), mesh local (0, −0.14, 0) | y 0.025 → 0.375, tangent to plinth wall |
| **Arm rest pose** | — | rotation.z ±0.45 (≈ 26° inward) | — | arms hug the plinth taper |
| **Arm pose law** | — | z = ±(0.45 − 0.5·armRaise − 0.35·armSpread) | — | max outward −0.15 rad in V1 |
| **Chest core** | Sphere r 0.13, 24 seg | protrudes 0.084 beyond wall | (0, 0.36, 0.33) | 2/3 exposed on plinth front |
| **Core bezel — P** | Annulus | normalized r 0.50–0.62 of core face | on core face | graphite ring around emissive |
| **Total height** | — | placeholder 1.18 / **P** 1.46 | — | ground → crown |
| **Max width** | — | 0.88 (plinth base) | — | overall W:H ≈ 0.60 |
| **Camera** | fov 38° | position (0, 0.2, 2.7) | — | figure centered via root offset (0, −0.5, 0) |
| **Lights** | ambient 0.55; key 1.1 @(2,3,2); amber rim 0.25 @(−2,1,−1) `#f5be5a` | — | — | §2.6 / §3.3 |
| **Shell material** | `meshStandardMaterial` | color `#e8e2d6`, roughness 0.50–0.55, metalness 0.06–0.08 | — | head / plinth+arms split |
| **Graphite material** | `meshStandardMaterial` | color `#33373d`, roughness 0.40–0.60, metalness 0.20–0.50 | — | belt / collar / ears split |
| **Display shader** | custom `FaceCoreMaterial` | amber `vec3(0.96, 0.75, 0.35)` ×1.2 on face; dark `vec3(0.05, 0.055, 0.065)` | — | §4, §5 |

## Appendix B — Placeholder deviation register (as-built vs. this spec)

What the production asset must fix, in priority order:

| # | Deviation in `Nex.jsx` as built | Production requirement |
|---|---|---|
| **D-0** | **Both displays paint off-center.** `SphereGeometry` maps the +Z forward apex to **u = 0.25**, but `FaceCoreMaterial`'s glyph math treats u = 0.50 as the face center. Face: the left eye (u 0.40) lands 54° off the forward meridian — skewed to one side; the right eye (u 0.60, 126° off) paints on the dome's flank *inside* the head shell (the lens cap ends at u ≈ 0.52; 0.60 is past it) and is invisible; the mouth (u 0.50, 90° off) lands on the lateral equator where the view gate suppresses it — the 3D face renders one off-center eye and no mouth. Core: the patterns center on UV (0.5, 0.5), the core sphere's +X point, which is buried inside the plinth — so pulse/ripple center off-dome and the sweep bands run along the plinth's side. The 2D SVG fallback is correct, so reduced-motion users see the right face and WebGL users do not. | Re-map u in the shader (`fract(u + 0.25)`) on both display meshes, or build both display spheres with `phiStart = 3π/2`; then the UV tables in §4.2–4.3 and §5.3 are literal. No geometry change needed. |
| **D-1** | Head is a sphere (0.60³), not an egg. | Egg: 0.60 W × 0.74 H × 0.58 D (1.23× vertical stretch). |
| **D-2** | **Belt line is invisible**: r 0.365 sits fully inside the plinth wall (≈ 0.408 radius at y 0.18) — the graphite band is swallowed by the body. (It reads correctly only in the 2D SVG fallback.) | Recess the belt into the wall as a visible inset band at y 0.155–0.205 (Appendix A). |
| **D-3** | Head nests into the collar socket (sphere bottom y 0.58 dips below collar top 0.655) — gap B reads as a crease, not daylight; total height 1.18 not 1.46. | Float the head: clear 0.065-unit daylight gap between collar top and egg bottom (§2.2). |
| **D-4** | `exit_teaching_mode` declares channels `arm_relax` and `torso_return`, which are **not implemented** in the rig's channel map — the clip consumes its duration but animates nothing. | Implement both channels (arms to rest, yaw → 0) — or drop them from `clips.js` (a CONTRACTS §6 change). |
| **D-5** | `gazeTarget` state (`screen/student/board/camera/off`) is validated and stored by the engine but the procedural rig does not drive head/eye aim from it — gaze reads only via clip channels (`gaze_lock`, `gaze_up`, `gaze_sweep`). | Map named gaze targets to head yaw/pitch + eye offset compositions (§4.7). |
| **D-6** | Clips replace rather than layer: only the active clip's channels are evaluated, so breathing pauses during one-shots. | True additive layering — idle loop always on, sequenced clip blended per §6.4. |
| **D-7** | `point` only relaxes the arm to vertical (armRaise 0.9 → rotation 0) — too weak to read as deixis. | `point` raises the arm to ≥ 75° elevation toward the board (§7.4). |
| **D-8** | `scale` prop from CONTRACTS §6 not yet implemented (only `dock`); default canvas fixed at 160×192. | Implement scale prop; keep the 5:6 aspect lock. |
| **D-9** | Face `happy` eyes are a flattened ellipse (0.06 × 0.045 UV), which reads squinty rather than smiling. | Upward-curving crescent for `happy` (§4.3). |
| **D-10** | Reserved `--nex-core-resolve` green unused (correct for V1). | Keep unused until CONTRACTS changes (§3.5). |

*End of NEX_SPEC.md v1.0.*
