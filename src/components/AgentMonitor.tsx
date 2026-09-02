"use client";

/**
 * AGENT ACTIVITY MONITOR — the observable proof that the NexLearn council is
 * real, parallel infrastructure. Every specialist is visible simultaneously
 * with its own live status (queued → running → done), per-agent timing and a
 * streaming snippet of its actual output as it resolves.
 *
 * Consumed by: the landing Council section, the Quiz generation flow, the
 * Teacher Dashboard transparency panel.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, X, Radio } from "lucide-react";
import type { CouncilInput, CouncilPayload } from "@/agents/registry";
import type { PlanAgent } from "@/agents/runner";
import { probeCouncil, streamCouncil } from "@/lib/council-client";
import { cx, fmtMs } from "@/lib/utils";

export type AgentStatus = "queued" | "running" | "done" | "failed";

export interface AgentState extends PlanAgent {
  status: AgentStatus;
  ms?: number;
  snippet?: string;
  error?: string;
}

export interface CouncilRunState {
  phase: "idle" | "running" | "done" | "error";
  agents: AgentState[];
  activeCount: number;
  doneCount: number;
  elapsedMs: number;
  totalMs?: number;
  payload?: CouncilPayload;
  error?: string;
}

export function useCouncilRun() {
  const [state, setState] = useState<CouncilRunState>({
    phase: "idle", agents: [], activeCount: 0, doneCount: 0, elapsedMs: 0,
  });
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const tick = useCallback(() => {
    setState((s) =>
      s.phase === "running" ? { ...s, elapsedMs: performance.now() - startRef.current } : s
    );
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const patch = useCallback((id: string, p: Partial<AgentState>) => {
    setState((s) => {
      const agents = s.agents.map((a) => (a.id === id ? { ...a, ...p } : a));
      const activeCount = agents.filter((a) => a.status === "running").length;
      const doneCount = agents.filter((a) => a.status === "done" || a.status === "failed").length;
      return { ...s, agents, activeCount, doneCount };
    });
  }, []);

  const begin = useCallback(
    (planned: PlanAgent[]) => {
      startRef.current = performance.now();
      setState({
        phase: "running",
        agents: planned.map((a) => ({ ...a, status: "queued" as AgentStatus })),
        activeCount: 0,
        doneCount: 0,
        elapsedMs: 0,
      });
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    },
    [tick]
  );

  /** Full streamed DAG run (in-app use). */
  const run = useCallback(
    (body: CouncilInput & { studentId?: string }): Promise<CouncilPayload | undefined> => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      return new Promise((resolve) => {
        streamCouncil(
          body,
          {
            onPlan: (agents) => begin(agents),
            onStart: (id) => patch(id, { status: "running" }),
            onDone: (id, ms, snippet) => patch(id, { status: "done", ms, snippet }),
            onFail: (id, error) => patch(id, { status: "failed", error }),
            onPayload: (payload) => {
              cancelAnimationFrame(rafRef.current);
              setState((s) => ({ ...s, phase: "done", totalMs: performance.now() - startRef.current, payload, elapsedMs: performance.now() - startRef.current }));
              resolve(payload);
            },
            onError: (message) => {
              cancelAnimationFrame(rafRef.current);
              setState((s) => ({ ...s, phase: "error", error: message }));
              resolve(undefined);
            },
          },
          ctrl.signal
        );
      });
    },
    [begin, patch]
  );

  /** Concurrent per-agent probe burst (landing-page demo). */
  const probe = useCallback(
    (input: Partial<CouncilInput>, planned: PlanAgent[]) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      begin(planned);
      planned.forEach((a) => patch(a.id, { status: "running" }));
      let settled = 0;
      return new Promise<void>((resolve) => {
        probeCouncil(
          planned.map((a) => a.id),
          input,
          (r) => {
            patch(r.id, {
              status: r.ok ? "done" : "failed",
              ms: r.computeMs,
              snippet: r.summary,
              error: r.ok ? undefined : r.summary,
            });
            settled++;
            if (settled === planned.length) {
              cancelAnimationFrame(rafRef.current);
              setState((s) => ({ ...s, phase: "done", totalMs: performance.now() - startRef.current }));
              resolve();
            }
          },
          ctrl.signal
        );
      });
    },
    [begin, patch]
  );

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); abortRef.current?.abort(); }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    abortRef.current?.abort();
    setState({ phase: "idle", agents: [], activeCount: 0, doneCount: 0, elapsedMs: 0 });
  }, []);

  return { state, run, probe, reset };
}

const LAYER_LABEL = ["evidence sweep", "construction", "synthesis", "fusion"];

