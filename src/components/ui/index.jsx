import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../design/runtime.js';

/* ==========================================================================
   NexLearn — React component library (the JS side of nx-* classes)
   Thin, typed-by-convention bindings. Import from here everywhere.
   ========================================================================== */

export function Button({ variant = 'primary', size, className = '', children, ...rest }) {
  const v = { primary: 'nx-btn--primary', secondary: 'nx-btn--secondary', ghost: 'nx-btn--ghost', danger: 'nx-btn--danger' }[variant] || '';
  const s = size ? ` nx-btn--${size}` : '';
  return (
    <button className={`nx-btn ${v}${s} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export function IconButton({ label, className = '', children, ...rest }) {
  return (
    <button aria-label={label} title={label} className={`nx-btn nx-btn--ghost nx-btn--sm ${className}`.trim()} style={{ width: 38, padding: 0 }} {...rest}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children, htmlFor }) {
  return (
    <div className="nx-field">
      {label && <label className="nx-field__label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <div className="nx-field__hint">{hint}</div>}
    </div>
  );
}

export function Input(props) {
  return <input className="nx-input" {...props} />;
}
export function Select(props) {
  return <select className="nx-select" {...props} />;
}
export function Textarea(props) {
  return <textarea className="nx-textarea" {...props} />;
}

export function Card({ variant, className = '', children, ...rest }) {
  const v = variant === 'engraved' ? ' nx-card--engraved' : '';
  const p = rest.pad === 'lg' ? ' nx-card--pad-lg' : '';
  return <div className={`nx-card${v}${p} ${className}`.trim()}>{children}</div>;
}

export function Cell({ k, v, tone }) {
  const t = tone ? ` nx-cell__v--${tone}` : '';
  return (
    <div className="nx-cell">
      <span className="nx-cell__k">{k}</span>
      <span className={`nx-cell__v${t}`}>{v}</span>
    </div>
  );
}

export function Chip({ tone, className = '', children, live }) {
  const t = tone ? ` nx-chip--${tone}` : '';
  const l = live ? ' nx-dot--live' : '';
  return (
    <span className={`nx-chip${t} ${className}`.trim()}>
      {live != null && <span className={`nx-dot${l}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Meter({ value = 0, max = 100, tone }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const t = tone ? ` nx-meter__fill--${tone}` : '';
  return (
    <div className="nx-meter" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`nx-meter__fill${t}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Spark({ points, width = 120, height = 32, tone = 'amber' }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => [
    (i / (points.length - 1)) * width,
    height - ((p - min) / range) * (height - 4) - 2,
  ]);
  const d = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const stroke = tone === 'resolve' ? 'var(--resolve-400)' : 'var(--amber-400)';
  return (
    <svg className="nx-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={d} style={{ stroke }} />
    </svg>
  );
}

export function Label({ amber, plain, className = '', children }) {
  const a = amber ? ' nx-label--amber' : '';
  const p = plain ? ' nx-label--plain' : '';
  return <span className={`nx-label${a}${p} ${className}`.trim()}>{children}</span>;
}

export function Mark({ small }) {
  return (
    <span className="nx-mark" style={small ? { fontSize: '1.15rem' } : undefined}>
      Nex<span className="nx-mark__nex">Learn</span>
      <span className="nx-mark__reg" aria-hidden="true">Adaptive STEM</span>
    </span>
  );
}

/** The quiet branded loading state — mark + one hairline pulse. Never a spinner. */
export function Splash({ label = 'Loading' }) {
  return (
    <div className="nx-splash" role="status" aria-live="polite" aria-label={label}>
      <Mark />
      <span className="nx-splash__rule" aria-hidden="true" />
    </div>
  );
}

/** Settle-on-view wrapper: choreographs entrance when scrolled into view. */
export function Settle({ delay = 0, as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (reduced || !el) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  return (
    <Tag
      ref={ref}
      data-settle=""
      className={`${on ? 'is-settled ' : ''}${className}`.trim()}
      style={{ '--settle-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Rule({ faint, amber }) {
  const f = faint ? ' nx-rule--faint' : '';
  const a = amber ? ' nx-rule--amber' : '';
  return <hr className={`nx-rule${f}${a}`.trim()} />;
}

export function Index({ n, children }) {
  return (
    <span className="nx-index">
      {String(n).padStart(2, '0')}
      {children ? ` · ${children}` : ''}
    </span>
  );
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="nx-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="nx-modal">
        {title && <h3 style={{ marginBottom: 'var(--space-sm)' }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
