import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/sessions — open a learning session */
export async function POST(req: NextRequest) {
  let body: { studentId?: string; subject?: string; topic?: string; grade?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.studentId || !body.subject || !body.topic) {
    return Response.json({ error: "studentId, subject and topic are required" }, { status: 400 });
  }
  const [created] = await db
    .insert(sessions)
    .values({
      studentId: body.studentId,
      subject: body.subject,
      topic: body.topic,
      grade: body.grade ?? 10,
    })
    .returning();
  return Response.json(created, { status: 201 });
}

/** PATCH /api/sessions — close/update counters */
export async function PATCH(req: NextRequest) {
  let body: {
    id?: string;
    asked?: number;
    correct?: number;
    stuck?: number;
    peakDifficulty?: number;
    close?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  for (const k of ["asked", "correct", "stuck", "peakDifficulty"] as const) {
    if (typeof body[k] === "number") patch[k] = body[k];
  }
  if (body.close) patch.endedAt = new Date();
  const [updated] = await db.update(sessions).set(patch).where(eq(sessions.id, body.id)).returning();
  if (!updated) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(updated);
}
