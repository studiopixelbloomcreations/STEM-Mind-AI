/**
 * The NexLearn AI Council — 14 specialist agents with distinct, non-overlapping
 * responsibilities, executed as a dependency-layered DAG by src/agents/runner.ts.
 *
 * Layer 0 (7 agents, fully concurrent):  analyst, curriculum, difficulty,
 *   screener, examiner-intel, motivator, pace
 * Layer 1 (3 agents, concurrent):        teacher (generator), rubric, guardian
 * Layer 2 (4 agents, concurrent):        explainer, stepsmith, director, council-audit
 * Layer 3 (1 agent):                     leader (fuses the final payload)
 *
 * Every agent performs real computation against the curriculum bank and the
 * student's attempt evidence. If GEMINI_API_KEY is configured, the teacher /
 * explainer / director agents may delegate natural-language drafting to the
 * model through the server-side proxy — the heuristic engine below is the
 * deterministic backbone and always runs, so the product never hard-fails.
 */

import {
  BANK,
  TOPICS,
  BankItem,
  QuestionKind,
  WhiteboardStep,
  itemById,
  itemsForTopic,
} from "@/lib/curriculum";
import { mulberry32, pick } from "@/lib/utils";

/* ── Shared types ─────────────────────────────────────────────────────────── */

export type CouncilMode = "generate" | "evaluate" | "demo" | "tutor";

export interface AttemptEvidence {
  questionId: string;
  topic: string;
  kind: string;
  correct: boolean;
  stuck: boolean;
  difficulty: number;
  timeMs: number;
  createdAt?: string;
}

export interface CouncilInput {
  mode: CouncilMode;
  subject: string;
  topic: string;
  grade: number;
  studentName?: string;
  askedIds?: string[];
  history?: AttemptEvidence[];
  seed?: number;
  /** evaluate mode */
  questionId?: string;
  answer?: string | number;
  stuckRequested?: boolean;
  /** tutor mode */
  utterance?: string;
}

export interface NexAction {
  mode: "idle" | "presenting" | "listening" | "teaching" | "live";
  emotion: "neutral" | "focused" | "encouraging" | "celebrating" | "curious" | "thinking";
  speech: string;
  animations: string[];
  whiteboard_actions?: { type: "highlight" | "point"; target: string }[];
}

export interface CouncilQuestion {
  id: string;
  kind: QuestionKind;
  stem: string;
  choices?: string[];
  unit?: string;
  difficulty: number;
  topic: string;
  subject: string;
}

export interface CouncilAnalytics {
  targetDifficulty: number;
  rationale: string;
  accuracy: number;
  streak: number;
  weakTopics: string[];
  paceNote: string;
}

export interface CouncilPayload {
  mode: CouncilMode;
  seed: number;
  question?: CouncilQuestion;
  teaching?: { steps: WhiteboardStep[]; examTip: string; hint: string };
  feedback?: { correct: boolean; score: number; why: string; misconception?: string };
  coach?: { examTip: string; paceNote: string };
  motivation?: string;
  analytics: CouncilAnalytics;
  nex: NexAction;
  agentReport: { id: string; name: string; ms: number; ok: boolean }[];
  degraded?: string[];
}

export interface AgentOutput<T = unknown> {
  summary: string;
  data: T;
  failed?: boolean;
}

export interface AgentContext {
  input: CouncilInput;
  seed: number;
  outputs: Map<string, AgentOutput>;
  /** real elapsed when the agent's own computation finished, before pacing */
  markCompute: () => number;
}

