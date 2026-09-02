"use client";

import { useEffect, useRef, useState } from "react";
import { Hand, Lightbulb, PenLine, Sparkles, CheckCircle2 } from "lucide-react";
import { cx } from "@/lib/utils";

/**
 * THE PRODUCT LOOP — a pinned, scrubbed walkthrough of one real learning cycle.
 * Five beats; the product frame on the right mutates with each beat. Static
 * frames already read as designed posters; motion only conducts attention.
 */

const BEATS = [
  {
    k: "arrive",
    icon: Sparkles,
    index: "01",
    title: "A question arrives — built for you, not pulled from a pile",
    body: "The council has already read your last twelve attempts. Difficulty, question type, even the numbers inside the problem are chosen to sit exactly at the edge of what you can almost do.",
    caption: "difficulty 5 · chosen from 9 screened candidates",
  },
  {
    k: "notice",
    icon: Hand,
    index: "02",
    title: "Nex notices before you say anything",
    body: "Forty seconds without keystrokes. Two deleted answers. That hesitation is data — the difficulty calibrator is already recalculating, and Nex's posture changes. He has seen this exact stuck-point hundreds of times.",
    caption: "hesitation signal · telemetry, never judgment",
  },
  {
    k: "stuck",
    icon: PenLine,
    index: "03",
    title: "You say it out loud: “I'm stuck.”",
    body: "No penalty. No skipped question. One button — or one sentence in live mode — and the session pivots. Being stuck is treated as the most valuable moment in the lesson, because it is.",
    caption: "zero-cost help-seeking, by design",
  },
  {
    k: "teach",
    icon: Lightbulb,
    index: "04",
    title: "Teaching Mode: the whiteboard comes out",
    body: "Nex rebuilds the concept in front of you — one idea per step, diagrams drawn live, narration synced to whatever he's pointing at. This is the part a quiz app cannot do.",
    caption: "3-step repair · generated while you watch",
  },
  {
    k: "succeed",
    icon: CheckCircle2,
    index: "05",
    title: "Then you answer the next one yourself",
    body: "Not the same question — a cousin of it. When you get it right unaided, the mastery record updates, the streak grows, and the council quietly raises the ceiling. That loop is the whole product.",
    caption: "mastery verified independently, then and only then",
  },
];

