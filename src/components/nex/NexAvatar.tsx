"use client";

/**
 * NexAvatar — the only way product surfaces embed Nex.
 * Handles: lazy 3D scene loading, capability detection (reduced motion,
 * weak devices, WebGL failure) and the static SVG poster fallback.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cx } from "@/lib/utils";

const NexScene = dynamic(() => import("./NexModel"), { ssr: false });

export function NexPoster({ className }: { className?: string }) {
  /* Static portrait of Nex — same silhouette, zero GPU cost. */
  return (
    <svg viewBox="0 0 220 240" className={className} role="img" aria-label="Nex — AI companion">
      <defs>
        <linearGradient id="nx-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0f4ed" />
          <stop offset="1" stopColor="#dfe5da" />
        </linearGradient>
        <radialGradient id="nx-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#d7ff4a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#d7ff4a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="222" rx="58" ry="12" fill="url(#nx-glow)" />
      <ellipse cx="110" cy="224" rx="34" ry="6" fill="#0a0f0c" opacity="0.45" />
      {/* antenna */}
      <line x1="122" y1="26" x2="127" y2="6" stroke="#24302a" strokeWidth="4" strokeLinecap="round" />
      <circle cx="128" cy="6" r="6" fill="#d7ff4a" />
      {/* head dome */}
      <ellipse cx="110" cy="66" rx="58" ry="52" fill="url(#nx-shell)" />
      <rect x="58" y="46" width="104" height="44" rx="22" fill="#0a0f0c" />
      {/* eyes */}
      <rect x="82" y="56" width="13" height="24" rx="6.5" fill="#d7ff4a" />
      <rect x="125" y="56" width="13" height="24" rx="6.5" fill="#d7ff4a" />
      <circle cx="89" cy="61" r="2" fill="#fff" />
      <circle cx="132" cy="61" r="2" fill="#fff" />
      {/* body */}
      <rect x="62" y="106" width="96" height="86" rx="46" fill="url(#nx-shell)" />
      <rect x="62" y="146" width="96" height="6" fill="#24302a" opacity="0.9" />
      {Array.from({ length: 6 }).map((_, i) => (
        <circle key={i} cx={72 + i * 15.4} cy="149" r="2.4" fill="#0a0f0c" opacity="0.5" />
      ))}
      {/* core */}
      <circle cx="110" cy="130" r="14" fill="none" stroke="#24302a" strokeWidth="5" />
      <circle cx="110" cy="130" r="8" fill="#d7ff4a" />
      {/* arms */}
      <rect x="40" y="120" width="18" height="42" rx="9" fill="#24302a" />
      <rect x="162" y="120" width="18" height="42" rx="9" fill="#24302a" />
      <circle cx="49" cy="168" r="11" fill="url(#nx-shell)" />
      <circle cx="171" cy="168" r="11" fill="url(#nx-shell)" />
    </svg>
  );
}

type Variant = "hero" | "dock" | "teaching" | "live";

const CAMERA: Record<Variant, { z: number; y: number }> = {
  hero: { z: 2.55, y: 0.8 },
  dock: { z: 2.9, y: 0.82 },
  teaching: { z: 2.35, y: 0.8 },
  live: { z: 2.3, y: 0.78 },
};

let cachedCapable: boolean | null = null;

function detectCapable(): boolean {
  if (typeof window === "undefined") return false;
  if (cachedCapable !== null) return cachedCapable;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return (cachedCapable = false);
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) return (cachedCapable = false);
    if (nav.deviceMemory && nav.deviceMemory <= 2) return (cachedCapable = false);
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return (cachedCapable = false);
    return (cachedCapable = true);
  } catch {
    return (cachedCapable = false);
  }
}

export default function NexAvatar({
  variant = "dock",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const [capable, setCapable] = useState<boolean | null>(cachedCapable);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCapable(detectCapable());
  }, []);

  const cam = CAMERA[variant];
  const usePoster = capable !== true || failed;

  return (
    <div className={cx("relative", className)}>
      {usePoster ? (
        <NexPoster className="h-full w-full" />
      ) : (
        <ErrorBoundary onFail={() => setFailed(true)}>
          <NexScene
            className="h-full w-full [&_canvas]:!h-full [&_canvas]:!w-full"
            cameraZ={cam.z}
            cameraY={cam.y}
            interactive={variant === "hero" || variant === "dock"}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

/* Minimal error boundary — a GPU crash must never take the page with it. */
import { Component, ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode; onFail: () => void }, { bad: boolean }> {
  state = { bad: false };
  static getDerivedStateFromError() {
    return { bad: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.bad ? <NexPoster className="h-full w-full" /> : this.props.children;
  }
}