export function AgentMonitor({
  state,
  className,
  dense,
}: {
  state: CouncilRunState;
  className?: string;
  dense?: boolean;
}) {
  const running = state.phase === "running";
  const summary = useMemo(() => {
    if (state.phase === "idle") return "awaiting dispatch";
    if (state.phase === "error") return "run aborted";
    if (running) return `${state.activeCount} specialist${state.activeCount === 1 ? "" : "s"} in flight · ${state.doneCount}/${state.agents.length} resolved`;
    return `${state.agents.length}/${state.agents.length} resolved in ${fmtMs(state.totalMs ?? state.elapsedMs)}`;
  }, [state, running]);

  return (
    <div className={cx("card overflow-hidden", className)} aria-live="polite">
      {/* monitor header — trading-terminal register */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-ink-2)] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className={cx("relative flex h-2 w-2")}>
            <span className={cx("absolute h-2 w-2 rounded-full", running ? "anim-blink-dot bg-[var(--color-volt)]" : state.phase === "done" ? "bg-[var(--color-volt)]" : "bg-[var(--color-low)]")} />
          </span>
          <span className="label-caps !text-[var(--color-mid)]">AI council · live execution</span>
        </div>
        <div className="label-caps num flex items-center gap-3">
          <span className={running ? "text-[var(--color-volt)]" : ""}>{summary}</span>
          <span className="hidden sm:inline">{fmtMs(state.elapsedMs)}</span>
        </div>
      </div>

      {/* agent grid — every specialist simultaneously visible */}
      <ul className={cx("grid gap-px bg-[var(--color-line)]", dense ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        {state.agents.map((a) => (
          <AgentRow key={a.id} agent={a} dense={dense} />
        ))}
        {state.agents.length === 0 && (
          <li className="bg-[var(--color-ink-1)] px-4 py-8 text-center t-sm text-[var(--color-low)] sm:col-span-2">
            Stand by — dispatch a run to watch the council work.
          </li>
        )}
      </ul>
    </div>
  );
}

function AgentRow({ agent: a, dense }: { agent: AgentState; dense?: boolean }) {
  return (
    <li
      className={cx(
        "relative overflow-hidden bg-[var(--color-ink-1)] transition-colors duration-300",
        a.status === "running" && "bg-[var(--color-ink-2)]"
      )}
    >
      {/* scanline while running */}
      {a.status === "running" && (
        <span className="anim-scan pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[rgba(215,255,74,0.06)] to-transparent" aria-hidden />
      )}
      <div className={cx("flex items-center gap-3", dense ? "px-3 py-2" : "px-4 py-2.5")}>
        <StatusOrb status={a.status} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-display text-[0.82rem] font-semibold tracking-tight">
              {a.name}
              <span className="label-caps ml-2 hidden sm:inline" title={`layer ${a.layer}: ${LAYER_LABEL[a.layer] ?? ""}`}>
                L{a.layer}·{a.costClass}
              </span>
            </span>
            <span className={cx("num label-caps shrink-0", a.status === "done" && "text-[var(--color-volt-dim)]", a.status === "failed" && "text-[var(--color-coral)]")}>
              {a.status === "done" ? fmtMs(a.ms ?? 0) : a.status === "failed" ? "failed" : a.status === "running" ? "running" : "queued"}
            </span>
          </div>
          {!dense && (
            <div className="t-xs mt-0.5 truncate text-[var(--color-low)]">{a.role}</div>
          )}
          {(a.status === "done" || a.status === "failed") && a.snippet && (
            <div className={cx("num mt-1 truncate font-mono text-[0.7rem]", a.status === "failed" ? "text-[var(--color-coral)]" : "text-[var(--color-mid)]")}>
              {a.status === "failed" ? a.error : a.snippet}
            </div>
          )}
          {a.status === "running" && (
            <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[var(--color-ink-3)]">
              <span className="anim-scan block h-full w-1/4 rounded-full bg-[var(--color-volt)] opacity-70" />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function StatusOrb({ status }: { status: AgentStatus }) {
  if (status === "done")
    return (
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[rgba(215,255,74,0.12)] text-[var(--color-volt)]">
        <Check size={11} strokeWidth={3} />
      </span>
    );
  if (status === "failed")
    return (
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[rgba(255,90,60,0.12)] text-[var(--color-coral)]">
        <X size={11} strokeWidth={3} />
      </span>
    );
  if (status === "running")
    return (
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[var(--color-volt)]">
        <Loader2 size={15} className="animate-spin" style={{ animationDuration: "0.9s" }} />
      </span>
    );
  return (
    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[var(--color-low)]">
      <Radio size={13} />
    </span>
  );
}
