import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { attempts, students } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/students — roster with per-student rolled-up evidence */
export async function GET() {
  const roster = await db.select().from(students).orderBy(desc(students.lastActiveAt));
  const rows = await db.select().from(attempts).orderBy(desc(attempts.createdAt)).limit(4000);

  const byStudent = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byStudent.get(r.studentId) ?? [];
    list.push(r);
    byStudent.set(r.studentId, list);
  }

  const result = roster.map((s) => {
    const a = (byStudent.get(s.id) ?? []).slice().reverse(); // chronological
    const total = a.length;
    const correct = a.filter((x) => x.correct).length;
    let streak = 0;
    for (let i = a.length - 1; i >= 0; i--) {
      if (a[i].correct) streak++;
      else break;
    }
    const byTopic = new Map<string, { ok: number; n: number }>();
    for (const x of a) {
      const e = byTopic.get(x.topic) ?? { ok: 0, n: 0 };
      e.n++;
      if (x.correct) e.ok++;
      byTopic.set(x.topic, e);
    }
    let weakest: string | null = null;
    let weakestRate = 1;
    for (const [t, v] of byTopic) {
      const rate = v.ok / v.n;
      if (v.n >= 2 && rate < weakestRate) {
        weakestRate = rate;
        weakest = t;
      }
    }
    const avgDifficulty = total ? a.reduce((sum, x) => sum + x.difficulty, 0) / total : 0;
    return {
      ...s,
      stats: {
        totalAttempts: total,
        correctRate: total ? correct / total : 0,
        streak,
        weakestTopic: weakest,
        avgDifficulty: Math.round(avgDifficulty * 10) / 10,
      },
    };
  });

  return Response.json(result);
}

/** POST /api/students — teacher provisions a student */
export async function POST(req: NextRequest) {
  let body: { name?: string; grade?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  const grade = Number(body.grade);
  if (!name || name.length < 2) return Response.json({ error: "name is required" }, { status: 400 });
  if (!grade || grade < 9 || grade > 11)
    return Response.json({ error: "grade must be 9, 10 or 11" }, { status: 400 });

  const hue = Math.floor(Math.random() * 360);
  const [created] = await db.insert(students).values({ name, grade, hue }).returning();
  return Response.json(created, { status: 201 });
}
