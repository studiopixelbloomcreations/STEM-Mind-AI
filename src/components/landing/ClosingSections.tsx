"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Eye, ShieldCheck } from "lucide-react";
import { Reveal, Stat } from "@/components/ui";

/**
 * OUTCOMES (measurement-first, no invented numbers) → FOR TEACHERS (the
 * deliberate light passage) → ACCESS → editorial FOOTER.
 */

interface Totals {
  students: number;
  attempts: number;
  sessions: number;
  correctRate: number;
  activeThisWeek: number;
}

export default function ClosingSections() {
  return (
    <>
      <Outcomes />
      <Teachers />
      <Access />
      <Footer />
    </>
  );
}

/* ── Proof / outcomes ─────────────────────────────────────────────────────── */

function Outcomes() {
  const [totals, setTotals] = useState<Totals | null>(null);
  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.totals && setTotals(d.totals))
      .catch(() => {});
  }, []);

  return (
    <section className="border-t border-[var(--color-line)] py-24 sm:py-32">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
        <Reveal>
          <div className="label-caps label-caps--volt mb-5">Proof, not promises</div>
          <h2 className="t-h1 max-w-[18ch]">We measure understanding, not engagement.</h2>
          <p className="t-body-lg mt-6 max-w-[56ch] text-[var(--color-mid)]">
            No streaks-for-streaks’-sake, no minutes-watched vanity metrics. NexLearn
            tracks three numbers per student, and we’d rather show you the instrument
            than invent the result.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-line)] md:grid-cols-3">
          {[
            ["01", "Mastery growth", "Per-topic mastery, recomputed from raw attempts after every session. A number that can only move when understanding does."],
            ["02", "Time-to-understanding", "From first “I’m stuck” to the first independent correct answer on a cousin question. The single most honest measure of teaching."],
            ["03", "Adaptive accuracy", "How often the council’s chosen difficulty lands in the productive-struggle band. Calibration quality, measured honestly."],
          ].map(([n, t, b], i) => (
            <Reveal key={n} delay={i * 90} className="bg-[var(--color-ink-1)]">
              <div className="h-full p-7 sm:p-9">
                <div className="num font-display text-sm font-semibold text-[var(--color-volt)]">{n}</div>
                <h3 className="t-h3 mt-4">{t}</h3>
                <p className="t-sm mt-3 leading-relaxed text-[var(--color-mid)]">{b}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {totals && totals.attempts > 0 && (
          <Reveal delay={150}>
            <div className="mt-8 grid grid-cols-2 gap-8 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-ink-1)] p-7 sm:grid-cols-4 sm:p-8">
              <Stat label="Live demo classroom" value={`${totals.students}`} sub="teacher-provisioned students" accent />
              <Stat label="Graded attempts" value={`${totals.attempts}`} sub="real rows in Postgres" />
              <Stat label="Sessions" value={`${totals.sessions}`} sub={`${totals.activeThisWeek} active this week`} />
              <Stat label="Correct rate" value={`${Math.round(totals.correctRate * 100)}%`} sub="across all topics" />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ── For teachers — the deliberate light passage ─────────────────────────── */

function Teachers() {
  return (
    <section id="teachers" className="bg-[var(--color-paper)] py-24 text-[var(--color-paper-ink)] sm:py-32">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="label-caps mb-5 !text-[rgba(17,22,15,0.55)]">The control room</div>
              <h2 className="t-h1 max-w-[16ch]">You teach thirty students. NexLearn watches each one.</h2>
              <p className="t-body-lg mt-6 max-w-[46ch] text-[var(--color-paper-mid)]">
                Thirty students means thirty different stuck-points, usually at the same
                time. The Teacher Dashboard turns every attempt into an early-warning
                system: who is quietly lost, which topic is sinking the class, and who
                is ready for harder material — before the exam finds out.
              </p>
            </Reveal>
            <ul className="mt-10 space-y-5">
              {[
                [Eye, "Weak-area detection", "Per-student, per-topic mastery with attempt-level evidence — not vibes."],
                [BarChart3, "Trajectories, not snapshots", "Difficulty ceilings and weekly accuracy, trending over weeks."],
                [ShieldCheck, "Full transparency", "Watch the 15-agent council work on your students' questions, live."],
              ].map(([Icon, t, b], i) => {
                const I = Icon as typeof Eye;
                return (
                  <Reveal key={t as string} delay={i * 80}>
                    <li className="flex gap-4">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(17,22,15,0.18)]">
                        <I size={16} />
                      </span>
                      <div>
                        <div className="font-display font-semibold tracking-tight">{t as string}</div>
                        <p className="t-sm mt-1 text-[var(--color-paper-mid)]">{b as string}</p>
                      </div>
                    </li>
                  </Reveal>
                );
              })}
            </ul>
            <Reveal delay={260}>
              <Link href="/app/teacher" className="btn mt-10" style={{ background: "var(--color-paper-ink)", color: "var(--color-paper)" }}>
                Open the dashboard <ArrowRight size={15} />
              </Link>
            </Reveal>
          </div>

          {/* dashboard preview frame — code-drawn */}
          <div className="lg:col-span-7">
            <Reveal delay={140}>
              <div className="overflow-hidden rounded-[var(--r-lg)] border border-[rgba(17,22,15,0.16)] bg-white shadow-[0_24px_80px_rgba(17,22,15,0.18)]">
                <div className="flex items-center justify-between border-b border-[rgba(17,22,15,0.1)] px-5 py-3">
                  <span className="label-caps !text-[rgba(17,22,15,0.5)]">teacher dashboard · grade 10 · this week</span>
                  <span className="chip !border-[rgba(17,22,15,0.2)] !text-[var(--color-paper-mid)]">live</span>
                </div>
                <div className="grid grid-cols-3 gap-px bg-[rgba(17,22,15,0.08)]">
                  {[
                    ["Class accuracy", "71%", "+6 pts vs last wk"],
                    ["Quietly stuck", "3 students", "needs attention"],
                    ["Avg. difficulty", "5.4 / 10", "rising steadily"],
                  ].map(([l, v, s]) => (
                    <div key={l} className="bg-white p-5">
                      <div className="label-caps !text-[rgba(17,22,15,0.45)]">{l}</div>
                      <div className="num font-display mt-2 text-2xl font-semibold">{v}</div>
                      <div className="t-xs mt-1 text-[var(--color-paper-mid)]">{s}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-5">
                  <div className="label-caps mb-3 !text-[rgba(17,22,15,0.45)]">topic mastery heatmap</div>
                  <div className="space-y-2">
                    {[
                      ["Motion", [0.9, 0.8, 0.85, 0.6, 0.9, 0.75]],
                      ["Forces", [0.7, 0.65, 0.4, 0.55, 0.8, 0.6]],
                      ["Mole concept", [0.45, 0.3, 0.5, 0.35, 0.55, 0.4]],
                      ["Quadratics", [0.8, 0.7, 0.6, 0.75, 0.85, 0.7]],
                    ].map(([t, row]) => (
                      <div key={t as string} className="flex items-center gap-3">
                        <span className="t-xs w-24 shrink-0 text-[var(--color-paper-mid)]">{t as string}</span>
                        <div className="grid flex-1 grid-cols-6 gap-1">
                          {(row as number[]).map((v, i) => (
                            <span
                              key={i}
                              className="h-5 rounded-[4px]"
                              style={{
                                background:
                                  v >= 0.7
                                    ? `color-mix(in oklab, #4c7a12 ${Math.round(v * 100)}%, #eef2e6)`
                                    : v >= 0.5
                                      ? "#e8c96a"
                                      : "#e0704f",
                                opacity: 0.5 + v * 0.5,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Access — honest, no dark patterns ────────────────────────────────────── */

function Access() {
  return (
    <section className="border-t border-[var(--color-line)] py-24 sm:py-32">
      <div className="mx-auto max-w-[900px] px-6 text-center sm:px-10">
        <Reveal>
          <div className="label-caps label-caps--volt mb-5">Access</div>
          <h2 className="t-h1">Free for early-adopter classrooms.</h2>
          <p className="t-body-lg mx-auto mt-6 max-w-[52ch] text-[var(--color-mid)]">
            We’re onboarding Sri Lankan schools in cohorts while the council is tuned
            against real classrooms. No ads. No student data sold, ever. Teachers own
            their rosters and can export everything, always.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/app" className="btn btn--primary">
              Open the app <ArrowRight size={15} />
            </Link>
            <a href="#council" className="btn btn--ghost">Inspect the engine first</a>
          </div>
          <p className="t-xs mt-6 text-[var(--color-low)]">
            Demo build: three seeded students, full pipeline, no sign-in walls.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer — the final typographic moment ────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)]">
      <div className="mx-auto max-w-[1440px] px-6 pb-10 pt-16 sm:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="t-sm max-w-[38ch] text-[var(--color-mid)]">
              NexLearn is an adaptive STEM learning platform for Grades 9–11. Nex is
              the tutor who lives inside it — the platform teaches; he makes sure it
              lands.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="label-caps mb-4">Product</div>
            <ul className="space-y-2.5 t-sm text-[var(--color-mid)]">
              <li><a href="#loop" className="hover:text-[var(--color-hi)]">The loop</a></li>
              <li><a href="#council" className="hover:text-[var(--color-hi)]">The council</a></li>
              <li><a href="#teachers" className="hover:text-[var(--color-hi)]">For teachers</a></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="label-caps mb-4">App</div>
            <ul className="space-y-2.5 t-sm text-[var(--color-mid)]">
              <li><Link href="/app" className="hover:text-[var(--color-hi)]">Learning hub</Link></li>
              <li><Link href="/app/teacher" className="hover:text-[var(--color-hi)]">Dashboard</Link></li>
              <li><Link href="/app/live" className="hover:text-[var(--color-hi)]">Live tutor</Link></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <div className="label-caps mb-4">Ground truth</div>
            <ul className="space-y-2.5 t-sm text-[var(--color-mid)]">
              <li>Sri Lankan national syllabus</li>
              <li>G.C.E. O/L aligned mark schemes</li>
              <li>Built in Colombo, 2026</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 select-none overflow-hidden" aria-hidden>
          <div className="font-display whitespace-nowrap text-center font-bold leading-[0.85] tracking-[-0.04em] text-[var(--color-ink-2)]" style={{ fontSize: "clamp(4rem, 14vw, 13rem)" }}>
            NEXLEARN
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-line)] pt-6">
          <span className="t-xs text-[var(--color-low)]">© 2026 NexLearn. Teach first.</span>
          <span className="t-xs font-mono text-[var(--color-low)]">design system v1 · volt on deep field</span>
        </div>
      </div>
    </footer>
  );
}
