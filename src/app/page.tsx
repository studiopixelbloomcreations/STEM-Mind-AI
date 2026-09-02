import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/landing/Hero";
import StoryLoop from "@/components/landing/StoryLoop";
import CouncilSection from "@/components/landing/CouncilSection";
import ClosingSections from "@/components/landing/ClosingSections";

export default function Landing() {
  return (
    <main className="relative">
      {/* editorial top navigation */}
      <header className="fixed inset-x-0 top-0 z-[var(--z-rail)]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 sm:px-10">
          <Link href="/" className="flex items-center gap-2.5" aria-label="NexLearn home">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[rgba(215,255,74,0.4)] bg-[rgba(215,255,74,0.08)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-volt)]" />
            </span>
            <span className="font-display text-[1.05rem] font-semibold tracking-tight">
              NexLearn
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            <a href="#loop" className="t-sm text-[var(--color-mid)] transition-colors hover:text-[var(--color-hi)]">How it teaches</a>
            <a href="#council" className="t-sm text-[var(--color-mid)] transition-colors hover:text-[var(--color-hi)]">The council</a>
            <a href="#teachers" className="t-sm text-[var(--color-mid)] transition-colors hover:text-[var(--color-hi)]">For teachers</a>
          </nav>
          <Link href="/app" className="btn btn--ghost btn--sm">
            Open the app <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <Hero />
      <StoryLoop />
      <CouncilSection />
      <ClosingSections />
    </main>
  );
}
