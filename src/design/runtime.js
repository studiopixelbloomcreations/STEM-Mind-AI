import { useEffect, useState } from 'react';

/* ==========================================================================
   NexLearn — shared runtime utilities
   Utility layer consumed by both marketing site and app.
   ========================================================================== */

/** Motion preference hook — single source for respecting reduced motion. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** IntersectionObserver settle hook — drives [data-settle] entrances. */
export function useSettle(ref, { threshold = 0.18, once = true } = {}) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSettled(true);
        if (once) io.disconnect();
      } else if (!once) {
        setSettled(false);
      }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, once]);
  return settled;
}

/** Canonical number clamp */
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Editorial section index formatter: "01", "02" ... */
export const pad2 = (n) => String(n).padStart(2, '0');

/** Performance-tier detection for the 3D budget. */
export function detectTier() {
  if (typeof window === 'undefined') return 'low';
  const nav = window.navigator;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  const cores = nav.hardwareConcurrency || 2;
  const saveData = !!conn?.saveData;
  const slowNet = ['slow-2g', '2g', '3g'].includes(conn?.effectiveType);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || saveData || slowNet || cores <= 2) return 'low';
  if (cores >= 8 && window.matchMedia('(pointer: fine)').matches) return 'high';
  return 'mid';
}

/** Safe JSON extraction from LLM responses — never throws. */
export function safeJson(text, fallback = null) {
  try {
    const cleaned = String(text || '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const start = cleaned.indexOf('{');
    const startArr = cleaned.indexOf('[');
    const arrFirst = startArr !== -1 && (start === -1 || startArr < start);
    const from = arrFirst ? startArr : start;
    if (from === -1) return fallback;
    const open = cleaned[from];
    const close = open === '{' ? '}' : ']';
    const to = cleaned.lastIndexOf(close);
    if (to <= from) return fallback;
    return JSON.parse(cleaned.slice(from, to + 1));
  } catch {
    return fallback;
  }
}
