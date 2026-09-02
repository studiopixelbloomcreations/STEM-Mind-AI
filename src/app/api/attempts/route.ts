import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attempts, sessions, students } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/attempts — persist one graded attempt + bump session/student state */
export async function POST(req: NextRequest) {
  let body: {
    sessionId?: string;
    studentId?: string;
    questionId?: string;
    subject?: string;
    topic?: string;
    kind?: string;
    correct?: boolean;
    stuck?: boolean;
    difficulty?: number;
    score?: number;
    timeMs?: number;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.studentId || !body.questionId || !body.subject || !body.topic || !body.kind) {
    return Response.json({ error: "studentId, questionId, subject, topic, kind are required" }, { status: 400 });
  }

  const [row] = await db
    .insert(attempts)
    .values({
      sessionId: body.sessionId ?? null,
      studentId: body.studentId,
      questionId: body.questionId,
      subject: body.subject,
      topic: body.topic,
      kind: body.kind,
      correct: !!body.correct,
      stuck: !!body.stuck,
      difficulty: body.difficulty ?? 3,
      score: body.score ?? (body.correct ? 1 : 0),
      timeMs: Math.max(0, Math.round(body.timeMs ?? 0)),
    })
    .returning();

  if (body.sessionId) {
    await db
      .update(sessions)
      .set({
        asked: sql`${sessions.asked} + 1`,
        correct: sql`${sessions.correct} + ${body.correct ? 1 : 0}`,
        stuck: sql`${sessions.stuck} + ${body.stuck ? 1 : 0}`,
        peakDifficulty: sql`GREATEST(${sessions.peakDifficulty}, ${body.difficulty ?? 3})`,
      })
      .where(eq(sessions.id, body.sessionId));
  }
  await db.update(students).set({ lastActiveAt: new Date() }).where(eq(students.id, body.studentId));

  return Response.json(row, { status: 201 });
}
