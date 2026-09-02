"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import NexAvatar from "@/components/nex/NexAvatar";

/**
 * HERO — typography carries the frame; Nex is present, alive, cursor-aware.
 * Composition is deliberately asymmetric (7/5 grid), never centered-stacked.
 */
export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let killed = false;
    (async () => {
      const { gsap } = await import("gsap");
      if (killed) return;
      const targets = el.querySelectorAll("[data-rise]");
      gsap.fromTo(
        targets,
        { opacity: 0, y: 34 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09, delay: 0.15 }
      );
      const tags = el.querySelectorAll("[data-tag]");
      gsap.fromTo(
        tags,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)", stagger: 0.16, delay: 0.9 }
      );
    })();
    return () => { killed = true; };
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden pt-28 sm:pt-36">
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
      {/* volt atmosphere — restrained, behind Nex only */}
      <div
        className="pointer-events-none absolute right-[-10%] top-[8%] h-[640px] w-[640px] rounded-full opacity-[0.13]"
        style={{ background: "radial-gradient(circle, var(--color-volt) 0%, transparent 62%)" }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-6 pb-10 sm:px-10 lg:grid-cols-12 lg:gap-6">
        {/* ── left: the argument ── */}
        <div className="lg:col-span-7">
          <div data-rise className="mb-7 flex flex-wrap items-center gap-2">
            <span className="chip chip--volt">Adaptive STEM · Grades 9–11</span>
            <span className="chip">Sri Lankan syllabus</span>
          </div>

          <h1 data-rise className="t-hero max-w-[12ch]">
            Stop being graded.
            <br />
            <span className="text-[var(--color-volt)]">Start being taught.</span>
          </h1>

          <p data-rise className="t-body-lg mt-7 max-w-[52ch] text-[var(--color-mid)]">
            Quiz apps mark you wrong and move on. NexLearn pairs you with{" "}
            <span className="text-[var(--color-hi)]">Nex</span> — an embodied AI tutor who
            watches how you think, reshapes every question around your working, and
            picks up a whiteboard the moment you say <em>“I’m stuck.”</em>
          </p>

          <div data-rise className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#loop" className="btn btn--primary">
              See how he teaches <ArrowDown size={15} />
            </a>
            <Link href="/app" className="btn btn--ghost">
              Open the app <ArrowRight size={15} />
            </Link>
          </div>

          <div data-rise className="mt-14 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--color-line)] pt-6">
            {[
              ["15", "specialist agents per question"],
              ["1:1", "embodied tutor, always present"],
              ["0", "answers revealed before you try"],
            ].map(([n, label]) => (
              <div key={label} className="flex items-baseline gap-3">
                <span className="num font-display text-2xl font-semibold text-[var(--color-volt)]">{n}</span>
                <span className="label-caps">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── right: the colleague ── */}
        <div className="relative lg:col-span-5">
          <div data-rise className="relative mx-auto aspect-[5/6] w-full max-w-[460px]">
            <NexAvatar variant="hero" className="h-full w-full" />
            {/* annotation tags — the product's promises, pinned to the character */}
            <span data-tag className="chip chip--volt absolute left-[2%] top-[18%] hidden sm:inline-flex" style={{ animation: "float-y 5s var(--ease-steady) infinite" }}>
              notices hesitation
            </span>
            <span data-tag className="chip absolute right-[0%] top-[42%] hidden sm:inline-flex" style={{ animation: "float-y 6s var(--ease-steady) infinite 0.8s" }}>
              adapts difficulty live
            </span>
            <span data-tag className="chip chip--glacier absolute bottom-[14%] left-[8%] hidden sm:inline-flex" style={{ animation: "float-y 5.4s var(--ease-steady) infinite 1.6s" }}>
              teaches on a whiteboard
            </span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex max-w-[1440px] items-center gap-3 px-6 pb-10 sm:px-10">
        <span className="label-caps">Scroll — the product loop, end to end</span>
        <span className="hairline flex-1" />
      </div>
    </section>
  );
}
