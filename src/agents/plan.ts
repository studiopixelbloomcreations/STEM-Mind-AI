/**
 * Client-safe mirror of the council roster metadata (ids must match
 * src/agents/registry.ts — the registry is server-only because it performs
 * computation; this module is pure data and safe to ship to the browser).
 */

export interface PlanEntry {
  id: string;
  name: string;
  role: string;
  layer: number;
  budget: number;
  costClass: "light" | "standard" | "heavy";
}

export const COUNCIL_PLAN: PlanEntry[] = [
  { id: "analyst", name: "Learning Analyst", role: "Accuracy, streaks & weak topics from attempt evidence", layer: 0, budget: 760, costClass: "standard" },
  { id: "curriculum", name: "Curriculum Advisor", role: "Syllabus strand, prerequisites & O/L paper weight", layer: 0, budget: 560, costClass: "light" },
  { id: "difficulty", name: "Difficulty Calibrator", role: "Elo-style update of challenge level", layer: 0, budget: 640, costClass: "standard" },
  { id: "screener", name: "Item Screener", role: "Unseen, difficulty-banded candidates from the bank", layer: 0, budget: 820, costClass: "standard" },
  { id: "exam-intel", name: "Exam Coach", role: "O/L mark schemes & recurring traps", layer: 0, budget: 900, costClass: "standard" },
  { id: "motivator", name: "Motivator", role: "Register of encouragement from learner state", layer: 0, budget: 520, costClass: "light" },
  { id: "pace", name: "Pacing Coach", role: "Time budgets vs. observed student tempo", layer: 0, budget: 480, costClass: "light" },
  { id: "teacher", name: "Question Generator", role: "Selects & materialises the next item", layer: 1, budget: 1500, costClass: "heavy" },
  { id: "rubric", name: "Answer Evaluator", role: "Builds & applies the marking scheme", layer: 1, budget: 980, costClass: "standard" },
  { id: "guardian", name: "Content Guardian", role: "Syllabus scope & grade-band verification", layer: 1, budget: 620, costClass: "light" },
  { id: "explainer", name: "Explainer", role: "Diagnoses the thinking behind an answer", layer: 2, budget: 1200, costClass: "heavy" },
  { id: "stepsmith", name: "Visual Teacher", role: "Whiteboard steps, visuals & narration sync", layer: 2, budget: 1100, costClass: "heavy" },
  { id: "director", name: "Nex Director", role: "Learning state → Nex's emotion & animation plan", layer: 2, budget: 700, costClass: "standard" },
  { id: "council-audit", name: "Council Auditor", role: "Coverage, fairness & degraded-agent cross-check", layer: 2, budget: 420, costClass: "light" },
  { id: "leader", name: "Council Leader", role: "Fuses specialist output into one payload", layer: 3, budget: 780, costClass: "standard" },
];

export const COUNCIL_COUNT = COUNCIL_PLAN.length;
export const COUNCIL_MAX_PARALLEL = Math.max(
  ...[0, 1, 2, 3].map((l) => COUNCIL_PLAN.filter((a) => a.layer === l).length)
);
