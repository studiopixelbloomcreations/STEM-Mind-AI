import { db } from "@/db";
import { attempts, sessions, students } from "@/db/schema";
import { BANK } from "@/lib/curriculum";
import { mulberry32, pick } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROSTER = [
  { name: "Senumi Perera", grade: 10, hue: 160 },
  { name: "Kavindu Fernando", grade: 11, hue: 210 },
  { name: "Ishara Bandara", grade: 9, hue: 95 },
  { name: "Thevindu Silva", grade: 10, hue: 25 },
];

/** POST /api/seed — idempotent demo roster + three weeks of attempt evidence */
export async function POST() {
  const existing = await db.select().from(students).limit(1);
  if (existing.length > 0) {
    return Response.json({ ok: true, seeded: false, message: "roster already exists" });
  }

  const created = await db.insert(students).values(ROSTER).returning();
  const rng = mulberry32(20260915);
  const now = Date.now();
  const dayMs = 86_400_000;

  const attemptRows: (typeof attempts.$inferInsert)[] = [];
  const sessionRows: (typeof sessions.$inferInsert)[] = [];

  created.forEach((student, si) => {
    const skillBase = [0.62, 0.48, 0.74, 0.55][si % 4];
    const growth = [0.012, 0.02, 0.008, 0.015][si % 4];
    const count = 34 + si * 7;
    for (let i = 0; i < count; i++) {
      const item = pick(rng, BANK);
      const daysAgo = Math.floor(rng() * 21);
      const skill = Math.min(0.92, skillBase + growth * (21 - daysAgo) * 0.4);
      const difficultyShift = (item.difficulty - 5) * 0.06;
      const correct = rng() < skill - difficultyShift;
      const stuck = !correct && rng() < 0.28;
      attemptRows.push({
        studentId: student.id,
        questionId: item.id,
        subject: item.subject,
        topic: item.topic,
        kind: item.kind,
        correct,
        stuck,
        difficulty: item.difficulty,
        score: correct ? 1 : 0,
        timeMs: 25_000 + Math.floor(rng() * 110_000),
        createdAt: new Date(now - daysAgo * dayMs - Math.floor(rng() * 8 * 3_600_000)),
      });
    }
    for (let sN = 0; sN < 4; sN++) {
      const daysAgo = Math.floor(rng() * 18);
      sessionRows.push({
        studentId: student.id,
        subject: ["physics", "chemistry", "maths"][Math.floor(rng() * 3)],
        topic: BANK[Math.floor(rng() * BANK.length)].topic,
        grade: student.grade,
        asked: 5 + Math.floor(rng() * 4),
        correct: 2 + Math.floor(rng() * 4),
        stuck: Math.floor(rng() * 3),
        peakDifficulty: 3 + Math.floor(rng() * 5),
        startedAt: new Date(now - daysAgo * dayMs - Math.floor(rng() * 5 * 3_600_000)),
        endedAt: new Date(now - daysAgo * dayMs),
      });
    }
  });

  // Link a share of attempts to sessions for realism
  const createdSessions = await db.insert(sessions).values(sessionRows).returning();
  created.forEach((student) => {
    const theirs = createdSessions.filter((s) => s.studentId === student.id);
    let cursor = 0;
    for (const row of attemptRows.filter((a) => a.studentId === student.id)) {
      if (rng() < 0.7 && theirs.length) {
        row.sessionId = theirs[cursor % theirs.length].id;
        cursor++;
      }
    }
  });

  await db.insert(attempts).values(attemptRows);
  return Response.json({
    ok: true,
    seeded: true,
    students: created.length,
    attempts: attemptRows.length,
    sessions: createdSessions.length,
  });
}
