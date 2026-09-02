"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Atom, FlaskConical, Loader2, Sigma } from "lucide-react";
import { AvatarDot, Button, Caps, Card, Chip, Meter } from "@/components/ui";
import { SUBJECTS, TOPICS } from "@/lib/curriculum";
import { cx, pct } from "@/lib/utils";

interface RosterStudent {
  id: string;
  name: string;
  grade: number;
  hue: number;
  stats: { totalAttempts: number; correctRate: number; streak: number; weakestTopic: string | null; avgDifficulty: number };
}
interface AnalyticsStudent {
  id: string;
  topicMastery: { topic: string; mastery: number; attempts: number }[];
  streak: number;
  totalAttempts: number;
  correctRate: number;
}

const SUBJECT_ICONS = { physics: Atom, chemistry: FlaskConical, maths: Sigma } as const;

export default function Hub() {
  const router = useRouter();
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [analytics, setAnalytics] = useState<{ students: AnalyticsStudent[] } | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>("physics");
  const [topic, setTopic] = useState<string>("motion");
  const [launching, setLaunching] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    (async () => {
      let list = (await fetch("/api/students").then((r) => r.json()).catch(() => [])) as RosterStudent[];
      if (Array.isArray(list) && list.length === 0) {
        setSeeding(true);
        await fetch("/api/seed", { method: "POST" }).catch(() => {});
        list = (await fetch("/api/students").then((r) => r.json()).catch(() => [])) as RosterStudent[];
        setSeeding(false);
      }
      if (Array.isArray(list)) {
        setRoster(list);
        const saved = sessionStorage.getItem("nexlearn.student");
        const found = list.find((s) => s.id === saved) ?? list[0];
        if (found) setStudentId(found.id);
      }
      fetch("/api/analytics").then((r) => r.json()).then(setAnalytics).catch(() => {});
    })();
  }, []);

  const student = roster.find((s) => s.id === studentId) ?? null;
  const me = analytics?.students.find((s) => s.id === studentId) ?? null;
  const mastery = useMemo(() => {
    const m = new Map<string, number>();
    me?.topicMastery.forEach((t) => m.set(t.topic, t.mastery));
    return m;
  }, [me]);

  const pick = (sId: string) => {
    setStudentId(sId);
    sessionStorage.setItem("nexlearn.student", sId);
  };

  const start = async () => {
    if (!studentId || launching) return;
    setLaunching(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId, subject, topic, grade: student?.grade ?? 10 }),
      });
      const s = await res.json();
      const q = new URLSearchParams({ session: s.id, subject, topic, student: studentId, name: student?.name ?? "" });
      router.push(`/app/quiz?${q.toString()}`);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 pb-40 pt-10 sm:px-10">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Caps volt>Learning hub</Caps>
          <h1 className="t-h1 mt-2">
            {student ? <>Quiet focus, {student.name.split(" ")[0]}.</> : "Learning hub"}
          </h1>
          <p className="t-sm mt-2 text-[var(--color-mid)]">
            Choose a subject, pick a topic — Nex and the council handle the rest.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {seeding && <Chip tone="volt"><Loader2 size={12} className="animate-spin" /> preparing demo classroom…</Chip>}
          {roster.map((s) => (
            <button
              key={s.id}
              onClick={() => pick(s.id)}
              className={cx(
                "flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 transition-all duration-200",
                s.id === studentId
                  ? "border-[var(--color-volt)] bg-[rgba(215,255,74,0.06)]"
                  : "border-[var(--color-line)] hover:border-[var(--color-line-strong)]"
              )}
              style={{ transitionTimingFunction: "var(--ease-settle)" }}
            >
              <AvatarDot name={s.name} hue={s.hue} size={30} />
              <span className="text-left">
                <span className="block font-display text-[0.82rem] font-semibold leading-tight">{s.name.split(" ")[0]}</span>
                <span className="label-caps block !text-[0.6rem]">grade {s.grade}</span>
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* stat strip */}
      {me && (
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-4">
          {[
            ["Attempts logged", `${me.totalAttempts}`],
            ["Lifetime accuracy", pct(me.correctRate)],
            ["Current streak", `${me.streak}`],
            ["Weakest topic", me.topicMastery.length ? (TOPICS[me.topicMastery.reduce((a, b) => (a.mastery < b.mastery ? a : b)).topic]?.title ?? "—") : "—"],
          ].map(([l, v]) => (
            <div key={l} className="bg-[var(--color-ink-1)] px-5 py-4">
              <Caps>{l}</Caps>
              <div className="num mt-1.5 truncate font-display text-xl font-semibold">{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* subject cards */}
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {SUBJECTS.map((s) => {
          const Icon = SUBJECT_ICONS[s.id as keyof typeof SUBJECT_ICONS] ?? Atom;
          const open = subject === s.id;
          return (
            <Card key={s.id} className={cx("overflow-hidden", open && "!border-[rgba(215,255,74,0.4)]")}>
              <button
                className="flex w-full items-start justify-between p-5 text-left"
                onClick={() => {
                  setSubject(s.id);
                  setTopic(s.topics[0]);
                }}
              >
                <div>
                  <Caps className={open ? "label-caps--volt" : ""}>{s.topics.length} units</Caps>
                  <h2 className="t-h3 mt-2">{s.title}</h2>
                  <p className="t-xs mt-2 leading-relaxed text-[var(--color-mid)]">{s.blurb}</p>
                </div>
                <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border", open ? "border-[rgba(215,255,74,0.4)] bg-[rgba(215,255,74,0.08)] text-[var(--color-volt)]" : "border-[var(--color-line)] text-[var(--color-low)]")}>
                  <Icon size={17} />
                </span>
              </button>

              {open && (
                <div className="border-t border-[var(--color-line)]">
                  {s.topics.map((t) => {
                    const meta = TOPICS[t];
                    const m = mastery.get(t);
                    const sel = topic === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setTopic(t)}
                        className={cx(
                          "flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors duration-200",
                          sel ? "bg-[rgba(215,255,74,0.05)]" : "hover:bg-[var(--color-ink-2)]"
                        )}
                      >
                        <span className={cx("h-2 w-2 shrink-0 rounded-full", sel ? "bg-[var(--color-volt)]" : "bg-[var(--color-ink-3)]")} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-[0.9rem] font-medium tracking-tight">{meta?.title ?? t}</span>
                          <span className="label-caps !text-[0.6rem]">{meta?.gradeBand} · {meta?.paperWeight}</span>
                        </span>
                        <span className="w-20">
                          <Meter value={m ?? 0} />
                          <span className="label-caps num mt-1 block text-right !text-[0.6rem]">{m != null ? pct(m) : "new"}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* launch panel */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-[var(--r-lg)] border border-[rgba(215,255,74,0.3)] bg-[rgba(215,255,74,0.04)] p-6">
        <div>
          <Caps volt>Next session</Caps>
          <div className="font-display mt-1.5 text-lg font-semibold tracking-tight">
            {SUBJECTS.find((s) => s.id === subject)?.title} — {TOPICS[topic]?.title}
          </div>
          <p className="t-xs mt-1 text-[var(--color-mid)]">
            Adaptive · {mastery.has(topic) ? `starting near difficulty ${Math.max(1, Math.round((1 - (mastery.get(topic) ?? 0)) * 10))}` : "calibration from scratch"} · Nex present throughout
          </p>
        </div>
        <Button onClick={start} disabled={!studentId || launching}>
          {launching ? <Loader2 size={15} className="animate-spin" /> : null}
          Start adaptive session <ArrowRight size={15} />
        </Button>
      </div>
    </main>
  );
}
