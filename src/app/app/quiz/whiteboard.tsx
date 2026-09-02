"use client";

/**
 * TEACHING MODE — Nex's whiteboard.
 * A from-scratch, SVG-driven instruction surface: each council-authored step
 * renders a visual (equation / bars / flow / graph), Nex points at regions in
 * sync with narration (speechSynthesis → bus amplitude drives his talk cycle),
 * and highlight pulses tell the student exactly where to look.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Lightbulb, RotateCcw, Volume2, VolumeX } from "lucide-react";
import NexAvatar from "@/components/nex/NexAvatar";
import { emitNex } from "@/components/nex/behavior";
import { Button, Caps, Chip } from "@/components/ui";
import type { Visual, WhiteboardStep } from "@/lib/curriculum";
import { cx } from "@/lib/utils";

export default function Whiteboard({
  steps,
  examTip,
  hint,
  reason,
  onContinue,
}: {
  steps: WhiteboardStep[];
  examTip?: string;
  hint?: string;
  reason: "stuck" | "feedback";
  onContinue: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [drawKey, setDrawKey] = useState(0);
  const speakTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const step = steps[idx];

  // Nex + narration sync on every step change
  useEffect(() => {
    if (!step) return;
    emitNex({
      kind: "action",
      action: {
        mode: "teaching",
        emotion: "encouraging",
        animations: idx === 0 ? ["point", "explain"] : ["explain", "nod"],
        whiteboard_actions: [{ type: "highlight", target: step.highlight ?? "board" }],
      },
    });
    speak(step.say);
    return stopSpeaking;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, drawKey]);

  useEffect(() => () => stopSpeaking(), []);

  const speak = (text: string) => {
    stopSpeaking();
    if (muted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1.15;
    u.onstart = () => {
      speakTimer.current = setInterval(() => {
        emitNex({ kind: "amp", value: 0.35 + Math.random() * 0.55 });
      }, 120);
    };
    u.onend = u.onerror = () => stopSpeaking();
    window.speechSynthesis.speak(u);
  };

  const stopSpeaking = () => {
    if (speakTimer.current) clearInterval(speakTimer.current);
    speakTimer.current = null;
    emitNex({ kind: "amp", value: 0 });
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  if (!step) {
    return (
      <div className="mt-10 text-center t-sm text-[var(--color-low)]">
        No teaching plan was assembled for this question.
        <div className="mt-4"><Button onClick={onContinue}>Continue <ArrowRight size={14} /></Button></div>
      </div>
    );
  }

  return (
    <section className="anim-rise mt-8" aria-label="Teaching mode">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Chip tone="glacier"><Lightbulb size={12} /> teaching mode</Chip>
          <span className="label-caps">
            {reason === "stuck" ? "triggered by “I’m stuck” — no marks lost" : "repair lesson"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setMuted((m) => !m); stopSpeaking(); }}
            className="btn btn--quiet btn--sm !px-2.5"
            aria-label={muted ? "Unmute narration" : "Mute narration"}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button onClick={() => setDrawKey((k) => k + 1)} className="btn btn--quiet btn--sm" aria-label="Replay this step">
            <RotateCcw size={13} /> Replay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Nex, stage left — larger here, an active participant */}
        <div className={cx(
          "relative lg:col-span-3 rounded-[var(--r-lg)] border transition-all duration-500",
          step.highlight === "left" ? "border-[rgba(215,255,74,0.5)] shadow-[var(--glow-volt)]" : "border-[var(--color-line)]"
        )}>
          <NexAvatar variant="teaching" className="mx-auto h-[240px] w-full max-w-[260px]" />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="label-caps">nex · explaining</span>
          </div>
        </div>

        {/* the board */}
        <div className="lg:col-span-9">
          <div className={cx(
            "card relative overflow-hidden transition-all duration-500",
            (step.highlight === "board" || step.highlight === "right") && "!border-[rgba(215,255,74,0.5)] shadow-[var(--glow-volt)]"
          )}>
            {/* board header */}
            <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-ink-2)] px-5 py-3">
              <span className="label-caps">step {idx + 1} of {steps.length}</span>
              <div className="flex items-center gap-1.5">
                {steps.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setIdx(i)}
                    aria-label={`Step ${i + 1}`}
                    className={cx("h-1.5 rounded-full transition-all duration-300", i === idx ? "w-7 bg-[var(--color-volt)]" : "w-3 bg-[var(--color-ink-3)] hover:bg-[var(--color-line-strong)]")}
                  />
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-9">
              <h2 className="t-h2 font-display">{step.title}</h2>
              <p className="t-body-lg mt-3 max-w-[56ch] text-[var(--color-mid)]">{step.say}</p>

              <div className="mt-7 min-h-[200px]" key={`${step.id}-${drawKey}`}>
                {step.visual && <BoardVisual visual={step.visual} />}
              </div>
            </div>

            {/* board footer controls */}
            <div className="flex items-center justify-between border-t border-[var(--color-line)] px-5 py-4">
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                className="btn btn--quiet btn--sm"
              >
                <ChevronLeft size={14} /> Back
              </button>
              {idx < steps.length - 1 ? (
                <button onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))} className="btn btn--primary btn--sm">
                  Next idea <ChevronRight size={14} />
                </button>
              ) : (
                <Button size="sm" onClick={() => { stopSpeaking(); onContinue(); }}>
                  I’ve got it — continue <ArrowRight size={14} />
                </Button>
              )}
            </div>
          </div>

          {examTip && (
            <div className="mt-4 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-ink-1)] px-5 py-4">
              <Caps className="mb-1.5">Exam coach, for later</Caps>
              <p className="t-sm text-[var(--color-mid)]">{examTip}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Visual renderers — every step type draws itself in ───────────────────── */

function BoardVisual({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case "equation":
      return (
        <div className="space-y-2.5">
          {visual.lines.map((l, i) => (
            <div
              key={i}
              className="anim-rise w-fit rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-ink-1)] px-5 py-3 font-mono text-[1.05rem] text-[var(--color-hi)]"
              style={{ animationDelay: `${i * 180}ms`, animationDuration: "520ms" }}
            >
              {l}
            </div>
          ))}
          {visual.note && (
            <div className="anim-rise label-caps label-caps--volt pt-1" style={{ animationDelay: `${visual.lines.length * 180}ms` }}>
              {visual.note}
            </div>
          )}
        </div>
      );

    case "bars": {
      const max = Math.max(...visual.bars.map((b) => b.value), 1);
      return (
        <div className="max-w-[520px] space-y-3">
          {visual.bars.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="t-xs w-36 shrink-0 truncate text-[var(--color-mid)]">{b.label}</span>
              <div className="h-7 flex-1 overflow-hidden rounded-[6px] bg-[var(--color-ink-3)]">
                <div
                  className="h-full rounded-[6px] bg-[var(--color-volt)]"
                  style={{
                    width: `${(b.value / max) * 100}%`,
                    opacity: 0.55 + (b.value / max) * 0.45,
                    animation: `grow-x 700ms var(--ease-settle) ${i * 140}ms both`,
                  }}
                />
              </div>
              <span className="num label-caps w-16 text-right">{b.value}{b.unit ? ` ${b.unit}` : ""}</span>
            </div>
          ))}
          <style>{`@keyframes grow-x { from { width: 0 } }`}</style>
        </div>
      );
    }

    case "flow":
      return (
        <div className="flex flex-wrap items-center gap-2.5">
          {visual.nodes.map((n, i) => (
            <div key={i} className="anim-rise flex items-center gap-2.5" style={{ animationDelay: `${i * 160}ms` }}>
              <span className={cx(
                "rounded-full border px-4 py-2 font-mono text-[0.85rem]",
                i === visual.nodes.length - 1
                  ? "border-[rgba(215,255,74,0.5)] bg-[rgba(215,255,74,0.08)] text-[var(--color-volt)]"
                  : "border-[var(--color-line-strong)] bg-[var(--color-ink-1)] text-[var(--color-hi)]"
              )}>
                {n}
              </span>
              {i < visual.nodes.length - 1 && <span className="text-[var(--color-low)]">→</span>}
            </div>
          ))}
        </div>
      );

    case "graph":
      return <GraphVisual visual={visual} />;
  }
}

