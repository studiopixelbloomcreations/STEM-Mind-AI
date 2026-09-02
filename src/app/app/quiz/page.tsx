"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, FlagTriangleRight, Lightbulb, Loader2, XCircle } from "lucide-react";
import { AgentMonitor, useCouncilRun } from "@/components/AgentMonitor";
import Whiteboard from "./whiteboard";
import { emitNex } from "@/components/nex/behavior";
import { Button, Caps, Card, Chip } from "@/components/ui";
import type { CouncilPayload } from "@/agents/registry";
import { cx, pct } from "@/lib/utils";

type Phase = "generating" | "answering" | "evaluating" | "feedback" | "teaching" | "summary";
const SESSION_LENGTH = 6;

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center text-[var(--color-low)]">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <QuizInner />
    </Suspense>
  );
}

function QuizInner() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session") ?? "";
  const subject = params.get("subject") ?? "physics";
  const topic = params.get("topic") ?? "motion";
  const studentId = params.get("student") ?? "";
  const name = params.get("name") ?? "";

  const [phase, setPhase] = useState<Phase>("generating");
  const [gen, setGen] = useState<CouncilPayload | null>(null);
  const [fb, setFb] = useState<CouncilPayload | null>(null);
  const [qNum, setQNum] = useState(1);
  const [answer, setAnswer] = useState<string>("");
  const [mcqPick, setMcqPick] = useState<number | null>(null);
  const [stuckWasUsed, setStuckWasUsed] = useState(false);
  const [tally, setTally] = useState({ asked: 0, correct: 0, stuck: 0, taught: 0, peak: 1 });
  const askedIds = useRef<string[]>([]);
  const shownAt = useRef(0);
  const closedRef = useRef(false);

  const generation = useCouncilRun();
  const evaluation = useCouncilRun();

  /* ── question generation (the council run replaces any "thinking" spinner) ── */
  const loadQuestion = async () => {
    setPhase("generating");
    setGen(null);
    setFb(null);
    setAnswer("");
    setMcqPick(null);
    setStuckWasUsed(false);
    const payload = await generation.run({
      mode: "generate",
      subject,
      topic,
      grade: 10,
      studentId,
      studentName: name,
      askedIds: askedIds.current,
    });
    if (!payload?.question) {
      if (askedIds.current.length > 0) finish();
      else {
        emitNex({ kind: "action", action: { mode: "idle", emotion: "encouraging", speech: "I couldn't assemble a question there — try another topic?", animations: ["head_tilt"] } });
        setPhase("summary");
      }
      return;
    }
    askedIds.current.push(payload.question.id);
    setGen(payload);
    setTally((t) => ({ ...t, peak: Math.max(t.peak, payload.question!.difficulty) }));
    if (payload.nex) emitNex({ kind: "action", action: payload.nex });
    shownAt.current = performance.now();
    setPhase("answering");
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadQuestion(); }, []);

  /* ── persistence ── */
  const record = (correct: boolean, stuck: boolean, timeMs: number, score: number) => {
    if (!gen?.question) return;
    fetch("/api/attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId || undefined,
        studentId,
        questionId: gen.question.id,
        subject, topic,
        kind: gen.question.kind,
        correct, stuck,
        difficulty: gen.question.difficulty,
        score,
        timeMs: Math.round(timeMs),
      }),
    }).catch(() => {});
  };

  /* ── answer submission ── */
  const submit = async () => {
    if (!gen?.question || evaluation.state.phase === "running") return;
    const timeMs = performance.now() - shownAt.current;
    const raw = gen.question.kind === "mcq"
      ? (mcqPick != null ? gen.question.choices![mcqPick] : "")
      : answer;
    if (!raw) return;
    setPhase("evaluating");
    const payload = await evaluation.run({
      mode: "evaluate",
      subject, topic, grade: 10, studentId, studentName: name,
      questionId: gen.question.id,
      answer: raw,
    });
    setFb(payload ?? null);
    const correct = !!payload?.feedback?.correct;
    record(correct, false, timeMs, payload?.feedback?.score ?? (correct ? 1 : 0));
    setTally((t) => ({ ...t, asked: t.asked + 1, correct: t.correct + (correct ? 1 : 0) }));
    if (payload?.nex) emitNex({ kind: "action", action: payload.nex });
    setPhase("feedback");
  };

  /* ── "I'm stuck" — the signature interaction ── */
  const stuck = async () => {
    if (!gen?.question || evaluation.state.phase === "running") return;
    const timeMs = performance.now() - shownAt.current;
    setStuckWasUsed(true);
    // Nex reacts FIRST — never an instant page swap.
    emitNex({
      kind: "action",
      action: {
        mode: "listening",
        emotion: "encouraging",
        speech: "Good — saying it is the hard part. Give me one second.",
        animations: ["supportive_lean", "nod"],
      },
    });
    setPhase("evaluating");
    const payload = await evaluation.run({
      mode: "evaluate",
      subject, topic, grade: 10, studentId, studentName: name,
      questionId: gen.question.id,
      stuckRequested: true,
    });
    setFb(payload ?? null);
    record(false, true, timeMs, 0);
    setTally((t) => ({ ...t, asked: t.asked + 1, stuck: t.stuck + 1, taught: t.taught + 1 }));
    if (payload?.nex) emitNex({ kind: "action", action: payload.nex });
    setPhase("teaching");
  };

  const finish = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (sessionId) {
      fetch("/api/sessions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: sessionId, close: true }),
      }).catch(() => {});
    }
    setPhase("summary");
    emitNex({ kind: "action", action: { mode: "idle", emotion: "celebrating", speech: "Session complete — good honest work today.", animations: ["celebrate", "nod"] } });
  };

  const next = () => {
    if (qNum >= SESSION_LENGTH) finish();
    else {
      setQNum((n) => n + 1);
      loadQuestion();
    }
  };

  const q = gen?.question;
  const steps = fb?.teaching?.steps ?? gen?.teaching?.steps ?? [];

  /* ── render ── */
  return (
    <main className="mx-auto max-w-[1100px] px-6 pb-48 pt-8 sm:px-10">
      {/* top bar */}
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => router.push("/app")} className="btn btn--quiet btn--sm">
          <ArrowLeft size={13} /> End session
        </button>
        <div className="flex items-center gap-2">
          <Chip>{qNum} / {SESSION_LENGTH}</Chip>
          {gen?.analytics && <Chip tone="volt">θ target {gen.analytics.targetDifficulty}</Chip>}
          <Chip tone="glacier" className="hidden sm:inline-flex">{topic}</Chip>
        </div>
      </div>

      {/* generation: the monitor IS the loading state */}
      {phase === "generating" && (
        <div className="mt-10">
          <Caps volt className="mb-3">The council is building your next question — live</Caps>
          <AgentMonitor state={generation.state} />
        </div>
      )}

      {(phase === "answering" || phase === "evaluating" || phase === "feedback") && q && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* question column */}
          <div className="lg:col-span-8">
            <Card className="p-7 sm:p-9">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Chip tone="volt">{q.kind}</Chip>
                <Chip>difficulty {q.difficulty}</Chip>
                <span className="label-caps ml-auto">question {qNum}</span>
              </div>
              <h1 className="font-display text-[1.35rem] font-medium leading-[1.45] tracking-tight sm:text-[1.5rem]">
                {q.stem}
              </h1>

              <div className="mt-8">
                {q.kind === "mcq" && q.choices && (
                  <div className="grid gap-2.5">
                    {q.choices.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setMcqPick(i)}
                        disabled={phase !== "answering"}
                        className={cx(
                          "flex items-center gap-4 rounded-[var(--r-md)] border px-4 py-3.5 text-left transition-all duration-200",
                          mcqPick === i
                            ? "border-[var(--color-volt)] bg-[rgba(215,255,74,0.07)]"
                            : "border-[var(--color-line)] bg-[var(--color-ink-1)] hover:border-[var(--color-line-strong)] hover:bg-[var(--color-ink-2)]"
                        )}
                        style={{ transitionTimingFunction: "var(--ease-settle)" }}
                      >
                        <span className={cx(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                          mcqPick === i ? "border-[var(--color-volt)] text-[var(--color-volt)]" : "border-[var(--color-line-strong)] text-[var(--color-low)]"
                        )}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="t-sm sm:text-[0.95rem]">{c}</span>
                      </button>
                    ))}
                  </div>
                )}

                {q.kind === "numeric" && (
                  <div className="flex max-w-md items-center gap-3">
                    <input
                      className="field !py-3 font-mono text-lg"
                      inputMode="decimal"
                      placeholder="your value…"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={phase !== "answering"}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      autoFocus
                    />
                    {q.unit && <Chip tone="glacier">{q.unit}</Chip>}
                  </div>
                )}

                {(q.kind === "short" || q.kind === "conceptual") && (
                  <div>
                    <textarea
                      className="field min-h-[130px] resize-y !py-3 leading-relaxed"
                      placeholder="Explain it in your own words — like you're teaching a classmate."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={phase !== "answering"}
                      autoFocus
                    />
                    <div className="label-caps mt-2 text-right">{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</div>
                  </div>
                )}
              </div>

              {phase === "answering" && (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-line)] pt-6">
                  <button onClick={stuck} className="btn btn--ghost !border-[rgba(255,90,60,0.45)] !text-[var(--color-coral)]">
                    <FlagTriangleRight size={15} /> I’m stuck
                  </button>
                  <Button onClick={submit} disabled={q.kind === "mcq" ? mcqPick == null : !answer.trim()}>
                    Submit answer <ArrowRight size={15} />
                  </Button>
                </div>
              )}
            </Card>

            {/* evaluation stream */}
            {phase === "evaluating" && (
              <div className="mt-5">
                <Caps volt className="mb-2.5">{stuckWasUsed ? "Preparing your whiteboard lesson…" : "The council is marking — live"}</Caps>
                <AgentMonitor state={evaluation.state} dense />
              </div>
            )}

            {/* feedback */}
            {phase === "feedback" && fb?.feedback && (
              <Card className={cx("anim-rise mt-5 border p-6 sm:p-7", fb.feedback.correct ? "!border-[rgba(215,255,74,0.45)] bg-[rgba(215,255,74,0.05)]" : "!border-[rgba(255,90,60,0.4)] bg-[rgba(255,90,60,0.04)]")}>
                <div className="flex items-start gap-4">
                  {fb.feedback.correct ? (
                    <CheckCircle2 size={26} className="mt-0.5 shrink-0 text-[var(--color-volt)]" />
                  ) : (
                    <XCircle size={26} className="mt-0.5 shrink-0 text-[var(--color-coral)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg font-semibold tracking-tight">
                      {fb.feedback.correct ? "Correct — and verified by the council" : "Not quite — but we know exactly why"}
                    </div>
                    <p className="t-sm mt-2 leading-relaxed text-[var(--color-mid)]">{fb.feedback.why}</p>
                    {fb.motivation && <p className="t-sm mt-2 italic text-[var(--color-low)]">“{fb.motivation}”</p>}
                    <div className="mt-5 flex flex-wrap gap-3">
                      {!fb.feedback.correct && steps.length > 0 && (
                        <Button variant="quiet" onClick={() => { setTally((t) => ({ ...t, taught: t.taught + 1 })); setPhase("teaching"); emitNex({ kind: "action", action: { mode: "teaching", emotion: "encouraging", speech: "Whiteboard time — we'll rebuild it properly, one idea at a time.", animations: ["enter_teaching_mode", "point", "explain"] } }); }}>
                          <Lightbulb size={14} /> Show me on the whiteboard
                        </Button>
                      )}
                      <Button onClick={next}>{qNum >= SESSION_LENGTH ? "Finish session" : "Next question"} <ArrowRight size={14} /></Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* coach rail */}
          <aside className="space-y-4 lg:col-span-4">
            <Card className="p-5">
              <Caps volt className="mb-3">Coach notes</Caps>
              {gen?.coach || fb?.coach ? (
                <div className="space-y-3">
                  <p className="t-sm leading-relaxed text-[var(--color-mid)]">{(fb?.coach ?? gen?.coach)?.examTip}</p>
                  <p className="t-xs font-mono text-[var(--color-low)]">{(fb?.coach ?? gen?.coach)?.paceNote}</p>
                </div>
              ) : (
                <p className="t-sm text-[var(--color-low)]">Exam-coach intel appears here with each question.</p>
              )}
            </Card>
            <Card className="p-5">
              <Caps className="mb-3">Session</Caps>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  [tally.asked, "asked"],
                  [tally.correct, "correct"],
                  [tally.stuck, "stuck"],
                ].map(([v, l]) => (
                  <div key={l as string} className="rounded-[var(--r-md)] border border-[var(--color-line)] py-3">
                    <div className="num font-display text-xl font-semibold">{v}</div>
                    <div className="label-caps mt-0.5 !text-[0.58rem]">{l}</div>
                  </div>
                ))}
              </div>
              <div className="label-caps mt-3 flex justify-between">
                <span>peak difficulty</span>
                <span className="num text-[var(--color-volt)]">{tally.peak}/10</span>
              </div>
            </Card>
            {gen?.motivation && (
              <Card className="p-5">
                <Caps className="mb-2">From the motivator agent</Caps>
                <p className="t-sm italic leading-relaxed text-[var(--color-mid)]">“{gen.motivation}”</p>
              </Card>
            )}
          </aside>
        </div>
      )}

      {/* teaching mode */}
      {phase === "teaching" && (
        <Whiteboard
          steps={steps}
          examTip={(fb?.teaching ?? gen?.teaching)?.examTip}
          hint={(fb?.teaching ?? gen?.teaching)?.hint}
          reason={stuckWasUsed ? "stuck" : "feedback"}
          onContinue={next}
        />
      )}

      {/* summary */}
      {phase === "summary" && (
        <div className="anim-rise mx-auto mt-14 max-w-[640px] text-center">
          <Caps volt>Session complete</Caps>
          <h1 className="t-h1 mt-3">Honest work. Here’s the record.</h1>
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-4">
            {[
              [`${tally.asked}`, "questions"],
              [`${tally.asked ? pct(tally.correct / Math.max(1, tally.asked)) : "—"}`, "accuracy"],
              [`${tally.stuck}`, "times stuck"],
              [`${tally.peak}/10`, "peak difficulty"],
            ].map(([v, l]) => (
              <div key={l as string} className="bg-[var(--color-ink-1)] px-4 py-6">
                <div className="num font-display text-2xl font-semibold text-[var(--color-volt)]">{v}</div>
                <div className="label-caps mt-1.5">{l}</div>
              </div>
            ))}
          </div>
          <p className="t-sm mt-6 text-[var(--color-mid)]">
            {tally.stuck > 0
              ? `You asked for help ${tally.stuck} time${tally.stuck > 1 ? "s" : ""} and recovered — that behaviour correlates with mastery, not weakness.`
              : "Clean run. The council will raise the ceiling next session."}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button onClick={() => router.push("/app")}>Back to the hub <ArrowRight size={14} /></Button>
            <Button variant="ghost" onClick={() => router.push("/app/live")}>Debrief with Nex live</Button>
          </div>
        </div>
      )}
    </main>
  );
}
