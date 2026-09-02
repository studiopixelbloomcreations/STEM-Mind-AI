/**
 * NexLearn curriculum bank — Grades 9–11 STEM, aligned to the Sri Lankan
 * national syllabus strands and the G.C.E. O/L examination structure.
 *
 * Every item carries: difficulty (1–10), misconception-tagged distractors,
 * a worked whiteboard plan (consumed by Teaching Mode), a hint ladder entry,
 * an exam-coach note and a marking rubric for constructed-response kinds.
 */

export type QuestionKind = "mcq" | "numeric" | "short" | "conceptual";

export type Visual =
  | { kind: "equation"; lines: string[]; note?: string }
  | { kind: "bars"; bars: { label: string; value: number; unit?: string }[] }
  | { kind: "flow"; nodes: string[] }
  | { kind: "graph"; slope: number; intercept: number; points?: [number, number][]; xLabel?: string; yLabel?: string };

export interface WhiteboardStep {
  id: string;
  title: string;
  say: string;
  visual?: Visual;
  highlight?: "left" | "right" | "board";
}

export interface BankItem {
  id: string;
  subject: string;
  topic: string;
  grade: number;
  difficulty: number;
  kind: QuestionKind;
  stem: string;
  unit?: string;
  choices?: { text: string; correct?: boolean; tag?: string }[];
  numeric?: { answer: number; tolerance: number; unit?: string };
  rubric?: {
    keywords: string[];
    minHits: number;
    misconception?: { if: string[]; note: string };
  };
  modelAnswer?: string;
  hint: string;
  examTip: string;
  steps: WhiteboardStep[];
}

export interface TopicMeta {
  id: string;
  subject: string;
  title: string;
  gradeBand: string;
  strand: string;
  paperWeight: string;
  prerequisites: string[];
  traps: string[];
}

export interface SubjectMeta {
  id: string;
  title: string;
  blurb: string;
  topics: string[];
}

export const SUBJECTS: SubjectMeta[] = [
  {
    id: "physics",
    title: "Physics",
    blurb: "Motion, forces and energy — the mathematics of how the world moves.",
    topics: ["motion", "forces", "energy"],
  },
  {
    id: "chemistry",
    title: "Chemistry",
    blurb: "Atoms, moles and reactions — counting the uncountable.",
    topics: ["atomic-structure", "mole-concept", "acids-salts"],
  },
  {
    id: "maths",
    title: "Mathematics",
    blurb: "Functions, triangles and lines — precision as a habit.",
    topics: ["quadratics", "trigonometry", "straight-lines"],
  },
];

export const TOPICS: Record<string, TopicMeta> = {
  motion: {
    id: "motion", subject: "physics", title: "Speed, Velocity & Acceleration",
    gradeBand: "Grades 9–10", strand: "Mechanics · Unit 1: Motion",
    paperWeight: "~8 marks / O/L Paper I", prerequisites: ["Units & SI prefixes", "Rearranging equations"],
    traps: ["Confusing speed with velocity", "Using speed × time when acceleration ≠ 0"],
  },
  forces: {
    id: "forces", subject: "physics", title: "Forces & Newton's Laws",
    gradeBand: "Grades 10–11", strand: "Mechanics · Unit 3: Forces",
    paperWeight: "~10 marks / O/L Paper I", prerequisites: ["Vector direction", "Mass vs weight"],
    traps: ["Thinking constant motion needs a driving force", "Mixing up mass (kg) and weight (N)"],
  },
  energy: {
    id: "energy", subject: "physics", title: "Work, Energy & Power",
    gradeBand: "Grades 10–11", strand: "Mechanics · Unit 6: Work & Energy",
    paperWeight: "~8 marks / O/L Paper II", prerequisites: ["Squaring numbers", "Units: joule & watt"],
    traps: ["Forgetting to square v in KE = ½mv²", "Power = work/time, not work × time"],
  },
  "atomic-structure": {
    id: "atomic-structure", subject: "chemistry", title: "Atomic Structure",
    gradeBand: "Grades 9–10", strand: "Matter · Unit 2: Atomic Structure",
    paperWeight: "~6 marks / O/L Paper I", prerequisites: ["Elements & symbols", "Number line"],
    traps: ["Thinking electrons add to the mass number", "Equal protons & electrons only when neutral"],
  },
  "mole-concept": {
    id: "mole-concept", subject: "chemistry", title: "The Mole Concept",
    gradeBand: "Grades 10–11", strand: "Quantitative Chemistry · Unit 5",
    paperWeight: "~10 marks / O/L Paper II", prerequisites: ["Relative atomic mass", "Index notation"],
    traps: ["Using atomic mass of O instead of O₂ = 32", "Leaving out the unit (mol or g)"],
  },
  "acids-salts": {
    id: "acids-salts", subject: "chemistry", title: "Acids, Bases & Salts",
    gradeBand: "Grades 10–11", strand: "Reactions · Unit 7",
    paperWeight: "~8 marks / O/L Paper I", prerequisites: ["Chemical formulae", "pH scale"],
    traps: ["Assuming all salts are neutral", "Writing salt formula before balancing charges"],
  },
  quadratics: {
    id: "quadratics", subject: "maths", title: "Quadratic Functions",
    gradeBand: "Grades 10–11", strand: "Algebra · Unit 12",
    paperWeight: "~12 marks / O/L Paper II", prerequisites: ["Expanding brackets", "Factorising"],
    traps: ["Sign errors in the quadratic formula", "Losing the ± on the square root"],
  },
  trigonometry: {
    id: "trigonometry", subject: "maths", title: "Trigonometry",
    gradeBand: "Grades 9–11", strand: "Geometry & Measure · Unit 11",
    paperWeight: "~10 marks / O/L Paper II", prerequisites: ["Right-angled triangles", "Pythagoras"],
    traps: ["SOH-CAH-TOA applied to the wrong angle", "Calculator in radians mode"],
  },
  "straight-lines": {
    id: "straight-lines", subject: "maths", title: "Coordinate Geometry: Straight Lines",
    gradeBand: "Grades 9–10", strand: "Algebra · Unit 9",
    paperWeight: "~8 marks / O/L Paper I", prerequisites: ["Plotting coordinates", "Fractions"],
    traps: ["Gradient as run/rise instead of rise/run", "Reading the intercept off a scaled axis"],
  },
};

