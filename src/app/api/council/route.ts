import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { attempts } from "@/db/schema";
import { CouncilInput } from "@/agents/registry";
import { runCouncil, probeAgent, demoHistory, CouncilEvent } from "@/agents/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/council
 * Body: CouncilInput & { studentId?: string, probe?: string }
 *   - probe=<agentId>  → single agent, raw timing, JSON response
 *   - otherwise        → full DAG run streamed as NDJSON CouncilEvents
 */
export async function POST(req: NextRequest) {
  let body: (CouncilInput & { studentId?: string; probe?: string }) | null = null;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body || !body.mode) {
    return Response.json({ error: "mode is required" }, { status: 400 });
  }

  const input: CouncilInput = {
    mode: body.mode,
    subject: body.subject ?? "physics",
    topic: body.topic ?? "motion",
    grade: body.grade ?? 10,
    studentName: body.studentName,
    askedIds: body.askedIds ?? [],
    seed: body.seed,
    questionId: body.questionId,
    answer: body.answer,
    stuckRequested: body.stuckRequested,
    utterance: body.utterance,
    history: body.history,
  };

  // Pull real evidence server-side when a student is attached.
  if (!input.history && body.studentId && body.mode !== "demo") {
    try {
      const rows = await db
        .select()
        .from(attempts)
        .where(eq(attempts.studentId, body.studentId))
        .orderBy(desc(attempts.createdAt))
        .limit(60);
      input.history = rows.reverse().map((r) => ({
        questionId: r.questionId,
        topic: r.topic,
        kind: r.kind,
        correct: r.correct,
        stuck: r.stuck,
        difficulty: r.difficulty,
        timeMs: r.timeMs,
      }));
    } catch {
      input.history = [];
    }
  }
  if (!input.history) input.history = demoHistory(input.seed ?? 7);

  // Single-agent probe — landing-page council demo fires 14 of these at once.
  if (body.probe) {
    const result = await probeAgent(body.probe, input);
    return Response.json(result);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (e: CouncilEvent) => {
        try {
          controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
        } catch {
          /* client disconnected */
        }
      };
      try {
        await runCouncil(input, emit);
      } catch (err) {
        emit({ type: "error", message: err instanceof Error ? err.message : "council failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
