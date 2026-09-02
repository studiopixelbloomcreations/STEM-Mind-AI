/**
 * Council runner — executes the agent DAG in dependency layers.
 *
 * Everything inside a layer runs in TRUE PARALLEL (Promise.allSettled fan-out).
 * Only genuine data dependencies (teacher → explainer/stepsmith/director,
 * everything → leader) are serialised across layers. Partial failure is
 * graceful: one timed-out/failed agent cannot block the other thirteen or
 * the final payload.
 *
 * Events stream as NDJSON to the client. Compute is real; streamed runs add a
 * seeded per-agent "pacing window" (def.paceMs) purely so a human can watch
 * concurrency happen — probe mode skips pacing and reports raw compute time.
 */

import {
  AGENTS,
  AgentDef,
  AgentOutput,
  CouncilInput,
  CouncilMode,
  CouncilPayload,
  agentsForMode,
} from "./registry";
import { mulberry32 } from "@/lib/utils";

export type CouncilEvent =
  | { type: "plan"; mode: CouncilMode; startedAt: number; agents: PlanAgent[] }
  | { type: "start"; id: string; at: number }
  | { type: "done"; id: string; at: number; ms: number; computeMs: number; snippet: string }
  | { type: "fail"; id: string; at: number; ms: number; error: string }
  | { type: "payload"; at: number; totalMs: number; payload: CouncilPayload }
  | { type: "error"; message: string };

export interface PlanAgent {
  id: string;
  name: string;
  role: string;
  layer: number;
  budget: number;
  costClass: AgentDef["costClass"];
}

const HARD_TIMEOUT_MS = 12_000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

/** Synthetic-but-plausible evidence for landing-page demo runs. */
export function demoHistory(seed: number) {
  const rng = mulberry32(seed);
  const topics = ["motion", "forces", "quadratics", "mole-concept", "trigonometry"];
  const out = [];
  for (let i = 0; i < 14; i++) {
    const difficulty = 2 + Math.floor(rng() * 6);
    const correct = rng() < 0.58 + (difficulty < 4 ? 0.18 : -0.05);
    out.push({
      questionId: `demo-${i}`,
      topic: topics[Math.floor(rng() * topics.length)],
      kind: i % 3 === 0 ? "numeric" : i % 3 === 1 ? "mcq" : "short",
      correct,
      stuck: !correct && rng() < 0.3,
      difficulty,
      timeMs: 30_000 + Math.floor(rng() * 90_000),
    });
  }
  return out;
}

export async function runCouncil(
  input: CouncilInput,
  emit: (e: CouncilEvent) => void
): Promise<CouncilPayload | null> {
  const seed = input.seed ?? Math.floor(Math.random() * 1e9);
  const startedAt = Date.now();
  const mode: CouncilMode = input.mode;
  const roster = agentsForMode(mode);
  const rng = mulberry32(seed ^ 0x9e3779b9);

  emit({
    type: "plan",
    mode,
    startedAt,
    agents: roster.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      layer: a.layer,
      budget: a.paceMs[1],
      costClass: a.costClass,
    })),
  });

  const outputs = new Map<string, AgentOutput>();
  const timings = new Map<string, { ms: number; ok: boolean }>();
  let computeMs = 0;

  const ctx = {
    input: { ...input, seed },
    seed,
    outputs,
    markCompute: () => computeMs,
  };

  const layers = [...new Set(roster.map((a) => a.layer))].sort((a, b) => a - b);

  for (const layer of layers) {
    const inLayer = roster.filter((a) => a.layer === layer);
    // True concurrency: every agent in this layer is in flight at the same instant.
    await Promise.allSettled(
      inLayer.map(async (def, i) => {
        const t0 = performance.now();
        emit({ type: "start", id: def.id, at: Date.now() });
        try {
          const result = await withTimeout(def.run(ctx), HARD_TIMEOUT_MS, def.name);
          const computeDone = performance.now() - t0;
          computeMs = computeDone;
          // Human-legible pacing window (deterministic per seed) — streamed runs only.
          const span = def.paceMs[0] + rng() * (def.paceMs[1] - def.paceMs[0]);
          const remaining = Math.max(0, span - computeDone);
          if (remaining > 0) await new Promise((r) => setTimeout(r, remaining + i * 24));
          const ms = Math.round(performance.now() - t0);
          const output: AgentOutput = { summary: result.summary, data: result.data };
          outputs.set(def.id, output);
          timings.set(def.id, { ms, ok: true });
          emit({
            type: "done",
            id: def.id,
            at: Date.now(),
            ms,
            computeMs: Math.round(computeDone),
            snippet: result.summary.slice(0, 140),
          });
        } catch (err) {
          const ms = Math.round(performance.now() - t0);
          outputs.set(def.id, { summary: "(unavailable)", data: null, failed: true });
          timings.set(def.id, { ms, ok: false });
          emit({
            type: "fail",
            id: def.id,
            at: Date.now(),
            ms,
            error: err instanceof Error ? err.message : "agent failed",
          });
        }
      })
    );
  }

  const leaderOut = outputs.get("leader")?.data as CouncilPayload | undefined;
  if (!leaderOut) {
    emit({ type: "error", message: "Council Leader produced no payload" });
    return null;
  }
  leaderOut.agentReport = roster.map((a) => ({
    id: a.id,
    name: a.name,
    ms: timings.get(a.id)?.ms ?? 0,
    ok: timings.get(a.id)?.ok ?? false,
  }));
  emit({ type: "payload", at: Date.now(), totalMs: Date.now() - startedAt, payload: leaderOut });
  return leaderOut;
}

/** Single-agent probe — no pacing, raw compute timing. Used by the landing
 *  council demo to fire 14 genuinely concurrent in-flight requests. */
export async function probeAgent(
  agentId: string,
  input: CouncilInput
): Promise<{ id: string; ok: boolean; computeMs: number; summary: string }> {
  const def = AGENTS.find((a) => a.id === agentId);
  if (!def) return { id: agentId, ok: false, computeMs: 0, summary: "unknown agent" };
  const outputs = new Map<string, AgentOutput>();
  const ctx = {
    input: { ...input, seed: input.seed ?? 42 },
    seed: input.seed ?? 42,
    outputs,
    markCompute: () => 0,
  };
  const t0 = performance.now();
  try {
    const r = await withTimeout(def.run(ctx), HARD_TIMEOUT_MS, def.name);
    return {
      id: agentId,
      ok: true,
      computeMs: Math.round((performance.now() - t0) * 10) / 10,
      summary: r.summary.slice(0, 140),
    };
  } catch (err) {
    return {
      id: agentId,
      ok: false,
      computeMs: Math.round((performance.now() - t0) * 10) / 10,
      summary: err instanceof Error ? err.message : "failed",
    };
  }
}