/* ── Item bank ─────────────────────────────────────────────────────────────── */

export const BANK: BankItem[] = [
  // ── PHYSICS · MOTION ────────────────────────────────────────────────────
  {
    id: "phy-mot-mcq-1", subject: "physics", topic: "motion", grade: 9, difficulty: 2, kind: "mcq",
    stem: "A car travels 150 m in 10 s at constant speed. What is its speed?",
    choices: [
      { text: "15 m/s", correct: true },
      { text: "1.5 m/s", tag: "inverted-division" },
      { text: "1500 m/s", tag: "multiplied-instead" },
      { text: "140 m/s", tag: "subtracted" },
    ],
    hint: "Speed asks one question only: how much distance, per one unit of time?",
    examTip: "In Paper I, always check the units before the arithmetic — a m/s answer of 1500 for a school-run car should ring alarm bells.",
    steps: [
      { id: "s1", title: "What is speed?", say: "Speed is distance covered per unit time. Nothing more.", visual: { kind: "equation", lines: ["speed = distance ÷ time"], note: "Definition first — always." } },
      { id: "s2", title: "Substitute", say: "Distance 150 m, time 10 s. Put the numbers in.", visual: { kind: "equation", lines: ["speed = 150 ÷ 10", "speed = 15 m/s"] } },
      { id: "s3", title: "Sanity check", say: "15 m/s is a fast car. 1500 m/s is faster than a bullet — that is how you catch inverted answers.", visual: { kind: "bars", bars: [{ label: "Car", value: 15, unit: "m/s" }, { label: "Distractor", value: 1500, unit: "m/s" }] } },
    ],
  },
  {
    id: "phy-mot-num-1", subject: "physics", topic: "motion", grade: 10, difficulty: 5, kind: "numeric",
    stem: "A bicycle accelerates uniformly from 4 m/s to 16 m/s in 6 s. Calculate its acceleration.",
    numeric: { answer: 2, tolerance: 0.05, unit: "m/s²" },
    hint: "Acceleration is the change in velocity — the difference, not just the final value — divided by time.",
    examTip: "Structured papers award the first mark for writing a = (v − u)/t. Always write the relationship before substituting.",
    steps: [
      { id: "s1", title: "Name the variables", say: "u = 4 (initial), v = 16 (final), t = 6. Naming them prevents swapping.", visual: { kind: "flow", nodes: ["u = 4 m/s", "v = 16 m/s", "t = 6 s"] } },
      { id: "s2", title: "Apply the definition", say: "Acceleration is change of velocity over time.", visual: { kind: "equation", lines: ["a = (v − u) ÷ t", "a = (16 − 4) ÷ 6"] } },
      { id: "s3", title: "Evaluate", say: "12 divided by 6.", visual: { kind: "equation", lines: ["a = 12 ÷ 6 = 2 m/s²"], note: "Units: (m/s) ÷ s = m/s²" } },
    ],
  },
  {
    id: "phy-mot-short-1", subject: "physics", topic: "motion", grade: 10, difficulty: 6, kind: "conceptual",
    stem: "A bus and a car cover the same 200 m in the same 20 s, but the bus stopped twice at halts while the car never stopped. Compare their average speeds and their instantaneous speeds while moving. Explain in 2–3 sentences.",
    modelAnswer: "Their average speeds are equal (200 m ÷ 20 s = 10 m/s) because average speed depends only on total distance and total time. While actually moving, the bus must have a higher instantaneous speed to recover the time lost at halts.",
    rubric: { keywords: ["average", "equal", "same", "10", "distance", "time", "instantaneous", "higher", "faster", "stops", "halts"], minHits: 5, misconception: { if: ["bus is slower", "car is faster overall"], note: "Average speed ignores what happens mid-journey — only totals matter." } },
    hint: "Start from the definition: average speed uses totals. Then ask what the bus must do while it is actually moving.",
    examTip: "This is a classic Paper II distinction item: average vs instantaneous. One mark for equal averages, one for the bus moving faster while moving.",
    steps: [
      { id: "s1", title: "Average speed uses totals", say: "Average speed = total distance ÷ total time. Nothing about the middle of the journey counts.", visual: { kind: "equation", lines: ["v̄ = 200 m ÷ 20 s = 10 m/s", "Same for both vehicles."] } },
      { id: "s2", title: "What did the halts do?", say: "The bus stood still for part of its 20 s. Its moving time was shorter — but it still covered 200 m.", visual: { kind: "bars", bars: [{ label: "Car moving time", value: 20, unit: "s" }, { label: "Bus moving time", value: 14, unit: "s" }] } },
      { id: "s3", title: "Conclusion", say: "Same average; while moving, the bus is faster. Both ideas can be true at once.", visual: { kind: "equation", lines: ["average: equal", "instantaneous (moving): bus > car"] } },
    ],
  },

  // ── PHYSICS · FORCES ────────────────────────────────────────────────────
  {
    id: "phy-for-mcq-1", subject: "physics", topic: "forces", grade: 10, difficulty: 3, kind: "mcq",
    stem: "A book rests on a table without moving. Which statement is correct?",
    choices: [
      { text: "Weight and the table's normal reaction are equal and opposite on the book", correct: true },
      { text: "No forces act on the book", tag: "no-forces-when-still" },
      { text: "Weight is greater than the normal force", tag: "unbalanced-would-sink" },
      { text: "The book exerts no force on the table", tag: "newton-third-gap" },
    ],
    hint: "Newton's first law: zero acceleration means balanced forces, not zero forces.",
    examTip: "'At rest' questions are Newton I checkpoints. 'Balanced forces' is the phrase markers look for.",
    steps: [
      { id: "s1", title: "Is it accelerating?", say: "No. The book stays put, so net force must be zero.", visual: { kind: "equation", lines: ["a = 0  ⇒  Fₙₑₜ = 0"], note: "Newton's first law" } },
      { id: "s2", title: "Which forces act?", say: "Weight pulls down; the table pushes up. They act on the same object — the book.", visual: { kind: "flow", nodes: ["↓ weight (on book)", "↑ normal (on book)", "Fₙₑₜ = 0"] } },
      { id: "s3", title: "Reject the traps", say: "'No forces' is wrong — remove the table and the book falls. Forces are present and balanced.", visual: { kind: "equation", lines: ["balanced ≠ absent"] } },
    ],
  },
  {
    id: "phy-for-num-1", subject: "physics", topic: "forces", grade: 11, difficulty: 5, kind: "numeric",
    stem: "A resultant force of 30 N acts on a trolley of mass 6 kg. Find its acceleration.",
    numeric: { answer: 5, tolerance: 0.05, unit: "m/s²" },
    hint: "Newton's second law — but solve for a, not F.",
    examTip: "Rearranging F = ma to a = F/m is a free method mark in structured questions.",
    steps: [
      { id: "s1", title: "Second law", say: "F = ma. We need a, so isolate it.", visual: { kind: "equation", lines: ["F = ma", "a = F ÷ m"] } },
      { id: "s2", title: "Substitute", say: "Force 30 N, mass 6 kg.", visual: { kind: "equation", lines: ["a = 30 ÷ 6 = 5 m/s²"] } },
    ],
  },
  {
    id: "phy-for-short-1", subject: "physics", topic: "forces", grade: 11, difficulty: 7, kind: "short",
    stem: "Explain why a spacecraft drifting in deep space, engines off, keeps moving at constant velocity even though nothing is pushing it.",
    modelAnswer: "Newton's first law: a net force is needed to change velocity, not to maintain it. With no friction or thrust acting, the net force is zero, so the spacecraft continues at constant speed in a straight line.",
    rubric: { keywords: ["newton", "first", "no net force", "balanced", "constant", "velocity", "friction", "change", "inertia", "straight line"], minHits: 4, misconception: { if: ["force needed to keep moving", "runs out of force"], note: "Force changes motion — it does not sustain it. That's Aristotle, and Newton corrected him." } },
    hint: "Ask: what would a force be needed FOR here — to keep going, or to stop?",
    examTip: "The marker's key phrase is 'no net force'. State the law, then apply it to the spacecraft.",
    steps: [
      { id: "s1", title: "Unlearn the everyday intuition", say: "On Earth things stop because friction and drag act. Deep space removes them — that is the only special thing here.", visual: { kind: "flow", nodes: ["engines off", "no friction, no drag", "Fₙₑₜ = 0"] } },
      { id: "s2", title: "Apply Newton I", say: "Zero net force means zero change in velocity — the velocity stays whatever it already was.", visual: { kind: "equation", lines: ["Fₙₑₜ = 0  ⇒  Δv = 0", "v = constant (speed and direction)"] } },
    ],
  },

  // ── PHYSICS · ENERGY ────────────────────────────────────────────────────
  {
    id: "phy-ene-mcq-1", subject: "physics", topic: "energy", grade: 10, difficulty: 4, kind: "mcq",
    stem: "Which change doubles the kinetic energy of a moving object?",
    choices: [
      { text: "Doubling its mass, speed unchanged", correct: true },
      { text: "Doubling its speed, mass unchanged", tag: "forgot-square" },
      { text: "Halving its speed, mass unchanged", tag: "inverse-error" },
      { text: "Doubling both mass and speed", tag: "×4-not-×2" },
    ],
    hint: "KE depends linearly on m — but on v squared.",
    examTip: "Doubling v quadruples KE — the most reused trap in O/L mechanics. Tattoo ½mv² on your memory.",
    steps: [
      { id: "s1", title: "The formula", say: "Kinetic energy is half mass times velocity squared.", visual: { kind: "equation", lines: ["KE = ½ m v²"], note: "v is squared; m is not." } },
      { id: "s2", title: "Test each change", say: "Double m → KE doubles. Double v → KE quadruples.", visual: { kind: "bars", bars: [{ label: "m ×2", value: 2, unit: "×KE" }, { label: "v ×2", value: 4, unit: "×KE" }] } },
    ],
  },
  {
    id: "phy-ene-num-1", subject: "physics", topic: "energy", grade: 11, difficulty: 6, kind: "numeric",
    stem: "A machine does 2400 J of work in 30 s. Calculate its power output.",
    numeric: { answer: 80, tolerance: 0.5, unit: "W" },
    hint: "Power is a rate — work done per unit time.",
    examTip: "Watt = joule per second. Writing P = W/t with units substituted often earns 2 of 3 marks by itself.",
    steps: [
      { id: "s1", title: "Definition", say: "Power = work ÷ time.", visual: { kind: "equation", lines: ["P = W ÷ t"] } },
      { id: "s2", title: "Evaluate", say: "2400 joules over 30 seconds.", visual: { kind: "equation", lines: ["P = 2400 ÷ 30 = 80 W"], note: "1 W = 1 J/s" } },
    ],
  },
  {
    id: "phy-ene-short-1", subject: "physics", topic: "energy", grade: 11, difficulty: 7, kind: "conceptual",
    stem: "A ball is thrown straight up. At its highest point it is momentarily stationary. Describe the energy conversions on the way up, and explain where the kinetic energy has 'gone' at the top.",
    modelAnswer: "On the way up, kinetic energy converts into gravitational potential energy. At the top the KE is zero (momentarily) and the lost KE is stored as PE, mgh — it is not destroyed, and returns as KE on the way down (ignoring small losses to air resistance as heat).",
    rubric: { keywords: ["kinetic", "potential", "convert", "stored", "mgh", "height", "not destroyed", "conserved", "returns", "air resistance", "heat"], minHits: 5, misconception: { if: ["energy is used up", "disappears", "destroyed"], note: "Energy converts — it is never 'used up'. Conservation is the whole point." } },
    hint: "Energy never disappears. If KE shrinks, ask what is growing.",
    examTip: "Name both energies and the word 'converts'. Markers award the conservation statement.",
    steps: [
      { id: "s1", title: "Track the two energies", say: "As height rises, PE grows; as speed falls, KE shrinks. The sum stays (nearly) constant.", visual: { kind: "bars", bars: [{ label: "KE at throw", value: 100, unit: "%" }, { label: "PE at top", value: 100, unit: "%" }] } },
      { id: "s2", title: "At the top", say: "v = 0 for an instant, so KE = 0. All that energy sits in PE = mgh.", visual: { kind: "equation", lines: ["top: v = 0 → KE = 0", "PE = mgh (maximum)"] } },
      { id: "s3", title: "The way down", say: "PE converts back to KE — proof the energy was stored, not destroyed.", visual: { kind: "flow", nodes: ["throw: KE max", "top: PE max", "landing: KE max again"] } },
    ],
  },

  // ── CHEMISTRY · ATOMIC STRUCTURE ────────────────────────────────────────
  {
    id: "che-ato-mcq-1", subject: "chemistry", topic: "atomic-structure", grade: 9, difficulty: 2, kind: "mcq",
    stem: "An atom has atomic number 11 and mass number 23. How many neutrons does it contain?",
    choices: [
      { text: "12", correct: true },
      { text: "11", tag: "used-atomic-number" },
      { text: "23", tag: "used-mass-number" },
      { text: "34", tag: "added-instead" },
    ],
    hint: "Neutrons make up the difference between mass number and atomic number.",
    examTip: "Write n = A − Z before substituting. Paper I rewards the relationship as much as the number.",
    steps: [
      { id: "s1", title: "Decode the numbers", say: "Atomic number Z = protons = 11. Mass number A = protons + neutrons = 23.", visual: { kind: "equation", lines: ["Z = p = 11", "A = p + n = 23"] } },
      { id: "s2", title: "Subtract", say: "Neutrons = A − Z.", visual: { kind: "equation", lines: ["n = 23 − 11 = 12"] } },
    ],
  },
  {
    id: "che-ato-num-1", subject: "chemistry", topic: "atomic-structure", grade: 10, difficulty: 5, kind: "numeric",
    stem: "A neutral magnesium atom (atomic number 12) and a Mg²⁺ ion differ in electron count. How many electrons does the Mg²⁺ ion have?",
    numeric: { answer: 10, tolerance: 0, unit: "electrons" },
    hint: "A 2+ charge means the atom lost two electrons — protons never leave in chemistry.",
    examTip: "Positive ion = fewer electrons than protons. The charge number IS the electron deficit.",
    steps: [
      { id: "s1", title: "Start neutral", say: "Neutral Mg: 12 protons and 12 electrons.", visual: { kind: "equation", lines: ["Mg: 12 p⁺, 12 e⁻"] } },
      { id: "s2", title: "Ionise", say: "Mg²⁺ has lost 2 electrons; protons unchanged.", visual: { kind: "equation", lines: ["Mg²⁺: 12 p⁺, 10 e⁻"], note: "12 − 2 = 10" } },
    ],
  },
  {
    id: "che-ato-short-1", subject: "chemistry", topic: "atomic-structure", grade: 10, difficulty: 6, kind: "conceptual",
    stem: "Carbon-12 and carbon-14 are isotopes. Explain what they have in common, how they differ, and why their chemistry is nearly identical.",
    modelAnswer: "Both have 6 protons (same element) but different neutron numbers (6 vs 8), so different mass numbers. Chemistry is governed by electrons, and both atoms have the same electron arrangement because they have the same proton number, so their chemical behaviour is nearly identical.",
    rubric: { keywords: ["proton", "same", "6", "neutron", "different", "mass", "electron", "arrangement", "chemical", "element"], minHits: 5, misconception: { if: ["different element", "different proton"], note: "The proton number defines the element — isotopes never change it." } },
    hint: "Which subatomic particle decides the element? Which decides the chemistry?",
    examTip: "Three marking points: same protons, different neutrons/mass, same electron arrangement → same chemistry.",
    steps: [
      { id: "s1", title: "Same element?", say: "Same proton number, 6 — both are carbon, by definition.", visual: { kind: "equation", lines: ["¹²C: 6 p, 6 n", "¹⁴C: 6 p, 8 n"] } },
      { id: "s2", title: "Why same chemistry?", say: "Reactions involve electrons only, and electron arrangement depends on proton count.", visual: { kind: "flow", nodes: ["6 protons", "6 electrons (neutral)", "2,4 arrangement", "identical chemistry"] } },
    ],
  },

  // ── CHEMISTRY · MOLE CONCEPT ────────────────────────────────────────────
  {
    id: "che-mol-mcq-1", subject: "chemistry", topic: "mole-concept", grade: 10, difficulty: 4, kind: "mcq",
    stem: "What is the molar mass of carbon dioxide, CO₂? (C = 12, O = 16)",
    choices: [
      { text: "44 g/mol", correct: true },
      { text: "28 g/mol", tag: "used-O-not-O2" },
      { text: "32 g/mol", tag: "added-16+16-only" },
      { text: "22 g/mol", tag: "averaged" },
    ],
    hint: "Count the atoms: one carbon, two oxygens.",
    examTip: "The 'O instead of O₂' slip is the single most common mole error at O/L. Circle subscripts before adding.",
    steps: [
      { id: "s1", title: "Count atoms", say: "CO₂ has 1 C and 2 O.", visual: { kind: "flow", nodes: ["1 × C", "2 × O"] } },
      { id: "s2", title: "Add the masses", say: "12 + 2 × 16.", visual: { kind: "equation", lines: ["M = 12 + (2 × 16)", "M = 44 g/mol"] } },
    ],
  },
  {
    id: "che-mol-num-1", subject: "chemistry", topic: "mole-concept", grade: 11, difficulty: 6, kind: "numeric",
    stem: "How many moles are there in 8 g of methane, CH₄? (C = 12, H = 1)",
    numeric: { answer: 0.5, tolerance: 0.01, unit: "mol" },
    hint: "First the molar mass, then n = m ÷ M.",
    examTip: "Two-step mole questions give one mark for M and one for n — write both separately.",
    steps: [
      { id: "s1", title: "Molar mass of CH₄", say: "12 + 4 × 1 = 16 g/mol.", visual: { kind: "equation", lines: ["M(CH₄) = 12 + 4(1) = 16 g/mol"] } },
      { id: "s2", title: "n = m ÷ M", say: "8 grams against 16 grams per mole.", visual: { kind: "equation", lines: ["n = 8 ÷ 16 = 0.5 mol"] } },
    ],
  },
  {
    id: "che-mol-short-1", subject: "chemistry", topic: "mole-concept", grade: 11, difficulty: 8, kind: "short",
    stem: "A student says '1 mole of H₂ and 1 mole of O₂ have the same mass because they are both one mole.' Correct the statement, explaining what 'one mole' actually fixes and what it does not.",
    modelAnswer: "One mole fixes the number of particles (6.02 × 10²³), not the mass. Since O₂ molecules are heavier (molar mass 32 g/mol vs 2 g/mol for H₂), one mole of O₂ has 16 times the mass of one mole of H₂.",
    rubric: { keywords: ["number", "particles", "6.02", "avogadro", "mass", "different", "molar mass", "32", "2", "molecule"], minHits: 5, misconception: { if: ["same mass is true", "agree"], note: "A mole is a counting unit — like a dozen. A dozen elephants and a dozen eggs are equal in count, not in mass." } },
    hint: "Think of 'a dozen' — what does it fix, and what does it leave free?",
    examTip: "Precise language wins marks: 'equal number of molecules, different masses' is the model phrase.",
    steps: [
      { id: "s1", title: "What the mole fixes", say: "1 mol = 6.02 × 10²³ particles. It is a counting unit.", visual: { kind: "equation", lines: ["1 mol H₂ = 6.02 × 10²³ molecules", "1 mol O₂ = 6.02 × 10²³ molecules"] } },
      { id: "s2", title: "What it does not fix", say: "Mass per mole = molar mass, and those differ.", visual: { kind: "bars", bars: [{ label: "1 mol H₂", value: 2, unit: "g" }, { label: "1 mol O₂", value: 32, unit: "g" }] } },
    ],
  },

  // ── CHEMISTRY · ACIDS & SALTS ───────────────────────────────────────────
  {
    id: "che-aci-mcq-1", subject: "chemistry", topic: "acids-salts", grade: 10, difficulty: 3, kind: "mcq",
    stem: "Which pair of solutions, when mixed, gives a solution closest to pH 7?",
    choices: [
      { text: "Equal moles of a strong acid and a strong base", correct: true },
      { text: "Equal moles of two strong acids", tag: "acid-acid" },
      { text: "A strong acid diluted with distilled water", tag: "dilution-not-neutral" },
      { text: "Equal volumes of strong acid and weak acid", tag: "volume-vs-moles" },
    ],
    hint: "Neutralisation needs H⁺ and OH⁻ in equal amounts.",
    examTip: "Diluting an acid never reaches pH 7 — it only approaches it. Full neutralisation needs a base.",
    steps: [
      { id: "s1", title: "The neutralisation rule", say: "H⁺ + OH⁻ → H₂O. Equal moles of each consume each other fully.", visual: { kind: "equation", lines: ["H⁺ + OH⁻ → H₂O", "n(H⁺) = n(OH⁻) → pH ≈ 7"] } },
      { id: "s2", title: "Why dilution fails", say: "Water spreads the H⁺ out but never removes it — pH rises toward 7 but stays below.", visual: { kind: "bars", bars: [{ label: "Strong acid", value: 1, unit: "pH" }, { label: "Diluted", value: 3, unit: "pH" }, { label: "Neutralised", value: 7, unit: "pH" }] } },
    ],
  },
  {
    id: "che-aci-num-1", subject: "chemistry", topic: "acids-salts", grade: 11, difficulty: 5, kind: "numeric",
    stem: "A solution has a hydrogen ion concentration of 0.001 mol/dm³. What is its pH?",
    numeric: { answer: 3, tolerance: 0.05, unit: "pH" },
    hint: "Count the power of ten — 0.001 is 10⁻³.",
    examTip: "For strong monobasic acids, pH is simply the negative exponent. 10⁻³ → pH 3. Fast mark.",
    steps: [
      { id: "s1", title: "Write in index form", say: "0.001 = 10⁻³ mol/dm³.", visual: { kind: "equation", lines: ["[H⁺] = 10⁻³ mol/dm³"] } },
      { id: "s2", title: "Apply the definition", say: "pH = −log₁₀[H⁺] = −(−3).", visual: { kind: "equation", lines: ["pH = −log(10⁻³) = 3"] } },
    ],
  },
  {
    id: "che-aci-short-1", subject: "chemistry", topic: "acids-salts", grade: 11, difficulty: 6, kind: "short",
    stem: "Name the salt formed when hydrochloric acid neutralises sodium hydroxide, write the balanced equation, and state what happens to the H⁺ and OH⁻ ions.",
    modelAnswer: "Sodium chloride (NaCl). HCl + NaOH → NaCl + H₂O. The H⁺ ions from the acid and OH⁻ ions from the base combine to form water molecules; the Na⁺ and Cl⁻ ions remain in solution as the salt.",
    rubric: { keywords: ["sodium chloride", "nacl", "hcl", "naoh", "h2o", "water", "balanced", "combine", "form"], minHits: 5, misconception: { if: ["sodium hydrochloride", "nahcl"], note: "Salt names come from the base metal + acid anion: sodium + chloride." } },
    hint: "The metal comes from the base; the non-metal part comes from the acid.",
    examTip: "Equation balance check: 1:1:1:1 here — coefficients of 1 are still worth confirming out loud.",
    steps: [
      { id: "s1", title: "Assemble the salt name", say: "Base gives sodium, acid gives chloride: sodium chloride.", visual: { kind: "flow", nodes: ["NaOH → Na⁺", "HCl → Cl⁻", "→ NaCl"] } },
      { id: "s2", title: "The full equation", say: "Acid + base → salt + water.", visual: { kind: "equation", lines: ["HCl + NaOH → NaCl + H₂O"], note: "Already balanced 1:1:1:1" } },
      { id: "s3", title: "Ionic view", say: "H⁺ and OH⁻ pair off into water; Na⁺ and Cl⁻ watch from the sidelines.", visual: { kind: "equation", lines: ["H⁺ + OH⁻ → H₂O", "Na⁺, Cl⁻: spectator ions"] } },
    ],
  },

  // ── MATHS · QUADRATICS ─────────────────────────────────────────────────
  {
    id: "mat-qua-mcq-1", subject: "maths", topic: "quadratics", grade: 10, difficulty: 3, kind: "mcq",
    stem: "What are the solutions of (x − 3)(x + 2) = 0?",
    choices: [
      { text: "x = 3 and x = −2", correct: true },
      { text: "x = −3 and x = 2", tag: "sign-flip" },
      { text: "x = 3 and x = 2", tag: "ignored-negative" },
      { text: "x = −3 and x = −2", tag: "double-flip" },
    ],
    hint: "If a product is zero, one of the factors must be zero. Set each bracket to zero separately.",
    examTip: "The zero-product property: A × B = 0 ⇒ A = 0 or B = 0. Sign flips are the examiners' favourite trap here.",
    steps: [
      { id: "s1", title: "Zero-product property", say: "A product equals zero only if a factor is zero.", visual: { kind: "equation", lines: ["(x − 3)(x + 2) = 0", "x − 3 = 0  or  x + 2 = 0"] } },
      { id: "s2", title: "Solve each", say: "Move the constant across — watch the signs.", visual: { kind: "equation", lines: ["x = 3", "x = −2"], note: "(x + a) = 0 gives x = −a" } },
    ],
  },
  {
    id: "mat-qua-num-1", subject: "maths", topic: "quadratics", grade: 11, difficulty: 6, kind: "numeric",
    stem: "Using the quadratic formula, find the larger root of x² − 5x + 6 = 0. (Enter the larger root only.)",
    numeric: { answer: 3, tolerance: 0.001 },
    hint: "a = 1, b = −5, c = 6. The discriminant comes first.",
    examTip: "Compute b² − 4ac on its own line. A wrong discriminant poisons everything after it.",
    steps: [
      { id: "s1", title: "Identify a, b, c", say: "a = 1, b = −5, c = 6. b carries its minus sign.", visual: { kind: "equation", lines: ["a = 1, b = −5, c = 6"] } },
      { id: "s2", title: "Discriminant", say: "b² − 4ac = 25 − 24 = 1.", visual: { kind: "equation", lines: ["Δ = (−5)² − 4(1)(6)", "Δ = 25 − 24 = 1"] } },
      { id: "s3", title: "Roots", say: "(5 ± 1)/2 gives 3 and 2. The larger is 3.", visual: { kind: "equation", lines: ["x = (5 ± 1)/2", "x = 3  or  x = 2"] } },
    ],
  },
  {
    id: "mat-qua-short-1", subject: "maths", topic: "quadratics", grade: 11, difficulty: 7, kind: "conceptual",
    stem: "The parabola y = x² − 4x + 3 is plotted. Without graphing, explain how you know (a) which way it opens, (b) where it cuts the x-axis, and (c) where its vertex line of symmetry is.",
    modelAnswer: "(a) The coefficient of x² is positive (+1) so it opens upward. (b) It cuts the x-axis where y = 0: x² − 4x + 3 = (x − 1)(x − 3) = 0, so at x = 1 and x = 3. (c) The axis of symmetry is x = −b/2a = 4/2 = 2, midway between the roots.",
    rubric: { keywords: ["positive", "upward", "opens up", "factorise", "x = 1", "x = 3", "roots", "x = 2", "symmetry", "midpoint"], minHits: 5, misconception: { if: ["opens downward", "x = -1 and x = -3"], note: "Positive x² coefficient always opens upward; negative always downward." } },
    hint: "Read the coefficient of x². Then set y = 0. Then average the roots.",
    examTip: "Three independent marks — structure your answer as (a), (b), (c) exactly as asked.",
    steps: [
      { id: "s1", title: "Opening direction", say: "The x² coefficient is +1: positive means a valley, not a hill.", visual: { kind: "graph", slope: 0, intercept: 3, points: [[1, 0], [2, -1], [3, 0]], xLabel: "x", yLabel: "y" } },
      { id: "s2", title: "X-intercepts", say: "Set y = 0 and factorise.", visual: { kind: "equation", lines: ["x² − 4x + 3 = 0", "(x − 1)(x − 3) = 0", "x = 1, x = 3"] } },
      { id: "s3", title: "Axis of symmetry", say: "Average the roots, or use −b/2a.", visual: { kind: "equation", lines: ["x = (1 + 3)/2 = 2", "x = −(−4)/(2 × 1) = 2"] } },
    ],
  },

  // ── MATHS · TRIGONOMETRY ────────────────────────────────────────────────
  {
    id: "mat-tri-mcq-1", subject: "maths", topic: "trigonometry", grade: 9, difficulty: 3, kind: "mcq",
    stem: "In a right-angled triangle, the side opposite angle θ is 3 cm and the hypotenuse is 5 cm. What is sin θ?",
    choices: [
      { text: "3/5", correct: true },
      { text: "4/5", tag: "used-adjacent" },
      { text: "3/4", tag: "tangent-ratio" },
      { text: "5/3", tag: "inverted" },
    ],
    hint: "SOH-CAH-TOA: sin uses opposite and hypotenuse.",
    examTip: "Label O, A and H on the diagram before writing any ratio. 30 seconds of labelling saves the whole question.",
    steps: [
      { id: "s1", title: "Identify the sides", say: "Opposite = 3, hypotenuse = 5 (the side facing the right angle).", visual: { kind: "flow", nodes: ["opposite = 3", "hypotenuse = 5"] } },
      { id: "s2", title: "Choose the ratio", say: "Sin pairs opposite with hypotenuse.", visual: { kind: "equation", lines: ["sin θ = O ÷ H = 3 ÷ 5"] } },
    ],
  },
  {
    id: "mat-tri-num-1", subject: "maths", topic: "trigonometry", grade: 10, difficulty: 5, kind: "numeric",
    stem: "A ladder leans against a wall, making a 60° angle with the ground. The foot of the ladder is 2 m from the wall. How long is the ladder? (cos 60° = 0.5)",
    numeric: { answer: 4, tolerance: 0.05, unit: "m" },
    hint: "The 2 m is adjacent to the 60° angle; the ladder is the hypotenuse. Which ratio pairs adjacent with hypotenuse?",
    examTip: "Angle-of-elevation items: redraw, label, then choose the ratio that contains your known and your unknown.",
    steps: [
      { id: "s1", title: "Label the triangle", say: "Adjacent = 2 m (ground), hypotenuse = ladder (unknown).", visual: { kind: "graph", slope: 1.73, intercept: 0, points: [[2, 0], [2, 3.46]], xLabel: "ground (m)", yLabel: "wall (m)" } },
      { id: "s2", title: "Cosine", say: "Cos links adjacent and hypotenuse.", visual: { kind: "equation", lines: ["cos 60° = A ÷ H", "0.5 = 2 ÷ L"] } },
      { id: "s3", title: "Solve", say: "Rearrange for L.", visual: { kind: "equation", lines: ["L = 2 ÷ 0.5 = 4 m"] } },
    ],
  },
  {
    id: "mat-tri-short-1", subject: "maths", topic: "trigonometry", grade: 11, difficulty: 7, kind: "short",
    stem: "From a point 30 m from the base of a tower, the angle of elevation of the top is 45°. Explain why the tower's height must be exactly 30 m, without using a calculator.",
    modelAnswer: "tan θ = opposite/adjacent = height/30. When θ = 45°, tan 45° = 1 (the opposite and adjacent of a 45-45-90 triangle are equal). So height = 30 × 1 = 30 m.",
    rubric: { keywords: ["tan", "45", "1", "opposite", "adjacent", "equal", "isosceles", "height", "30"], minHits: 4, misconception: { if: ["need the height first", "cannot know"], note: "At 45° the triangle is isosceles — height and distance are equal by geometry." } },
    hint: "What is special about a right triangle with a 45° angle? What are the other two angles?",
    examTip: "Exact-value angles (30°, 45°, 60°) are examined without calculators. tan 45° = 1 is expected knowledge.",
    steps: [
      { id: "s1", title: "Set up the ratio", say: "tan θ = opposite ÷ adjacent = h ÷ 30.", visual: { kind: "equation", lines: ["tan 45° = h ÷ 30"] } },
      { id: "s2", title: "45° is special", say: "A right triangle with 45° has two equal legs — tan 45° = 1.", visual: { kind: "equation", lines: ["tan 45° = 1", "h = 30 × 1 = 30 m"], note: "45-45-90 → isosceles" } },
    ],
  },

  // ── MATHS · STRAIGHT LINES ─────────────────────────────────────────────
  {
    id: "mat-lin-mcq-1", subject: "maths", topic: "straight-lines", grade: 9, difficulty: 2, kind: "mcq",
    stem: "What is the gradient of the line passing through (1, 2) and (5, 10)?",
    choices: [
      { text: "2", correct: true },
      { text: "1/2", tag: "run-over-rise" },
      { text: "8", tag: "rise-only" },
      { text: "4", tag: "run-only" },
    ],
    hint: "Gradient = rise over run = change in y over change in x.",
    examTip: "Write (y₂ − y₁)/(x₂ − x₁) with matching subscripts — most gradient errors are mismatched pairs.",
    steps: [
      { id: "s1", title: "Rise and run", say: "y changes by 8, x changes by 4.", visual: { kind: "graph", slope: 2, intercept: 0, points: [[1, 2], [5, 10]], xLabel: "x", yLabel: "y" } },
      { id: "s2", title: "Divide", say: "8 over 4.", visual: { kind: "equation", lines: ["m = (10 − 2) ÷ (5 − 1)", "m = 8 ÷ 4 = 2"] } },
    ],
  },
  {
    id: "mat-lin-num-1", subject: "maths", topic: "straight-lines", grade: 10, difficulty: 4, kind: "numeric",
    stem: "A line has equation y = 3x − 4. What is the value of x where the line crosses the x-axis? (Give x correct to 2 decimal places if needed.)",
    numeric: { answer: 1.33, tolerance: 0.02 },
    hint: "Crossing the x-axis means y = 0.",
    examTip: "X-intercept questions always start with 'set y = 0'. Y-intercept always starts with 'set x = 0'.",
    steps: [
      { id: "s1", title: "Set y = 0", say: "On the x-axis, y is zero.", visual: { kind: "equation", lines: ["0 = 3x − 4"] } },
      { id: "s2", title: "Solve", say: "Add 4, divide by 3.", visual: { kind: "equation", lines: ["3x = 4", "x = 4/3 ≈ 1.33"] } },
    ],
  },
  {
    id: "mat-lin-short-1", subject: "maths", topic: "straight-lines", grade: 10, difficulty: 6, kind: "conceptual",
    stem: "Two lines are y = 2x + 1 and y = 2x + 5. Explain, using gradient and intercept, why these lines never meet — and what the 1 and the 5 each control.",
    modelAnswer: "Both lines have gradient 2, so they rise at exactly the same rate — equal gradients mean parallel lines. The intercepts (1 and 5) set where each line crosses the y-axis, so one line sits 4 units above the other everywhere, and they can never meet.",
    rubric: { keywords: ["gradient", "2", "same", "parallel", "intercept", "y-axis", "never meet", "rises", "rate"], minHits: 5, misconception: { if: ["meet at infinity is wrong here", "they cross at", "meet when x"], note: "Parallel lines with different intercepts genuinely never intersect — Euclidean geometry is unambiguous." } },
    hint: "Compare what is identical in the two equations, then what is different.",
    examTip: "'Same gradient ⇒ parallel' should appear word-for-word. Then interpret c as the y-intercept.",
    steps: [
      { id: "s1", title: "Compare gradients", say: "m = 2 for both — identical steepness, identical direction.", visual: { kind: "equation", lines: ["m₁ = 2, m₂ = 2", "equal gradients ⇒ parallel"] } },
      { id: "s2", title: "The intercept's job", say: "c moves the line up or down the y-axis without tilting it.", visual: { kind: "bars", bars: [{ label: "Line 1 crosses y at", value: 1 }, { label: "Line 2 crosses y at", value: 5 }] } },
    ],
  },
];

/* ── Lookups ───────────────────────────────────────────────────────────────── */

export function itemsForTopic(topic: string): BankItem[] {
  return BANK.filter((i) => i.topic === topic);
}

export function itemById(id: string): BankItem | undefined {
  return BANK.find((i) => i.id === id);
}

export function topicTitle(topic: string): string {
  return TOPICS[topic]?.title ?? topic;
}

export function subjectTitle(subject: string): string {
  return SUBJECTS.find((s) => s.id === subject)?.title ?? subject;
}
