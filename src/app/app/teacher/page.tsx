"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Play, Plus, Trash2, UserRound } from "lucide-react";
import { AgentMonitor, useCouncilRun } from "@/components/AgentMonitor";
import { AvatarDot, Button, Caps, Card, Chip, EmptyState, Field, Meter, Modal, SelectInput, Sparkline, Stat, TextInput } from "@/components/ui";
import { COUNCIL_PLAN } from "@/agents/plan";
import { TOPICS } from "@/lib/curriculum";
import { cx, fmtTime, pct } from "@/lib/utils";

interface TopicMastery { topic: string; title: string; mastery: number; attempts: number; avgDifficulty: number; stuckRate: number; }
interface RecentAttempt { id: number; topic: string; kind: string; correct: boolean; stuck: boolean; difficulty: number; timeMs: number; at: string; }
interface DashStudent {
  id: string; name: string; grade: number; hue: number; lastActiveAt: string;
  totalAttempts: number; correctRate: number; streak: number; avgDifficulty: number;
  totalTimeMin: number; stuckCount: number; topicMastery: TopicMastery[];
  weeks: { label: string; attempts: number; correct: number }[];
  trajectory: { i: number; d: number; ok: boolean }[];
  recent: RecentAttempt[];
}
interface Analytics { students: DashStudent[]; totals: { students: number; attempts: number; sessions: number; correctRate: number; activeThisWeek: number }; }

export default function TeacherDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showCouncil, setShowCouncil] = useState(false);
  const council = useCouncilRun();

  const load = useCallback(async () => {
    const d = (await fetch("/api/analytics").then((r) => r.json()).catch(() => null)) as Analytics | null;
    setData(d);
    setLoading(false);
    setSelected((cur) => cur ?? d?.students[0]?.id ?? null);
  }, []);

  useEffect(() => { load(); }, [load]);

  const seedDemo = async () => {
    setSeeding(true);
    await fetch("/api/seed", { method: "POST" }).catch(() => {});
    await load();
    setSeeding(false);
  };

  const removeStudent = async (id: string) => {
    if (!confirm("Remove this student and all their attempt history?")) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" }).catch(() => {});
    if (selected === id) setSelected(null);
    await load();
  };

  const student = data?.students.find((s) => s.id === selected) ?? null;

  return (
    <main className="mx-auto max-w-[1280px] px-6 pb-28 pt-10 sm:px-10">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Caps volt>Teacher dashboard</Caps>
          <h1 className="t-h1 mt-2">Control room</h1>
          <p className="t-sm mt-2 text-[var(--color-mid)]">Every attempt your students make, turned into an early-warning system.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="quiet" size="sm" onClick={() => setShowCouncil((v) => !v)}>
            <Play size={13} /> Council diagnostics
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add student
          </Button>
        </div>
      </header>

      {/* totals strip */}
      <div className="mt-8 grid grid-cols-2 gap-8 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-ink-1)] p-6 sm:grid-cols-5">
        <Stat label="Students" value={data ? `${data.totals.students}` : "—"} accent />
        <Stat label="Active this week" value={data ? `${data.totals.activeThisWeek}` : "—"} />
        <Stat label="Graded attempts" value={data ? `${data.totals.attempts}` : "—"} />
        <Stat label="Sessions" value={data ? `${data.totals.sessions}` : "—"} />
        <Stat label="Class accuracy" value={data ? pct(data.totals.correctRate) : "—"} />
      </div>

      {showCouncil && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <Caps>System transparency — run the full council on demand</Caps>
            <Button size="sm" variant="ghost" onClick={() => council.probe({ topic: "trigonometry", subject: "maths", grade: 11 }, COUNCIL_PLAN)} disabled={council.state.phase === "running"}>
              <Play size={13} /> Run diagnostics
            </Button>
          </div>
          <AgentMonitor state={council.state} dense />
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex justify-center text-[var(--color-low)]"><Loader2 className="animate-spin" /></div>
      ) : !data || data.students.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No students yet"
            body="Provision your first student — or load the demo classroom to explore the dashboard with three weeks of realistic attempt data."
            action={
              <Button onClick={seedDemo} disabled={seeding}>
                {seeding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Load demo classroom
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* roster */}
          <div className="lg:col-span-5">
            <Caps className="mb-3">Roster — weakest signal first</Caps>
            <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--color-line)]">
              {data.students
                .slice()
                .sort((a, b) => a.correctRate - b.correctRate)
                .map((s) => {
                  const weak = s.topicMastery.filter((t) => t.mastery < 0.55 && t.attempts >= 3);
                  const on = selected === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s.id)}
                      className={cx(
                        "flex w-full items-center gap-4 border-b border-[var(--color-line)] px-4 py-3.5 text-left transition-colors duration-200 last:border-b-0",
                        on ? "bg-[rgba(215,255,74,0.05)]" : "bg-[var(--color-ink-1)] hover:bg-[var(--color-ink-2)]"
                      )}
                    >
                      <AvatarDot name={s.name} hue={s.hue} size={38} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-display text-[0.95rem] font-semibold tracking-tight">{s.name}</span>
                          <span className="chip !py-0 !text-[0.62rem]">G{s.grade}</span>
                          {weak.length > 0 && <span className="chip chip--coral !py-0 !text-[0.62rem]">{weak.length} weak</span>}
                        </span>
                        <span className="mt-1.5 flex items-center gap-3">
                          <Meter value={s.correctRate} danger={s.correctRate < 0.45} />
                        </span>
                      </span>
                      <span className="num text-right">
                        <span className="block font-display text-lg font-semibold">{pct(s.correctRate)}</span>
                        <span className="label-caps !text-[0.6rem]">{s.totalAttempts} attempts</span>
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* detail */}
          <div className="lg:col-span-7">
            {student ? (
              <StudentDetail student={student} onRemove={() => removeStudent(student.id)} />
            ) : (
              <Card className="flex h-full min-h-[320px] items-center justify-center p-10 text-center">
                <div>
                  <UserRound className="mx-auto text-[var(--color-low)]" />
                  <p className="t-sm mt-3 text-[var(--color-low)]">Select a student to inspect their evidence.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} />
    </main>
  );
}

