"use client";

import { useEffect, useRef } from "react";
import { Play, RotateCcw } from "lucide-react";
import { AgentMonitor, useCouncilRun } from "@/components/AgentMonitor";
import { COUNCIL_PLAN, COUNCIL_COUNT, COUNCIL_MAX_PARALLEL } from "@/agents/plan";
import { Reveal } from "@/components/ui";

/**
 * THE COUNCIL — the engine room, run live in front of the visitor.
 * "Run a live burst" fires one real HTTPS request per agent — all concurrent,
 * all independently timed (open devtools → Network to verify). This is the
 * same infrastructure the app streams through during question generation.
 */

const LAYERS = [
  { n: 0, title: "Evidence sweep", note: "all seven run simultaneously" },
  { n: 1, title: "Construction", note: "waits only for what it truly needs" },
  { n: 2, title: "Synthesis", note: "four specialists, one dependency layer" },
  { n: 3, title: "Fusion", note: "the only serial step in the system" },
];

export default function CouncilSection() {
  const { state, probe, reset } = useCouncilRun();
  const ranOnce = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);

  // auto-run once when the section first scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !ranOnce.current) {
          ranOnce.current = true;
          probe({ topic: "motion", subject: "physics", grade: 10 }, COUNCIL_PLAN);
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [probe]);

  return (
    <section id="council" ref={sectionRef} className="relative py-24 sm:py-36">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* left: the argument + the org chart */}
          <div className="lg:col-span-5">
            <Reveal>
              <div className="label-caps label-caps--volt mb-5">The engine room</div>
              <h2 className="t-h1 max-w-[14ch]">
                One question.
                <br />
                <span className="text-[var(--color-volt)]">{COUNCIL_COUNT} specialists.</span>
              </h2>
              <p className="t-body-lg mt-6 max-w-[48ch] text-[var(--color-mid)]">
                Every NexLearn question — and every grading decision — is produced by a
                council of {COUNCIL_COUNT} specialist agents working in genuinely
                parallel layers, not one model pretending to be everything. Watch them
                work. This panel is not a recording.
              </p>
            </Reveal>

            <ol className="mt-10 space-y-5">
              {LAYERS.map((l) => (
                <Reveal key={l.n} delay={l.n * 80}>
                  <li className="flex items-start gap-4">
                    <span className="num mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-line-strong)] font-display text-xs font-semibold text-[var(--color-volt)]">
                      L{l.n}
                    </span>
                    <div>
                      <div className="font-display font-semibold tracking-tight">
                        {l.title}
                        <span className="label-caps ml-3">{COUNCIL_PLAN.filter((a) => a.layer === l.n).length} agents</span>
                      </div>
                      <div className="t-sm text-[var(--color-low)]">{l.note}</div>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>

            <Reveal delay={340}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button
                  className="btn btn--primary"
                  onClick={() => probe({ topic: "quadratics", subject: "maths", grade: 10 }, COUNCIL_PLAN)}
                  disabled={state.phase === "running"}
                >
                  <Play size={15} /> Run a live burst
                </button>
                {state.phase === "done" && (
                  <button className="btn btn--quiet btn--sm" onClick={reset}>
                    <RotateCcw size={13} /> Reset
                  </button>
                )}
              </div>
              <p className="t-xs mt-4 max-w-[44ch] text-[var(--color-low)]">
                Each card below is a separate, concurrent HTTPS request resolving with
                real computed output. Skeptical? Open your network tab — up to{" "}
                {COUNCIL_MAX_PARALLEL}+ requests sit in flight at the same instant.
              </p>
            </Reveal>
          </div>

          {/* right: the live monitor */}
          <div className="lg:col-span-7">
            <Reveal delay={120}>
              <AgentMonitor state={state} />
            </Reveal>
            {state.phase === "done" && (
              <p className="anim-rise t-xs mt-3 text-right font-mono text-[var(--color-low)]">
                burst complete · every card above was its own request · raw compute shown per agent
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
