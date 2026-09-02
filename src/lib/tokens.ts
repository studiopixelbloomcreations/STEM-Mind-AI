/**
 * NexLearn design tokens — JS/TS mirror of the CSS custom properties in globals.css.
 * Single source of truth consumed by the marketing site and the app.
 */

export const color = {
  ink0: "#060B0A",
  ink1: "#0B1311",
  ink2: "#101B17",
  ink3: "#16241F",
  line: "rgba(228,244,230,0.09)",
  lineStrong: "rgba(228,244,230,0.16)",
  textHi: "#EEF4EA",
  textMid: "rgba(238,244,234,0.62)",
  textLow: "rgba(238,244,234,0.38)",
  volt: "#D7FF4A",
  voltDim: "#A9CC33",
  coral: "#FF5A3C",
  glacier: "#8FCCFF",
  paper: "#F2EFE6",
} as const;

/** Motion grammar — one hand designed the whole product. */
export const motion = {
  dur: { snap: 120, quick: 240, settle: 480, story: 960 },
  ease: {
    /** Signature entrance — long tail settle. */
    settle: "cubic-bezier(0.16,1,0.3,1)",
    /** Exit — decisive, no overshoot. */
    exit: "cubic-bezier(0.7,0,0.84,0)",
    /** Interactive feedback spring — small overshoot. */
    spring: "cubic-bezier(0.34,1.4,0.44,1)",
    /** Continuous motion (pulses, scans). */
    steady: "cubic-bezier(0.45,0,0.55,1)",
  },
} as const;

export const z = { rail: 40, dock: 50, modal: 60, toast: 70 } as const;

export const radius = { sm: 6, md: 10, lg: 16, xl: 24, pill: 999 } as const;