/* ── Per-student evidence panel ───────────────────────────────────────────── */

function StudentDetail({ student: s, onRemove }: { student: DashStudent; onRemove: () => void }) {
  const sparkMax = useMemo(() => Math.max(1, ...s.weeks.map((w) => w.attempts)), [s.weeks]);
  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AvatarDot name={s.name} hue={s.hue} size={48} />
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">{s.name}</h2>
              <div className="t-xs mt-0.5 text-[var(--color-low)]">
                Grade {s.grade} · last active {s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleDateString() : "—"} · {s.totalTimeMin} min total
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Chip tone="volt">streak {s.streak}</Chip>
            <Chip>θ {s.avgDifficulty}/10</Chip>
            <Chip tone="coral">{s.stuckCount}× stuck</Chip>
            <button onClick={onRemove} aria-label="Remove student" className="btn btn--quiet btn--sm !px-2.5 hover:!border-[rgba(255,90,60,0.5)]">
              <Trash2 size={13} className="text-[var(--color-coral)]" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div>
            <Caps className="mb-2">Difficulty trajectory</Caps>
            <Sparkline data={s.trajectory.map((t) => t.d)} width={150} height={40} />
            <div className="t-xs mt-1 text-[var(--color-low)]">last {s.trajectory.length} items</div>
          </div>
          <div>
            <Caps className="mb-2">Weekly volume</Caps>
            <div className="flex h-10 items-end gap-1.5">
              {s.weeks.map((w) => (
                <div key={w.label} className="flex w-6 flex-col items-center gap-1">
                  <span
                    className="w-full rounded-sm bg-[var(--color-volt)]"
                    style={{ height: `${(w.attempts / sparkMax) * 36 + 2}px`, opacity: 0.35 + (w.attempts / sparkMax) * 0.65 }}
                    title={`${w.label}: ${w.attempts}`}
                  />
                  <span className="label-caps !text-[0.52rem]">{w.label.replace(" ago", "")}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Caps className="mb-2">Focus flag</Caps>
            {(() => {
              const worst = s.topicMastery.filter((t) => t.attempts >= 2).sort((a, b) => a.mastery - b.mastery)[0];
              return worst ? (
                <>
                  <div className="font-display text-[0.95rem] font-semibold leading-tight text-[var(--color-coral)]">{worst.title}</div>
                  <div className="t-xs mt-1 text-[var(--color-low)]">{pct(worst.mastery)} mastery · stuck {pct(worst.stuckRate)} of the time</div>
                </>
              ) : (
                <div className="t-sm text-[var(--color-low)]">Not enough evidence yet.</div>
              );
            })()}
          </div>
        </div>
      </Card>

      {/* topic mastery grid */}
      <Card className="p-6">
        <Caps className="mb-4">Topic mastery — evidence-weighted</Caps>
        <div className="space-y-3">
          {s.topicMastery.length === 0 && <p className="t-sm text-[var(--color-low)]">No attempts yet.</p>}
          {s.topicMastery
            .slice()
            .sort((a, b) => a.mastery - b.mastery)
            .map((t) => (
              <div key={t.topic} className="flex items-center gap-4">
                <span className={cx("h-2.5 w-2.5 shrink-0 rounded-[3px]", t.mastery >= 0.7 ? "bg-[var(--color-volt)]" : t.mastery >= 0.5 ? "bg-[#e8c96a]" : "bg-[var(--color-coral)]")} />
                <span className="w-40 truncate font-display text-[0.88rem] font-medium">{t.title}</span>
                <Meter value={t.mastery} danger={t.mastery < 0.5} />
                <span className="num label-caps w-24 shrink-0 text-right">
                  {pct(t.mastery)} · d{t.avgDifficulty}
                </span>
              </div>
            ))}
        </div>
      </Card>

      {/* recent attempts */}
      <Card className="p-6">
        <Caps className="mb-4">Latest attempts</Caps>
        <ul className="divide-y divide-[var(--color-line)]">
          {s.recent.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <span className={cx("h-2 w-2 shrink-0 rounded-full", r.correct ? "bg-[var(--color-volt)]" : "bg-[var(--color-coral)]")} />
              <span className="t-sm w-36 truncate text-[var(--color-hi)]">{TOPICS[r.topic]?.title ?? r.topic}</span>
              <span className="chip !py-0 !text-[0.6rem]">{r.kind}</span>
              <span className="chip !py-0 !text-[0.6rem]">d{r.difficulty}</span>
              {r.stuck && <span className="chip chip--coral !py-0 !text-[0.6rem]">stuck</span>}
              <span className="num label-caps ml-auto">{fmtTime(r.timeMs / 1000)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ── Add student modal ────────────────────────────────────────────────────── */

function AddStudentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, grade }),
    }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) {
      setError(res ? ((await res.json()).error ?? "failed") : "network error");
      return;
    }
    setName("");
    onClose();
    await onCreated();
  };

  return (
    <Modal open={open} onClose={onClose} title="Provision a student">
      <div className="space-y-5">
        <Field label="Full name" hint="As they'll see it in the learning hub.">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Senumi Perera" autoFocus />
        </Field>
        <Field label="Grade">
          <SelectInput value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
            <option value={9}>Grade 9</option>
            <option value={10}>Grade 10</option>
            <option value={11}>Grade 11</option>
          </SelectInput>
        </Field>
        {error && <p className="t-sm text-[var(--color-coral)]">{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={busy || name.trim().length < 2}>
            {busy && <Loader2 size={13} className="animate-spin" />} Add student
          </Button>
        </div>
      </div>
    </Modal>
  );
}
