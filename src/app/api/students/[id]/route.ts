import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { attempts, students } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/students/[id] — single student + full attempt evidence */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [student] = await db.select().from(students).where(eq(students.id, id));
  if (!student) return Response.json({ error: "not found" }, { status: 404 });
  const rows = await db
    .select()
    .from(attempts)
    .where(eq(attempts.studentId, id))
    .orderBy(desc(attempts.createdAt))
    .limit(300);
  return Response.json({
    ...student,
    attempts: rows.slice().reverse(),
  });
}

/** PATCH /api/students/[id] */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: { name?: string; grade?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim().length >= 2) patch.name = body.name.trim();
  if (typeof body.grade === "number" && body.grade >= 9 && body.grade <= 11) patch.grade = body.grade;
  if (!Object.keys(patch).length) return Response.json({ error: "nothing to update" }, { status: 400 });
  const [updated] = await db.update(students).set(patch).where(eq(students.id, id)).returning();
  if (!updated) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(updated);
}

/** DELETE /api/students/[id] */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [deleted] = await db.delete(students).where(eq(students.id, id)).returning();
  if (!deleted) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}
