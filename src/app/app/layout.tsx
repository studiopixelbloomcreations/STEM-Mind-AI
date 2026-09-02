"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GraduationCap, LayoutGrid, Mic, Radar, Home } from "lucide-react";
import NexAvatar from "@/components/nex/NexAvatar";
import { onNex } from "@/components/nex/behavior";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Hub", icon: LayoutGrid, exact: true },
  { href: "/app/teacher", label: "Teachers", icon: Radar, exact: false },
  { href: "/app/live", label: "Live tutor", icon: Mic, exact: false },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-[var(--color-ink-0)]">
      {/* left rail */}
      <nav
        className="fixed inset-y-0 left-0 z-[var(--z-rail)] flex w-16 flex-col items-center gap-2 border-r border-[var(--color-line)] bg-[var(--color-ink-1)] py-4"
        aria-label="App"
      >
        <Link href="/" className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px] border border-[rgba(215,255,74,0.35)] bg-[rgba(215,255,74,0.07)]" aria-label="Back to site">
          <GraduationCap size={17} className="text-[var(--color-volt)]" />
        </Link>
        {NAV.map((n) => {
          const on = n.exact ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-label={n.label}
              title={n.label}
              className={cx(
                "flex h-10 w-10 items-center justify-center rounded-[12px] transition-all duration-200",
                on
                  ? "bg-[var(--color-volt)] text-[var(--color-volt-ink)]"
                  : "text-[var(--color-low)] hover:bg-[var(--color-ink-2)] hover:text-[var(--color-hi)]"
              )}
              style={{ transitionTimingFunction: "var(--ease-settle)" }}
            >
              <n.icon size={17} />
            </Link>
          );
        })}
        <div className="mt-auto">
          <Link href="/" aria-label="NexLearn home" title="NexLearn home" className="flex h-10 w-10 items-center justify-center rounded-[12px] text-[var(--color-low)] hover:text-[var(--color-hi)]">
            <Home size={16} />
          </Link>
        </div>
      </nav>

      <div className="ml-16 min-w-0 flex-1">{children}</div>

      {/* persistent docked Nex — present on every app surface */}
      <NexDock />
    </div>
  );
}

function NexDock() {
  const [speech, setSpeech] = useState<string>("");
  const [mood, setMood] = useState<string>("idle");

  useEffect(() => {
    return onNex((d) => {
      if (d.kind === "action") {
        if (d.action.speech) setSpeech(d.action.speech);
        if (d.action.mode) setMood(d.action.mode);
      }
    });
  }, []);

  useEffect(() => {
    if (!speech) return;
    const t = setTimeout(() => setSpeech(""), 9000);
    return () => clearTimeout(t);
  }, [speech]);

  return (
    <div className="pointer-events-none fixed bottom-2 right-3 z-[var(--z-dock)] flex w-[168px] flex-col items-center sm:w-[188px]">
      {speech && (
        <div className="anim-rise pointer-events-auto mb-1 max-w-[220px] rounded-[var(--r-md)] border border-[var(--color-line-strong)] bg-[var(--color-ink-1)] px-3 py-2 text-[0.78rem] leading-snug text-[var(--color-hi)] shadow-[var(--elev-1)]">
          {speech}
        </div>
      )}
      <NexAvatar variant="dock" className="h-[150px] w-full sm:h-[168px]" />
      <div className="label-caps mt-0.5 flex items-center gap-1.5">
        <span className={cx("h-1.5 w-1.5 rounded-full", mood === "idle" ? "bg-[var(--color-low)]" : "anim-blink-dot bg-[var(--color-volt)]")} />
        {mood}
      </div>
    </div>
  );
}
