/**
 * Client helpers for driving the AI Council over the network.
 * - streamCouncil: full DAG run, NDJSON events as they happen
 * - probeCouncil:  fires one request per specialist concurrently (used by the
 *   landing-page council demo so every agent is its own in-flight request)
 */

import type { CouncilInput, CouncilPayload } from "@/agents/registry";
import type { CouncilEvent, PlanAgent } from "@/agents/runner";

export interface StreamHandlers {
  onPlan?: (agents: PlanAgent[], mode: string) => void;
  onStart?: (id: string) => void;
  onDone?: (id: string, ms: number, snippet: string) => void;
  onFail?: (id: string, error: string) => void;
  onPayload?: (payload: CouncilPayload) => void;
  onError?: (message: string) => void;
}

export async function streamCouncil(
  body: CouncilInput & { studentId?: string },
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch("/api/council", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    handlers.onError?.(`council request failed (${res.status})`);
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let ev: CouncilEvent;
      try {
        ev = JSON.parse(line) as CouncilEvent;
      } catch {
        continue;
      }
      switch (ev.type) {
        case "plan": handlers.onPlan?.(ev.agents, ev.mode); break;
        case "start": handlers.onStart?.(ev.id); break;
        case "done": handlers.onDone?.(ev.id, ev.ms, ev.snippet); break;
        case "fail": handlers.onFail?.(ev.id, ev.error); break;
        case "payload": handlers.onPayload?.(ev.payload); break;
        case "error": handlers.onError?.(ev.message); break;
      }
    }
  }
}

export interface ProbeResult {
  id: string;
  ok: boolean;
  computeMs: number;
  summary: string;
}

/** One concurrent fetch per agent — every specialist visible in the network
 *  tab as its own in-flight request, resolving independently. */
export async function probeCouncil(
  agentIds: string[],
  input: Partial<CouncilInput>,
  onEach: (r: ProbeResult) => void,
  signal?: AbortSignal
): Promise<void> {
  await Promise.allSettled(
    agentIds.map(async (id) => {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/council", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...input, mode: "demo", probe: id }),
          signal,
        });
        const r = (await res.json()) as ProbeResult;
        onEach({ ...r, computeMs: r.computeMs || Math.round((performance.now() - t0) * 10) / 10 });
      } catch {
        onEach({ id, ok: false, computeMs: 0, summary: "request failed" });
      }
    })
  );
}
