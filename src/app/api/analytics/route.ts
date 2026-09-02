import { NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { attempts, sessions, students } from "@/db/schema";
import { TOPICS } from "@/lib/curriculum";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/analytics — class-level aggregates for the Teacher Dashboard.
 * Students' per-attempt evidence is rolled into topic mastery, difficulty
 * trajectory, weekly activity and streaks.
 */
export async function GET(_req: NextRequest) {
  const [roster, rows, sessionRows] = await Promise.all([
    db.select().from(students).orderBy(desc(students.lastActiveAt)),
    db.select().from(attempts).orderBy(desc(attempts.createdAt)).limit(6000),
    db.select().from(sessions).orderBy(desc(sessions.startedAt)).limit(400),
  ]);

  const chronological = rows.slice().reverse();
  const now = Date.now();
  const dayMs = 86_400_000;

  const perStudent = roster.map((s) => {
    const a = chronological.filter((r) => r.studentId === s.id);
    const total = a.length;
    const correct = a.filter((x) => x.correct).length;

    let streak = 0;
    for (let i = a.length - 1; i >= 0; i--) {
      if (a[i].correct) streak++;
      else break;
    }

    const byTopic = new Map<string, { ok: number; n: number; dSum: number; stuckN: number }>();
    for (const x of a) {
      const e = byTopic.get(x.topic) ?? { ok: 0, n: 0, dSum: 0, stuckN: 0 };
      e.n++;
      e.dSum += x.difficulty;
      if (x.correct) e.ok++;
      if (x.stuck) e.stuckN++;
      byTopic.set(x.topic, e);
    }
    const topicMastery = [...byTopic.entries()].map(([topic, v]) => ({
      topic,
      title: TOPICS[topic]?.title ?? topic,
      mastery: v.n ? v.ok / v.n : 0,
      attempts: v.n,
      avgDifficulty: Math.round((v.dSum / v.n) * 10) / 10,
      stuckRate: v.n ? v.stuckN / v.n : 0,
    }));

    // weekly activity buckets (last 5 weeks)
    const weeks: { label: string; attempts: number; correct: number }[] = [];
    for (let w = 4; w >= 0; w--) {
      const start = now - (w + 1) * 7 * dayMs;
      const end = now - w * 7 * dayMs;
      const inWeek = a.filter((x) => {
        const t = new Date(x.createdAt).getTime();
        return t >= start && t < end;
      });
      weeks.push({
        label: w === 0 ? "This wk" : `${w}w ago`,
        attempts: inWeek.length,
        correct: inWeek.filter((x) => x.correct).length,
      });
    }

    // difficulty trajectory (rolling, chronological)
    const trajectory = a.slice(-24).map((x, i) => ({ i, d: x.difficulty, ok: x.correct }));

    const lastActive = a.length ? new Date(a[a.length - 1].createdAt).getTime() : null;
    return {
      id: s.id,
      name: s.name,
      grade: s.grade,
      hue: s.hue,
      lastActiveAt: lastActive ? new Date(lastActive).toISOString() : s.lastActiveAt,
      totalAttempts: total,
      correctRate: total ? correct / total : 0,
      streak,
      avgDifficulty: total ? Math.round((a.reduce((t, x) => t + x.difficulty, 0) / total) * 10) / 10 : 0,
      totalTimeMin: Math.round(a.reduce((t, x) => t + x.timeMs, 0) / 60000),
      stuckCount: a.filter((x) => x.stuck).length,
      topicMastery,
      weeks,
      trajectory,
      recent: a.slice(-8).reverse().map((x) => ({
        id: x.id,
        topic: x.topic,
        kind: x.kind,
        correct: x.correct,
        stuck: x.stuck,
        difficulty: x.difficulty,
        timeMs: x.timeMs,
        at: x.createdAt,
      })),
    };
  });

  const totals = {
    students: roster.length,
    attempts: chronological.length,
    sessions: sessionRows.length,
    correctRate: chronological.length
      ? chronological.filter((x) => x.correct).length / chronological.length
      : 0,
    activeThisWeek: perStudent.filter(
      (p) => p.lastActiveAt && now - new Date(p.lastActiveAt).getTime() < 7 * dayMs
    ).length,
  };

  return Response.json({ students: perStudent, totals });
}