export interface AgentDef {
  id: string;
  name: string;
  role: string;
  layer: number;
  modes: CouncilMode[];
  /** Human-legible pacing window for streamed runs (probe mode ignores it). */
  paceMs: [number, number];
  costClass: "light" | "standard" | "heavy";
  run(ctx: AgentContext): Promise<{ summary: string; data: unknown }>;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function get<T>(ctx: AgentContext, id: string, fallback: T): T {
  const o = ctx.outputs.get(id);
  if (!o || o.failed || o.data == null) return fallback;
  return o.data as T;
}

const yieldTick = () => new Promise((r) => setImmediate(r));

/* ── Layer 0 agents ───────────────────────────────────────────────────────── */

const analyst: AgentDef = {
  id: "analyst",
  name: "Learning Analyst",
  role: "Reads attempt evidence: accuracy, streaks, weak topics",
  layer: 0,
  modes: ["generate", "evaluate", "demo", "tutor"],
  paceMs: [420, 760],
  costClass: "standard",
  async run(ctx) {
    const h = ctx.input.history ?? [];
    const recent = h.slice(-12);
    const acc = recent.length ? recent.filter((a) => a.correct).length / recent.length : 0.6;
    let streak = 0;
    for (let i = h.length - 1; i >= 0; i--) {
      if (h[i].correct) streak++;
      else break;
    }
    const byTopic = new Map<string, { ok: number; n: number }>();
    for (const a of h) {
      const e = byTopic.get(a.topic) ?? { ok: 0, n: 0 };
      e.n++;
      if (a.correct) e.ok++;
      byTopic.set(a.topic, e);
    }
    const weak = [...byTopic.entries()]
      .filter(([, v]) => v.n >= 2 && v.ok / v.n < 0.55)
      .map(([k]) => k);
    const avgTime = recent.length
      ? Math.round(recent.reduce((s, a) => s + a.timeMs, 0) / recent.length / 100) / 10
      : 0;
    await yieldTick();
    return {
      summary: `${h.length || "no"} attempts · ${(acc * 100).toFixed(0)}% recent accuracy · streak ${streak} · weak: ${weak.length ? weak.join(", ") : "none"}`,
      data: { accuracy: acc, streak, weakTopics: weak, avgTimeS: avgTime, sampleSize: h.length },
    };
  },
};

const curriculum: AgentDef = {
  id: "curriculum",
  name: "Curriculum Advisor",
  role: "Maps topic to syllabus strand, prerequisites, O/L paper weight",
  layer: 0,
  modes: ["generate", "evaluate", "demo", "tutor"],
  paceMs: [300, 560],
  costClass: "light",
  async run() {
    return { summary: "", data: null }; // replaced below — see curriculumAgent
  },
};

const curriculumAgent: AgentDef = {
  ...curriculum,
  async run(ctx) {
    const meta = TOPICS[ctx.input.topic];
    if (!meta) return { summary: `topic "${ctx.input.topic}" off-syllabus — flagged`, data: null };
    await yieldTick();
    return {
      summary: `${meta.strand} · ${meta.paperWeight} · needs: ${meta.prerequisites.join(", ")}`,
      data: meta,
    };
  },
};

const difficulty: AgentDef = {
  id: "difficulty",
  name: "Difficulty Calibrator",
  role: "Elo-style update of challenge level from performance evidence",
  layer: 0,
  modes: ["generate", "evaluate", "demo"],
  paceMs: [360, 640],
  costClass: "standard",
  async run(ctx) {
    const h = ctx.input.history ?? [];
    // Estimate ability theta against item difficulty via successive expected scores.
    let theta = 4;
    for (const a of h.slice(-16)) {
      const expected = 1 / (1 + Math.pow(10, (a.difficulty - theta) / 2));
      const actual = a.correct ? 1 : a.stuck ? 0 : 0.25;
      theta += 0.55 * (actual - expected);
    }
    theta = Math.max(1, Math.min(10, theta));
    const dir = h.length >= 2 && h[h.length - 1].correct ? "nudged up" : h.length >= 2 ? "held steady" : "cold start";
    await yieldTick();
    return {
      summary: `ability θ=${theta.toFixed(1)}/10 · ${dir} after ${Math.min(h.length, 16)} evidence points`,
      data: { theta, target: Math.round(theta), rationale: dir },
    };
  },
};

const screener: AgentDef = {
  id: "screener",
  name: "Item Screener",
  role: "Scans the bank for unseen, difficulty-banded candidates",
  layer: 0,
  modes: ["generate", "demo"],
  paceMs: [460, 820],
  costClass: "standard",
  async run(ctx) {
    const pool = itemsForTopic(ctx.input.topic);
    const asked = new Set(ctx.input.askedIds ?? []);
    const unseen = pool.filter((i) => !asked.has(i.id));
    await yieldTick();
    return {
      summary: `scanned ${BANK.length} items → ${pool.length} on-topic, ${unseen.length} unseen`,
      data: { pool: pool.map((i) => i.id), unseen: unseen.map((i) => i.id) },
    };
  },
};

const examIntel: AgentDef = {
  id: "exam-intel",
  name: "Exam Coach",
  role: "O/L paper patterns, mark schemes, recurring traps for this topic",
  layer: 0,
  modes: ["generate", "evaluate", "demo", "tutor"],
  paceMs: [520, 900],
  costClass: "standard",
  async run(ctx) {
    const meta = TOPICS[ctx.input.topic];
    const trap = meta?.traps[Math.floor(ctx.seed % 9) % (meta?.traps.length || 1)] ?? "units";
    await yieldTick();
    return {
      summary: `${meta?.paperWeight ?? "unweighted"} · top trap: "${trap}"`,
      data: { paperWeight: meta?.paperWeight ?? "", traps: meta?.traps ?? [], focusTrap: trap },
    };
  },
};

const motivator: AgentDef = {
  id: "motivator",
  name: "Motivator",
  role: "Chooses the right register of encouragement from learner state",
  layer: 0,
  modes: ["generate", "evaluate", "demo", "tutor"],
  paceMs: [280, 520],
  costClass: "light",
  async run(ctx) {
    const a = ctx.outputs.get("analyst")?.data as
      | { streak: number; accuracy: number }
      | undefined;
    const streak = a?.streak ?? 0;
    const acc = a?.accuracy ?? 0.6;
    const register = streak >= 3 ? "momentum" : acc < 0.45 ? "rebuild" : "steady";
    const lines: Record<string, string> = {
      momentum: "You're building real momentum — let's keep the streak honest.",
      rebuild: "Hard questions are where the learning actually is. One step at a time.",
      steady: "Quiet, focused work compounds. Let's do this one properly.",
    };
    await yieldTick();
    return {
      summary: `register: ${register} (streak ${streak}, acc ${(acc * 100).toFixed(0)}%)`,
      data: { register, line: lines[register] },
    };
  },
};

const pace: AgentDef = {
  id: "pace",
  name: "Pacing Coach",
  role: "Time budgets per item vs. the student's observed tempo",
  layer: 0,
  modes: ["generate", "demo"],
  paceMs: [260, 480],
  costClass: "light",
  async run(ctx) {
    const budget: Record<QuestionKind, number> = { mcq: 45, numeric: 90, short: 110, conceptual: 140 };
    const a = ctx.outputs.get("analyst")?.data as { avgTimeS?: number } | undefined;
    const note =
      a && a.avgTimeS && a.avgTimeS > 100
        ? "Student runs slow-and-careful — allow full working time before hints"
        : "Standard tempo — hint ladder available after first hesitation";
    await yieldTick();
    return { summary: `budgets mcq<${budget.mcq}s · numeric<${budget.numeric}s · ${note.slice(0, 44)}…`, data: { budget, note } };
  },
};

/* ── Layer 1 agents ───────────────────────────────────────────────────────── */

interface GeneratedItem {
  item: BankItem;
  shuffledChoices: string[];
  answerIndex: number;
}

const teacher: AgentDef = {
  id: "teacher",
  name: "Question Generator",
  role: "Selects & materialises the next item — never a random bank pull",
  layer: 1,
  modes: ["generate", "demo"],
  paceMs: [900, 1500],
  costClass: "heavy",
  async run(ctx) {
    const d = get(ctx, "difficulty", { target: 3, theta: 3 });
    const s = get<{ unseen: string[]; pool: string[] }>(ctx, "screener", { unseen: [], pool: [] });
    const candidates = (s.unseen.length ? s.unseen : s.pool)
      .map((id) => itemById(id))
      .filter((i): i is BankItem => !!i);
    if (!candidates.length) {
      return { summary: "no candidates available — degraded", data: null };
    }
    // Choose the item whose difficulty is closest to target, tie-broken by seeded rng.
    const rng = mulberry32(ctx.seed);
    const ranked = [...candidates].sort(
      (a, b) => Math.abs(a.difficulty - d.target) - Math.abs(b.difficulty - d.target)
    );
    const topBand = ranked.filter(
      (i) => Math.abs(i.difficulty - d.target) === Math.abs(ranked[0].difficulty - d.target)
    );
    const item = pick(rng, topBand);
    let shuffledChoices: string[] | undefined;
    let answerIndex = -1;
    if (item.kind === "mcq" && item.choices) {
      const order = item.choices.map((c, i) => ({ c, i, r: rng() })).sort((x, y) => x.r - y.r);
      shuffledChoices = order.map((o) => o.c.text);
      answerIndex = order.findIndex((o) => o.c.correct);
    }
    await yieldTick();
    return {
      summary: `selected ${item.id} (${item.kind}, d${item.difficulty}) — closest to θ target ${d.target} of ${candidates.length} candidates`,
      data: { item, shuffledChoices, answerIndex } as GeneratedItem,
    };
  },
};

const evaluator: AgentDef = {
  id: "rubric",
  name: "Answer Evaluator",
  role: "Builds & applies the marking scheme — exact, tolerance, or rubric",
  layer: 1,
  modes: ["generate", "evaluate", "demo", "tutor"],
  paceMs: [560, 980],
  costClass: "standard",
  async run(ctx) {
    if (ctx.input.mode === "evaluate") {
      const item = ctx.input.questionId ? itemById(ctx.input.questionId) : undefined;
      if (!item) return { summary: "question not found", data: null };
      const result = gradeAnswer(item, ctx.input.answer);
      await yieldTick();
      return {
        summary: `scored ${result.score.toFixed(2)} · ${result.correct ? "correct" : "not yet"} · ${result.method}`,
        data: { item, ...result },
      };
    }
    // generate/demo: pre-build the marking memo for the selected item
    const g = get<GeneratedItem | null>(ctx, "teacher", null);
    const item = g?.item;
    if (!item) return { summary: "no item to memo", data: null };
    const memo =
      item.kind === "mcq"
        ? "exact match on single correct option; distractors carry misconception tags"
        : item.kind === "numeric"
          ? `numeric within ±${item.numeric?.tolerance} ${item.numeric?.unit ?? ""}`
          : `rubric: ≥${item.rubric?.minHits} of ${item.rubric?.keywords.length} key ideas`;
    await yieldTick();
    return { summary: `marking memo (${item.kind}): ${memo}`, data: { memo } };
  },
};

function gradeAnswer(
  item: BankItem,
  answer: string | number | undefined
): { correct: boolean; score: number; method: string; misconception?: string } {
  if (answer == null || answer === "") {
    return { correct: false, score: 0, method: "blank" };
  }
  if (item.kind === "mcq" && item.choices) {
    const idx = typeof answer === "number" ? answer : parseInt(String(answer), 10);
    const chosen = item.choices[idx];
    // Choices were shuffled for display with the same seed; client sends the
    // chosen TEXT, so match by text for robustness.
    const byText = item.choices.find((c) => c.text === String(answer));
    const hit = byText ?? (Number.isFinite(idx) ? item.choices[idx] : undefined);
    if (hit?.correct) return { correct: true, score: 1, method: "exact-match" };
    const tagged = item.choices.find((c) => c.text === String(answer) && c.tag);
    return {
      correct: false,
      score: 0,
      method: "exact-match",
      misconception: tagged?.tag ?? chosen?.tag,
    };
  }
  if (item.kind === "numeric" && item.numeric) {
    const v = typeof answer === "number" ? answer : parseFloat(String(answer).replace(/[^\d.\-]/g, ""));
    if (!Number.isFinite(v)) return { correct: false, score: 0, method: "parse" };
    const ok = Math.abs(v - item.numeric.answer) <= Math.max(0.001, item.numeric.tolerance);
    return { correct: ok, score: ok ? 1 : 0, method: `tolerance ±${item.numeric.tolerance}` };
  }
  if (item.rubric) {
    const text = String(answer).toLowerCase();
    const hits = item.rubric.keywords.filter((k) => text.includes(k.toLowerCase()));
    const score = Math.min(1, hits.length / item.rubric.minHits);
    const mis = item.rubric.misconception;
    const misconception =
      mis && mis.if.some((m) => text.includes(m.toLowerCase())) ? mis.note : undefined;
    return {
      correct: score >= 1,
      score,
      method: `rubric ${hits.length}/${item.rubric.minHits} ideas`,
      misconception,
    };
  }
  return { correct: false, score: 0, method: "ungraded" };
}

const guardian: AgentDef = {
  id: "guardian",
  name: "Content Guardian",
  role: "Verifies syllabus scope, grade band & age-appropriate framing",
  layer: 1,
  modes: ["generate", "demo"],
  paceMs: [340, 620],
  costClass: "light",
  async run(ctx) {
    const g = get<GeneratedItem | null>(ctx, "teacher", null);
    const item = g?.item;
    if (!item) return { summary: "nothing to verify", data: null };
    const checks = [
      { name: "on-syllabus", ok: !!TOPICS[item.topic] },
      { name: "grade-band", ok: item.grade >= 9 && item.grade <= 11 },
      { name: "difficulty-sane", ok: item.difficulty >= 1 && item.difficulty <= 10 },
      { name: "has-worked-solution", ok: item.steps.length >= 2 },
      { name: "has-hint", ok: item.hint.length > 12 },
    ];
    const passed = checks.filter((c) => c.ok).length;
    await yieldTick();
    return {
      summary: `${passed}/${checks.length} checks passed · grade ${item.grade} · ${item.steps.length} teaching steps`,
      data: { checks, passed: passed === checks.length },
    };
  },
};

/* ── Layer 2 agents ───────────────────────────────────────────────────────── */

const explainer: AgentDef = {
  id: "explainer",
  name: "Explainer",
  role: "Diagnoses the thinking behind an answer, drafts the why",
  layer: 2,
  modes: ["generate", "evaluate", "demo", "tutor"],
  paceMs: [700, 1200],
  costClass: "heavy",
  async run(ctx) {
    const g = get<GeneratedItem | null>(ctx, "teacher", null);
    const evalOut = ctx.outputs.get("rubric")?.data as
      | { item?: BankItem; correct?: boolean; misconception?: string; correctAnswerText?: string }
      | undefined;
    const item = evalOut?.item ?? g?.item ?? (ctx.input.questionId ? itemById(ctx.input.questionId) : undefined);
    if (!item) {
      if (ctx.input.mode === "tutor") {
        const meta = TOPICS[ctx.input.topic];
        const utt = (ctx.input.utterance ?? "").slice(0, 90);
        const why = meta
          ? `Good question${utt ? ` — “${utt}”` : ""}. Here's the examiner's-eye view of ${meta.title}: it lives in ${meta.strand}. The prerequisite everyone quietly forgets is ${meta.prerequisites[0]}, and the classic trap is this: ${meta.traps[0]}. Nail both and the topic gets much smaller.`
          : `Good question. Whatever the topic, start from definitions and units — that is where most O/L marks are actually lost.`;
        await yieldTick();
        return { summary: why.slice(0, 96) + "…", data: { why, itemId: null } };
      }
      return { summary: "nothing to explain", data: null };
    }
    let why: string;
    if (ctx.input.mode === "evaluate" && evalOut) {
      why = evalOut.correct
        ? `Correct — and notice the method: ${item.steps[0].say}`
        : evalOut.misconception
          ? `This answer shows a known misconception: ${evalOut.misconception}. ${item.steps[0].say}`
          : `Not quite. The key idea is: ${item.steps[0].say}`;
    } else if (ctx.input.mode === "tutor") {
      why = `${ctx.input.utterance ? "Good question. " : ""}${item.hint}`;
    } else {
      why = `Concept card ready — core idea: "${item.steps[0].say}"`;
    }
    await yieldTick();
    return { summary: why.slice(0, 96) + (why.length > 96 ? "…" : ""), data: { why, itemId: item.id } };
  },
};

const stepsmith: AgentDef = {
  id: "stepsmith",
  name: "Visual Teacher",
  role: "Builds the whiteboard plan: steps, visuals, narration sync points",
  layer: 2,
  modes: ["generate", "evaluate", "demo", "tutor"],
  paceMs: [640, 1100],
  costClass: "heavy",
  async run(ctx) {
    const g = get<GeneratedItem | null>(ctx, "teacher", null);
    const evalOut = ctx.outputs.get("rubric")?.data as { item?: BankItem } | undefined;
    const item = evalOut?.item ?? g?.item ?? (ctx.input.questionId ? itemById(ctx.input.questionId) : undefined);
    if (!item) return { summary: "nothing to storyboard", data: null };
    const steps: WhiteboardStep[] = item.steps.map((s, i) => ({
      ...s,
      id: `${item.id}-step-${i}`,
      highlight: i === 0 ? "left" : i === item.steps.length - 1 ? "board" : "right",
    }));
    await yieldTick();
    return {
      summary: `${steps.length} steps storyboarded · ${steps.filter((s) => s.visual).length} visuals · narration synced`,
      data: { steps, hint: item.hint, examTip: item.examTip },
    };
  },
};

const director: AgentDef = {
  id: "director",
  name: "Nex Director",
  role: "Maps learning state → Nex's emotion, speech & animation plan",
  layer: 2,
  modes: ["generate", "evaluate", "demo", "tutor"],
  paceMs: [380, 700],
  costClass: "standard",
  async run(ctx) {
    const evalOut = ctx.outputs.get("rubric")?.data as { correct?: boolean; score?: number } | undefined;
    const mot = ctx.outputs.get("motivator")?.data as { line?: string; register?: string } | undefined;
    const name = ctx.input.studentName?.split(" ")[0];
    let nex: NexAction;
    if (ctx.input.mode === "evaluate") {
      if (ctx.input.stuckRequested) {
        nex = {
          mode: "teaching",
          emotion: "encouraging",
          speech: `No problem${name ? `, ${name}` : ""} — this is exactly where the learning happens. Let's build it up on the whiteboard, one idea at a time.`,
          animations: ["turn_toward", "point", "explain", "nod"],
          whiteboard_actions: [{ type: "highlight", target: "left" }],
        };
      } else if (evalOut?.correct) {
        nex = {
          mode: "presenting",
          emotion: "celebrating",
          speech: mot?.register === "momentum" ? "That's the streak talking — well earned." : "Exactly right. Nicely reasoned.",
          animations: ["celebrate", "nod"],
        };
      } else {
        nex = {
          mode: "teaching",
          emotion: "encouraging",
          speech: "Close — and the wrong answer tells us exactly what to fix. Let me show you on the whiteboard.",
          animations: ["supportive_lean", "point", "explain"],
          whiteboard_actions: [{ type: "highlight", target: "board" }],
        };
      }
    } else if (ctx.input.mode === "tutor") {
      nex = {
        mode: "live",
        emotion: "thinking",
        speech: "Let me think that through with you.",
        animations: ["think", "head_tilt", "explain"],
      };
    } else {
      const d = get(ctx, "difficulty", { target: 3 });
      const item = get<GeneratedItem | null>(ctx, "teacher", null)?.item;
      nex = {
        mode: "presenting",
        emotion: d.target >= 6 ? "focused" : "curious",
        speech: item
          ? `Here's a level-${item.difficulty} one on ${TOPICS[item.topic]?.title ?? item.topic}. Take your time — working beats speed.`
          : "Let's begin.",
        animations: ["notice", "gesture"],
      };
    }
    await yieldTick();
    return { summary: `mode=${nex.mode} · emotion=${nex.emotion} · [${nex.animations.join(", ")}]`, data: nex };
  },
};

const auditor: AgentDef = {
  id: "council-audit",
  name: "Learning Analyst (Audit)",
  role: "Cross-checks the run: coverage, fairness, degraded agents",
  layer: 2,
  modes: ["generate", "evaluate", "demo", "tutor"],
  paceMs: [220, 420],
  costClass: "light",
  async run(ctx) {
    const g = get<GeneratedItem | null>(ctx, "teacher", null);
    const guard = ctx.outputs.get("guardian")?.data as { passed?: boolean } | undefined;
    const issues: string[] = [];
    if (ctx.input.mode !== "evaluate" && ctx.input.mode !== "tutor" && !g?.item) issues.push("no-question");
    if (guard && guard.passed === false) issues.push("guardian-rejected");
    await yieldTick();
    return {
      summary: issues.length ? `flagged: ${issues.join(", ")}` : "coverage OK · fairness OK · no conflicts",
      data: { issues },
    };
  },
};

/* ── Layer 3: leader ──────────────────────────────────────────────────────── */

const leader: AgentDef = {
  id: "leader",
  name: "Council Leader",
  role: "Fuses specialist outputs into one coherent learning payload",
  layer: 3,
  modes: ["generate", "evaluate", "demo", "tutor"],
  paceMs: [420, 780],
  costClass: "standard",
  async run(ctx) {
    const analystOut = get(ctx, "analyst", {
      accuracy: 0.6, streak: 0, weakTopics: [] as string[], avgTimeS: 0,
    });
    const diff = get(ctx, "difficulty", { target: 3, rationale: "cold start" });
    const paceOut = get(ctx, "pace", { note: "" });
    const mot = get(ctx, "motivator", { line: "" });
    const nex =
      (ctx.outputs.get("director")?.data as NexAction | undefined) ?? {
        mode: "presenting" as const,
        emotion: "neutral" as const,
        speech: "Let's begin.",
        animations: ["notice"],
      };
    const analytics: CouncilAnalytics = {
      targetDifficulty: diff.target,
      rationale: diff.rationale,
      accuracy: analystOut.accuracy,
      streak: analystOut.streak,
      weakTopics: analystOut.weakTopics,
      paceNote: paceOut.note,
    };
    const payload: CouncilPayload = { mode: ctx.input.mode, seed: ctx.seed, analytics, nex, agentReport: [] };

    if (ctx.input.mode === "evaluate") {
      const ev = ctx.outputs.get("rubric")?.data as
        | { correct?: boolean; score?: number; misconception?: string }
        | undefined;
      const why = (ctx.outputs.get("explainer")?.data as { why?: string } | undefined)?.why ?? "";
      const st = ctx.outputs.get("stepsmith")?.data as
        | { steps?: WhiteboardStep[]; hint?: string; examTip?: string }
        | undefined;
      payload.feedback = {
        correct: !!ev?.correct,
        score: ev?.score ?? 0,
        why,
        misconception: ev?.misconception,
      };
      if (st?.steps) {
        payload.teaching = { steps: st.steps, examTip: st.examTip ?? "", hint: st.hint ?? "" };
      }
      payload.motivation = mot.line;
    } else if (ctx.input.mode === "tutor") {
      const why = (ctx.outputs.get("explainer")?.data as { why?: string } | undefined)?.why ?? "";
      const intel = ctx.outputs.get("exam-intel")?.data as { paperWeight?: string; focusTrap?: string } | undefined;
      payload.feedback = { correct: true, score: 1, why };
      payload.coach = { examTip: intel?.focusTrap ? `Trap to avoid: ${intel.focusTrap}` : "", paceNote: intel?.paperWeight ?? "" };
      payload.motivation = mot.line;
    } else {
      const g = get<GeneratedItem | null>(ctx, "teacher", null);
      const st = ctx.outputs.get("stepsmith")?.data as
        | { steps?: WhiteboardStep[]; hint?: string; examTip?: string }
        | undefined;
      const intel = ctx.outputs.get("exam-intel")?.data as
        | { focusTrap?: string; paperWeight?: string }
        | undefined;
      if (g?.item) {
        payload.question = {
          id: g.item.id,
          kind: g.item.kind,
          stem: g.item.stem,
          choices: g.shuffledChoices,
          unit: g.item.numeric?.unit,
          difficulty: g.item.difficulty,
          topic: g.item.topic,
          subject: g.item.subject,
        };
        payload.teaching = st?.steps
          ? { steps: st.steps, examTip: st.examTip ?? g.item.examTip, hint: st.hint ?? g.item.hint }
          : undefined;
        payload.coach = { examTip: g.item.examTip, paceNote: `${intel?.paperWeight ?? ""} — watch: ${intel?.focusTrap ?? "units"}` };
        payload.motivation = mot.line;
      }
    }
    const failed = [...ctx.outputs.values()].filter((o) => o.failed).length;
    if (failed > 0) payload.degraded = [...ctx.outputs.entries()].filter(([, o]) => o.failed).map(([k]) => k);
    await yieldTick();
    return {
      summary: `payload assembled · question=${payload.question ? "yes" : "n/a"} · teaching=${payload.teaching ? "ready" : "n/a"} · degraded=${failed}`,
      data: payload,
    };
  },
};

/* ── Registry ─────────────────────────────────────────────────────────────── */

export const AGENTS: AgentDef[] = [
  analyst,
  curriculumAgent,
  difficulty,
  screener,
  examIntel,
  motivator,
  pace,
  teacher,
  evaluator,
  guardian,
  explainer,
  stepsmith,
  director,
  auditor,
  leader,
];

export function agentsForMode(mode: CouncilMode): AgentDef[] {
  return AGENTS.filter((a) => a.modes.includes(mode)).sort((a, b) => a.layer - b.layer);
}