function GraphVisual({ visual }: { visual: Extract<Visual, { kind: "graph" }> }) {
  // map math coords → svg: x∈[-1,6], y∈[-2,12] window
  const W = 460, H = 250, PL = 34, PB = 26, PT = 12, PR = 12;
  const xMin = -1, xMax = 6, yMin = -2, yMax = 12;
  const sx = (x: number) => PL + ((x - xMin) / (xMax - xMin)) * (W - PL - PR);
  const sy = (y: number) => H - PB - ((y - yMin) / (yMax - yMin)) * (H - PB - PT);
  const y = (x: number) => visual.slope * x + visual.intercept;
  const linePts = `${sx(xMin)},${sy(y(xMin))} ${sx(xMax)},${sy(y(xMax))}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[560px] rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-ink-0)]">
      {/* grid */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = xMin + i;
        return <line key={`v${i}`} x1={sx(x)} y1={PT} x2={sx(x)} y2={H - PB} stroke="var(--color-line)" strokeWidth="0.7" />;
      })}
      {Array.from({ length: 8 }).map((_, i) => {
        const yy = yMin + i * 2;
        return <line key={`h${i}`} x1={PL} y1={sy(yy)} x2={W - PR} y2={sy(yy)} stroke="var(--color-line)" strokeWidth="0.7" />;
      })}
      {/* axes */}
      <line x1={PL} y1={sy(0)} x2={W - PR} y2={sy(0)} stroke="var(--color-line-strong)" strokeWidth="1.2" />
      <line x1={sx(0)} y1={PT} x2={sx(0)} y2={H - PB} stroke="var(--color-line-strong)" strokeWidth="1.2" />
      {/* the line — draws itself */}
      <polyline
        points={linePts}
        fill="none"
        stroke="var(--color-volt)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="900"
        strokeDashoffset="900"
        style={{ animation: "draw-stroke 1.3s var(--ease-settle) 150ms forwards", ["--dash" as string]: 900 }}
      />
      {/* points */}
      {(visual.points ?? []).map(([px, py], i) => (
        <g key={i} className="anim-rise" style={{ animationDelay: `${500 + i * 160}ms`, animationDuration: "400ms" }}>
          <circle cx={sx(px)} cy={sy(py)} r="4.5" fill="var(--color-ink-0)" stroke="var(--color-volt)" strokeWidth="2" />
          <text x={sx(px) + 9} y={sy(py) - 7} fill="var(--color-mid)" fontSize="11" fontFamily="var(--font-mono)">
            ({px}, {py})
          </text>
        </g>
      ))}
      {visual.xLabel && <text x={W - PR - 8} y={sy(0) + 18} fill="var(--color-low)" fontSize="11" textAnchor="end" fontFamily="var(--font-mono)">{visual.xLabel}</text>}
      {visual.yLabel && <text x={sx(0) + 8} y={PT + 8} fill="var(--color-low)" fontSize="11" fontFamily="var(--font-mono)">{visual.yLabel}</text>}
    </svg>
  );
}