export default function StoryLoop() {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPinned(false);
      return;
    }
    let st: { kill: () => void } | null = null;
    let dead = false;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (dead) return;
      gsap.registerPlugin(ScrollTrigger);
      st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const i = Math.min(BEATS.length - 1, Math.floor(self.progress * BEATS.length));
          setActive(i);
        },
      });
    })();
    return () => { dead = true; st?.kill(); };
  }, []);

  return (
    <section id="loop" ref={wrap} className="relative" style={{ height: pinned ? `${BEATS.length * 110 + 100}vh` : "auto" }}>
      <div className={cx(pinned && "sticky top-0 flex h-screen items-center overflow-hidden")}>
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-10 px-6 py-20 sm:px-10 lg:grid-cols-12">
          {/* rail: beat list */}
          <div className="lg:col-span-5">
            <div className="label-caps label-caps--volt mb-8">The product loop</div>
            <ol className="space-y-1">
              {BEATS.map((b, i) => {
                const on = pinned ? i === active : true;
                return (
                  <li
                    key={b.k}
                    className={cx(
                      "border-l-2 py-4 pl-5 transition-all duration-500",
                      on ? "border-[var(--color-volt)] opacity-100" : "border-[var(--color-line)] opacity-40"
                    )}
                    style={{ transitionTimingFunction: "var(--ease-settle)" }}
                  >
                    <div className="label-caps mb-1.5 flex items-center gap-2">
                      <span className={on ? "text-[var(--color-volt)]" : ""}>{b.index}</span>
                      {on && <span className="text-[var(--color-volt-dim)]">{b.caption}</span>}
                    </div>
                    <h3 className={cx("font-display font-semibold tracking-tight", pinned ? "text-[1.15rem]" : "t-h3", on ? "text-[var(--color-hi)]" : "text-[var(--color-mid)]")}>
                      {b.title}
                    </h3>
                    {on && (
                      <p className="t-sm mt-2 max-w-[46ch] text-[var(--color-mid)] anim-rise">{b.body}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* stage: the product frame */}
          <div className="lg:col-span-7">
            <ProductFrame beat={pinned ? BEATS[active].k : "teach"} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* The abstracted UI frame per beat — drawn with code, not screenshots */
function ProductFrame({ beat }: { beat: string }) {
  return (
    <div className="card relative mx-auto w-full max-w-[680px] overflow-hidden" style={{ boxShadow: "var(--elev-2)" }}>
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-ink-3)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-ink-3)]" />
        <span className="label-caps ml-3">nexlearn · physics / motion</span>
        <span className={cx("chip ml-auto !py-0.5", beat === "teach" ? "chip--glacier" : "chip--volt")}>
          {beat === "teach" ? "teaching mode" : beat === "succeed" ? "mastery +1" : "adaptive session"}
        </span>
      </div>

      <div className="relative p-6 sm:p-8" style={{ minHeight: 360 }}>
        {/* persistent question skeleton */}
        <div className={cx("transition-all duration-700", beat === "teach" && "opacity-25 blur-[1px]")}>
          <div className="label-caps mb-3">question 4 of 6 · numeric</div>
          <p className="font-display text-[1.15rem] font-medium leading-snug tracking-tight">
            A bicycle accelerates uniformly from 4 m/s to 16 m/s in 6 s. Calculate its acceleration.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="field max-w-[200px] !py-2.5 font-mono text-sm">
              {beat === "succeed" ? <span className="text-[var(--color-volt)]">2 m/s²</span> : <span className="text-[var(--color-low)]">your answer…</span>}
            </div>
            <span className="chip">m/s²</span>
          </div>
        </div>

        {/* beat overlays */}
        {beat === "arrive" && (
          <div className="anim-rise absolute right-6 top-6 rounded-[var(--r-md)] border border-[rgba(215,255,74,0.35)] bg-[rgba(215,255,74,0.07)] px-3.5 py-2.5">
            <div className="label-caps label-caps--volt mb-1">council consensus</div>
            <div className="num font-mono text-xs text-[var(--color-mid)]">θ=5.1 · band 4–5 · unseen item</div>
          </div>
        )}

        {beat === "notice" && (
          <div className="anim-rise absolute inset-x-6 bottom-6 rounded-[var(--r-md)] border border-[var(--color-line-strong)] bg-[var(--color-ink-2)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="label-caps">hesitation telemetry</span>
              <span className="label-caps text-[var(--color-coral)]">41s idle</span>
            </div>
            <div className="flex h-8 items-end gap-1">
              {[3, 4, 3, 5, 7, 6, 9, 12, 15, 18].map((v, i) => (
                <span key={i} className="w-full rounded-sm bg-[rgba(255,90,60,0.5)]" style={{ height: `${v * 5}%`, opacity: 0.4 + i * 0.06, animation: `float-y 2.${i}s var(--ease-steady) infinite` }} />
              ))}
            </div>
          </div>
        )}

        {beat === "stuck" && (
          <div className="absolute inset-x-0 bottom-10 flex justify-center">
            <div className="relative">
              <span className="absolute -inset-3 rounded-full border border-[var(--color-volt)] opacity-40" style={{ animation: "pulse-soft 1.4s var(--ease-steady) infinite" }} />
              <span className="btn btn--ghost !border-[var(--color-volt)] !text-[var(--color-volt)]">I’m stuck</span>
            </div>
          </div>
        )}

        {beat === "teach" && (
          <div className="anim-rise absolute inset-0 bg-[var(--color-ink-1)] p-6 sm:p-8">
            <div className="label-caps label-caps--volt mb-3">whiteboard · step 2 of 3</div>
            <svg viewBox="0 0 520 200" className="w-full">
              <text x="10" y="40" fill="var(--color-hi)" fontSize="22" fontFamily="var(--font-mono)">a = (v − u) ÷ t</text>
              <text x="10" y="86" fill="var(--color-mid)" fontSize="20" fontFamily="var(--font-mono)">a = (16 − 4) ÷ 6</text>
              <rect x="8" y="104" width="300" height="40" rx="8" fill="none" stroke="var(--color-volt)" strokeWidth="1.6" strokeDasharray="700" strokeDashoffset="700" style={{ animation: "draw-stroke 1.6s var(--ease-settle) forwards", ["--dash" as string]: 700 }} />
              <text x="20" y="130" fill="var(--color-volt)" fontSize="20" fontFamily="var(--font-mono)">a = 12 ÷ 6 = 2 m/s²</text>
              <path d="M 330 120 L 400 120" stroke="var(--color-glacier)" strokeWidth="1.6" markerEnd="url(#arr)" />
              <defs>
                <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill="var(--color-glacier)" />
                </marker>
              </defs>
              <text x="330" y="160" fill="var(--color-low)" fontSize="13" fontFamily="var(--font-mono)">Nex points here</text>
            </svg>
          </div>
        )}

        {beat === "succeed" && (
          <div className="anim-rise absolute right-6 top-6 flex items-center gap-3 rounded-[var(--r-md)] border border-[rgba(215,255,74,0.4)] bg-[rgba(215,255,74,0.08)] px-4 py-3">
            <CheckCircle2 size={18} className="text-[var(--color-volt)]" />
            <div>
              <div className="font-display text-sm font-semibold text-[var(--color-volt)]">Correct — independently</div>
              <div className="num font-mono text-[0.7rem] text-[var(--color-mid)]">mastery: motion 62% → 68% · ceiling raised</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
