"use client";

/**
 * NexLearn internal component kit — the documented, reusable primitives.
 * Styling lives in globals.css (tokens) + tailwind utilities; these components
 * encode composition rules so no one-off inline style objects scatter around.
 */

import { ReactNode, useEffect, useRef, useState } from "react";
import { cx, pct } from "@/lib/utils";

/* ── Buttons ─────────────────────────────────────────────────────────────── */

export function Button({
  variant = "primary",
  size,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "quiet" | "danger";
  size?: "sm";
}) {
  const v =
    variant === "danger"
      ? "border-[rgba(255,90,60,0.45)] text-[var(--color-coral)] hover:bg-[rgba(255,90,60,0.08)]"
      : variant === "ghost"
        ? "btn--ghost"
        : variant === "quiet"
          ? "btn--quiet"
          : "btn--primary";
  return (
    <button className={cx("btn", v, size === "sm" && "btn--sm", className)} {...rest}>
      {children}
    </button>
  );
}

/* ── Chips / labels ──────────────────────────────────────────────────────── */

export function Chip({
  tone,
  children,
  className,
}: {
  tone?: "volt" | "coral" | "glacier";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("chip", tone && `chip--${tone}`, className)}>{children}</span>
  );
}

export function Caps({ children, volt, className }: { children: ReactNode; volt?: boolean; className?: string }) {
  return <div className={cx("label-caps", volt && "label-caps--volt", className)}>{children}</div>;
}

/* ── Cards ───────────────────────────────────────────────────────────────── */

export function Card({
  className,
  children,
  hover,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className={cx("card", hover && "card--hover", onClick && "cursor-pointer", className)} onClick={onClick}>
      {children}
    </div>
  );
}

/* ── Field ───────────────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <Caps className="mb-2">{label}</Caps>
      {children}
      {hint && <p className="t-xs mt-2 text-[var(--color-low)]">{hint}</p>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field" {...props} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className="field appearance-none cursor-pointer" {...props}>
      {props.children}
    </select>
  );
}

/* ── Avatar dot (student identity) ───────────────────────────────────────── */

export function AvatarDot({ name, hue, size = 36 }: { name: string; hue: number; size?: number }) {
  const initialsTxt = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `color-mix(in oklab, hsl(${hue} 72% 62%) 22%, var(--color-ink-2))`,
        color: `hsl(${hue} 80% 72%)`,
        border: `1px solid hsl(${hue} 60% 55% / 0.4)`,
      }}
      aria-hidden
    >
      {initialsTxt}
    </span>
  );
}

/* ── Data display ────────────────────────────────────────────────────────── */

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <Caps className="mb-1.5">{label}</Caps>
      <div className={cx("num font-display text-[1.65rem] font-semibold leading-none tracking-tight", accent && "text-[var(--color-volt)]")}>
        {value}
      </div>
      {sub && <div className="t-xs mt-1.5 text-[var(--color-low)]">{sub}</div>}
    </div>
  );
}

export function Meter({ value, danger }: { value: number; danger?: boolean }) {
  return (
    <div className="h-[5px] w-full overflow-hidden rounded-full bg-[var(--color-ink-3)]" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: pct(value),
          background: danger ? "var(--color-coral)" : "var(--color-volt)",
          transitionTimingFunction: "var(--ease-settle)",
        }}
      />
    </div>
  );
}

export function Sparkline({
  data,
  width = 120,
  height = 34,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (data.length < 2) return <div style={{ width, height }} className={className} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * width},${height - 3 - ((d - min) / span) * (height - 6)}`)
    .join(" ");
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--color-volt)" strokeWidth="1.6" strokeLinejoin="round" />
      <circle
        cx={width}
        cy={height - 3 - ((data[data.length - 1] - min) / span) * (height - 6)}
        r="2.4"
        fill="var(--color-volt)"
      />
    </svg>
  );
}

export function Ring({
  value,
  size = 64,
  stroke = 6,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-volt)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          style={{ transition: "stroke-dashoffset 600ms var(--ease-settle)" }}
        />
      </svg>
      <span className="num absolute font-display text-sm font-semibold">{label ?? pct(value)}</span>
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 440,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input, button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} className="card anim-rise relative w-full p-6" style={{ maxWidth: width, boxShadow: "var(--elev-2)" }}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="t-h3">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="btn btn--quiet btn--sm !px-2.5">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Segmented control ───────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-ink-1)] p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-full px-4 py-1.5 font-display text-[0.85rem] font-medium transition-all duration-200",
            value === o.value
              ? "bg-[var(--color-volt)] text-[var(--color-volt-ink)]"
              : "text-[var(--color-mid)] hover:text-[var(--color-hi)]"
          )}
          style={{ transitionTimingFunction: "var(--ease-settle)" }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--r-lg)] border border-dashed border-[var(--color-line-strong)] px-6 py-12 text-center">
      <div className="font-display text-lg font-semibold">{title}</div>
      <p className="t-sm max-w-sm text-[var(--color-mid)]">{body}</p>
      {action}
    </div>
  );
}

/* ── Live status dot ─────────────────────────────────────────────────────── */

export function StatusDot({ state }: { state: "idle" | "live" | "busy" | "error" }) {
  const color =
    state === "live" ? "var(--color-volt)" : state === "busy" ? "var(--color-glacier)" : state === "error" ? "var(--color-coral)" : "var(--color-low)";
  return (
    <span
      className={cx("inline-block h-2 w-2 rounded-full", state === "live" && "anim-blink-dot")}
      style={{ background: color }}
      aria-label={`status: ${state}`}
    />
  );
}

/* ── Reveal-on-scroll (IO-based; GSAP handles the choreography elsewhere) ── */

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "translateY(0)" : "translateY(22px)",
        transition: `opacity 640ms var(--ease-settle) ${delay}ms, transform 640ms var(--ease-settle) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
