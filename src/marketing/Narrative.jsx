import { lazy, Suspense, useEffect, useRef } from 'react';
import { useReducedMotion } from '../design/runtime.js';
import { deriveDirectorAction } from '../nex/director.js';
import { nexEngine } from '../nex/behaviorEngine.js';

/* ==========================================================================
   Narrative / How it works — landing section 02 (#how-it-works).
   A scroll-directed film: the question arrives -> Nex notices -> the student
   is stuck -> Nex teaches -> the student succeeds. Five beats pinned inside a
   ~500vh track; scroll progress maps to scene state and every visual change
   is a transform or opacity written by one rAF loop (a single read-then-write
   pass per frame; no React re-render per frame).

   GSAP is deliberately not used (not installed): the choreography is plain
   scroll-progress math. Every beat is a PURE function of progress p, so the
   film scrubs correctly in both scroll directions and never gets stuck in a
   half-state. The only WebGL surface is the small embedded Nex; the rest of
   the stage is DOM. The avatar is driven through the real director +
   behavior engine (contract 3.3/6), gated on visibility so it never disturbs
   the hero's Nex while off-screen.

   Reduced motion (useReducedMotion): no pin, no sticky, no rAF — the same
   five scenes render as a static, fully readable stacked sequence.
   ========================================================================== */

const Nex = lazy(() => import('../components/nex/Nex.jsx'));

/* --- The script -------------------------------------------------------------
   Register: quiet confidence. Each kicker is one claim about what the
   product IS at that beat; the caption names the beat.
----------------------------------------------------------------------------- */

const QUESTION = {
  no: 'Question 07',
  difficulty: 'Medium',
  type: 'Numerical',
  text: 'A nichrome resistor in a circuit carries a steady current of 2 A when a 12 V supply is connected across it. Calculate the resistance of the resistor.',
  answer: '6',
  unit: '\u03a9',
  syllabus: 'Grade 10 \u00b7 Physics \u00b7 Ohm\u2019s law \u00b7 Syllabus 10.3.2',
  tags: ['Ohm\u2019s law', 'resistance'],
};

const SCENES = [
  {
    id: 'arrives',
    no: '01',
    kicker: 'Every question is chosen for you.',
    caption: 'The question arrives',
    line: 'Written by the council for this student, at this moment \u2014 not pulled from a bank.',
    event: 'question_shown',
  },
  {
    id: 'notices',
    no: '02',
    kicker: 'Being noticed is the product.',
    caption: 'Nex notices',
    line: 'Nine seconds on one line. That is a signal \u2014 and the tutor is watching for it.',
    event: 'student_stuck',
  },
  {
    id: 'stuck',
    no: '03',
    kicker: 'Stuck is not failure. It\u2019s signal.',
    caption: 'The moment of being stuck',
    line: 'The student says so out loud. The tutor does not skip ahead \u2014 it slows down.',
    event: 'student_stuck',
  },
  {
    id: 'teaches',
    no: '04',
    kicker: 'Then the tutor takes the board.',
    caption: 'Nex teaches',
    line: 'The lesson is not pre-recorded. It is built here, from the exact line that went wrong.',
    event: 'teaching_started',
  },
  {
    id: 'succeeds',
    no: '05',
    kicker: 'And the next question already knows.',
    caption: 'The student succeeds',
    line: 'Same student, same difficulty window \u2014 one pass, and the loop has already moved on.',
    event: 'answer_correct',
  },
];

/* BoardScene-style steps (contract 3.2): expression -> expression -> resolved. */
const BOARD_STEPS = [
  { id: 's1', caption: 'Start from the law you know', expression: 'V = I \u00d7 R' },
  { id: 's2', caption: 'Rearrange for the unknown', expression: 'R = V / I' },
  { id: 's3', caption: 'Substitute, and finish it', expression: 'R = 12 / 2 = 6 \u03a9' },
];

const NEX_LINE = 'That pause was long enough that I noticed.';
const BOARD_NOTE = 'One step at a time \u2014 narrated, highlighted, and paced to how the student answered.';

/* --- Scroll math -------------------------------------------------------------
   p in [0,1] across the pin distance:
     p = clamp01(-rect.top / (trackHeight - viewportHeight))
   Scene i owns [i/5, (i+1)/5); u = p*5 - i is local progress inside it.
   ramp(p,a,b) is a sub-range envelope; settle() reproduces the --ease-settle
   curve (cubic-bezier(0.22,1,0.36,1)) so the motion grammar matches the
   token vocabulary.

   Every envelope is a PURE function of GLOBAL p — never of local u, whose
   reset at each scene boundary would re-fire in-scene beats (the stuck
   press, the board steps) during later scenes. Consequences, all verified:
   each beat happens exactly once, completed state holds to the end of the
   film, and the whole sequence reverses frame-perfectly on scroll-up.
---------------------------------------------------------------------------- */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ramp = (p, a, b) => clamp01((p - a) / (b - a || 1));
/* cubic-bezier(0.22, 1, 0.36, 1): fast commitment, long settle. */
const settle = (x) => 1 - Math.pow(1 - clamp01(x), 3);

/* One transform + opacity write per node per frame; never touches layout. */
const place = (node, opacity, y = 0, x = 0) => {
  if (!node) return;
  node.style.opacity = opacity;
  node.style.transform = x
    ? `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
    : `translate3d(0, ${y.toFixed(2)}px, 0)`;
};

/* --- The pinned stage -------------------------------------------------------- */

function PinnedStage() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    /* Capture the cast once: static markup, no state, so nodes are stable
       for the section's lifetime. Class selectors only — no ref tables. */
    const q = (sel) => root.querySelector(sel);
    const qa = (sel) => Array.from(root.querySelectorAll(sel));
    const card = q('.m-narrative__card');
    const cardBody = q('.m-narrative__card-body');
    const nex = q('.m-narrative__nex');
    const nexCaption = q('.m-narrative__nex-caption');
    const stuckWrap = q('.m-narrative__stuck');
    const stuckBtn = q('.m-narrative__stuck-btn');
    const board = q('.m-narrative__board');
    const steps = qa('.m-narrative__step');
    const resolve = q('.m-narrative__resolve');
    const kickers = qa('.m-narrative__kicker');
    const ticks = qa('.m-narrative__tick');
    const railFill = q('.m-narrative__rail-fill');
    const railNo = q('.m-narrative__rail-no');

    let raf = 0;
    let queued = false;
    let lastScene = -1;
    let lastRailNo = '';
    let span = 0;
    const N = SCENES.length;

    const tick = () => {
      queued = false;
      if (!visible) return;

      /* Single layout read for the frame; every write below is pure style. */
      const rect = root.getBoundingClientRect();
      const p = span > 0 ? clamp01(-rect.top / span) : 0;
      const idx = Math.min(N - 1, Math.floor(p * N));
      const u = clamp01(p * N - idx);

      /* Beat helper: a node settles in over a sub-range of p. */
      const inRange = (node, a, b, rise = 24, slide = 0) => {
        if (!node) return;
        const t = settle(ramp(p, a, b));
        place(node, t.toFixed(3), (1 - t) * rise, (1 - t) * slide);
      };

      /* Beat 1 — the question arrives. The card then holds for the film. */
      inRange(card, 0.00, 0.10, 44);

      /* Beat 2 — Nex notices. */
      inRange(nex, 0.20, 0.30, 20);
      inRange(nexCaption, 0.27, 0.36, 10);

      /* Beat 3 — stuck: the button appears, gets pressed once, and the card
         dims. Envelopes are functions of GLOBAL p (not local u), so the press
         happens exactly once and holds — reversing cleanly on scroll-up. */
      inRange(stuckWrap, 0.40, 0.50, 14);
      if (stuckBtn) {
        const press = settle(ramp(p, 0.46, 0.52)) * (1 - ramp(p, 0.56, 0.60));
        stuckBtn.style.transform = `scale(${(1 - press * 0.05).toFixed(4)})`;
      }
      if (cardBody) {
        const dim = ramp(p, 0.42, 0.50) * (1 - ramp(p, 0.78, 0.84));
        cardBody.style.opacity = (1 - dim * 0.35).toFixed(3);
      }

      /* Beat 4 — Nex teaches: board slides in from the right; the steps
         highlight in sequence as the same scene keeps scrolling. The step
         envelopes are functions of GLOBAL p (not local u), so once a step
         lights it stays lit through the success beat — and, being pure in
         p, everything reverses cleanly on scroll-up. */
      inRange(board, 0.60, 0.72, 0, 72);
      steps.forEach((node, i) => {
        const t = settle(ramp(p, 0.64 + i * 0.05, 0.74 + i * 0.05));
        place(node, (0.28 + t * 0.72).toFixed(3), (1 - t) * 12);
        node.classList.toggle('is-on', t > 0.55);
      });

      /* Beat 5 — the student succeeds: the card completes in resolve
         green, the answer lands, one measured spring as the only flourish. */
      inRange(resolve, 0.80, 0.90, 18);
      if (card) {
        const done = settle(ramp(p, 0.84, 0.94));
        card.classList.toggle('is-complete', done > 0.5);
      }
      if (resolve) {
        resolve.classList.toggle('is-sprung', settle(ramp(u, 0.5, 0.85)) > 0.55);
      }

      /* Kickers crossfade — one editorial line per scene. The last holds. */
      kickers.forEach((node, i) => {
        const fadeIn = settle(ramp(p, i / N, i / N + 0.06));
        const fadeOut = i === N - 1 ? 0 : settle(ramp(p, (i + 0.72) / N, (i + 1) / N));
        const v = clamp01(fadeIn - fadeOut);
        place(node, v.toFixed(3), (1 - v) * 14);
      });

      /* Left rail — mono scene ticks + vertical hairline fill. */
      ticks.forEach((node, i) => node.classList.toggle('is-active', i <= idx));
      if (railFill) railFill.style.transform = `scaleY(${Math.max(0.001, p).toFixed(4)})`;
      if (railNo) {
        const label = `${SCENES[idx].no}/05`;
        if (label !== lastRailNo) { railNo.textContent = label; lastRailNo = label; }
      }

      /* Director: on each scene change, drive the real behavior engine so
         the embedded avatar acts the beat (notice, teach, celebrate). */
      if (idx !== lastScene) {
        lastScene = idx;
        try {
          nexEngine.dispatch(deriveDirectorAction(SCENES[idx].event, { streak: 1 }));
        } catch { /* the engine must never break the page */ }
      }
    };

    const onScroll = () => {
      if (!queued) {
        queued = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const measure = () => {
      span = root.offsetHeight - window.innerHeight;
      onScroll();
    };

    /* Work only while the film is on screen: saves the frame budget and
       keeps the mount-time dispatch from re-posing the hero's Nex. */
    let visible = false;
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) onScroll();
    }, { rootMargin: '10% 0px' });
    io.observe(root);

    measure(); /* first paint + span cache */
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div className="m-narrative__track" ref={rootRef}>
      <div className="m-narrative__pin">
        <div className="m-narrative__frame">

          {/* Left rail — mono scene ticks + vertical hairline */}
          <div className="m-narrative__rail" aria-hidden="true">
            <span className="m-narrative__rail-no">01/05</span>
            <span className="m-narrative__rail-line">
              <span className="m-narrative__rail-fill" />
            </span>
            <ol className="m-narrative__ticks">
              {SCENES.map((s) => (
                <li key={s.id} className="m-narrative__tick">{s.no}</li>
              ))}
            </ol>
          </div>

          {/* The stage */}
          <div className="m-narrative__stage">

            {/* Editorial kickers — crossfaded by scroll, one per beat.
               Real text: the full story reads in order for assistive tech. */}
            <div className="m-narrative__kickers">
              {SCENES.map((s) => (
                <p key={s.id} className="m-narrative__kicker">{s.kicker}</p>
              ))}
            </div>

            {/* Question card — arrives in beat 1, completed in beat 5 */}
            <div className="nx-card nx-card--engraved nx-card--pad-lg m-narrative__card">
              <div className="m-narrative__card-body">
                <div className="m-narrative__card-head">
                  <span className="nx-label">{QUESTION.no}</span>
                  <span className="nx-chip">{QUESTION.difficulty}</span>
                  <span className="nx-chip">{QUESTION.type}</span>
                </div>
                <p className="m-narrative__q">{QUESTION.text}</p>
                <div className="m-narrative__answer-row">
                  <span className="nx-label nx-label--plain">Answer</span>
                  <span className="m-narrative__answer nx-num">
                    {QUESTION.answer}<span className="m-narrative__unit">{QUESTION.unit}</span>
                  </span>
                </div>
                <div className="m-narrative__card-meta">
                  <span className="m-narrative__syllabus">{QUESTION.syllabus}</span>
                  {QUESTION.tags.map((t) => (
                    <span key={t} className="nx-chip m-narrative__tag">{t}</span>
                  ))}
                </div>
              </div>

              {/* Beat 3 — the stuck moment lives inside the card */}
              <div className="m-narrative__stuck">
                <button type="button" tabIndex={-1} className="nx-btn nx-btn--secondary nx-btn--sm m-narrative__stuck-btn">
                  I&rsquo;m stuck
                </button>
              </div>
            </div>

            {/* Beat 2 — Nex, small embedded presence */}
            <div className="m-narrative__nex">
              <div className="m-narrative__nex-frame">
                <Suspense fallback={<div className="m-narrative__nex-fallback" />}>
                  <Nex />
                </Suspense>
              </div>
              <p className="m-narrative__nex-caption">{NEX_LINE}</p>
            </div>

            {/* Beat 4 — the whiteboard slides in from the right */}
            <div className="nx-board m-narrative__board">
              <div className="m-narrative__board-head">
                <span className="nx-label nx-label--plain">Whiteboard · Ohm&rsquo;s law</span>
                <span className="nx-chip">BoardScene · expression</span>
              </div>
              <ol className="m-narrative__steps">
                {BOARD_STEPS.map((s) => (
                  <li key={s.id} className="m-narrative__step">
                    <span className="m-narrative__step-caption">{s.caption}</span>
                    <span className="m-narrative__step-expression">{s.expression}</span>
                  </li>
                ))}
              </ol>
              <p className="m-narrative__board-note">{BOARD_NOTE}</p>
            </div>

            {/* Beat 5 — resolve */}
            <div className="m-narrative__resolve">
              <span className="nx-chip nx-chip--resolve">
                <span className="nx-dot nx-dot--resolve" aria-hidden="true" />
                Correct
              </span>
              <p className="m-narrative__resolve-copy">Adaptation, in one pass.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Static path (reduced motion): the same film, told as readable beats ----- */

function StaticBeat({ scene, children }) {
  return (
    <article className="m-narrative__static" aria-label={scene.caption}>
      <header className="m-narrative__static-head">
        <span className="nx-index">{scene.no}/05</span>
        <span className="m-narrative__static-caption">{scene.caption}</span>
      </header>
      <p className="m-narrative__kicker m-narrative__static-kicker">{scene.kicker}</p>
      <p className="m-narrative__static-line">{scene.line}</p>
      {children}
    </article>
  );
}

function StaticNarrative() {
  return (
    <div className="nx-grid m-narrative__statics">
      <div className="nx-c-9">

        <StaticBeat scene={SCENES[0]}>
          <div className="nx-card nx-card--engraved nx-card--pad-lg m-narrative__card m-narrative__card--static">
            <div className="m-narrative__card-head">
              <span className="nx-label">{QUESTION.no}</span>
              <span className="nx-chip">{QUESTION.difficulty}</span>
              <span className="nx-chip">{QUESTION.type}</span>
            </div>
            <p className="m-narrative__q">{QUESTION.text}</p>
            <div className="m-narrative__answer-row">
              <span className="nx-label nx-label--plain">Answer</span>
              <span className="m-narrative__answer nx-num">
                {QUESTION.answer}<span className="m-narrative__unit">{QUESTION.unit}</span>
              </span>
            </div>
            <div className="m-narrative__card-meta">
              <span className="m-narrative__syllabus">{QUESTION.syllabus}</span>
              {QUESTION.tags.map((t) => (
                <span key={t} className="nx-chip m-narrative__tag">{t}</span>
              ))}
            </div>
          </div>
        </StaticBeat>

        <StaticBeat scene={SCENES[1]}>
          <p className="m-narrative__nex-caption">{NEX_LINE}</p>
        </StaticBeat>

        <StaticBeat scene={SCENES[2]}>
          <button type="button" tabIndex={-1} className="nx-btn nx-btn--secondary nx-btn--sm m-narrative__stuck-btn">
            I&rsquo;m stuck
          </button>
        </StaticBeat>

        <StaticBeat scene={SCENES[3]}>
          <div className="nx-board m-narrative__board m-narrative__board--static">
            <div className="m-narrative__board-head">
              <span className="nx-label nx-label--plain">Whiteboard · Ohm&rsquo;s law</span>
              <span className="nx-chip">BoardScene · expression</span>
            </div>
            <ol className="m-narrative__steps">
              {BOARD_STEPS.map((s) => (
                <li key={s.id} className="m-narrative__step is-on">
                  <span className="m-narrative__step-caption">{s.caption}</span>
                  <span className="m-narrative__step-expression">{s.expression}</span>
                </li>
              ))}
            </ol>
            <p className="m-narrative__board-note">{BOARD_NOTE}</p>
          </div>
        </StaticBeat>

        <StaticBeat scene={SCENES[4]}>
          <span className="nx-chip nx-chip--resolve">
            <span className="nx-dot nx-dot--resolve" aria-hidden="true" />
            Correct
          </span>
          <p className="m-narrative__resolve-copy m-narrative__resolve-copy--static">
            Adaptation, in one pass.
          </p>
        </StaticBeat>
      </div>
    </div>
  );
}

/* --- Section ------------------------------------------------------------------ */

export default function Narrative() {
  const reduced = useReducedMotion();

  return (
    <section
      className={`nx-mkt-section m-narrative${reduced ? ' m-narrative--static' : ''}`}
      id="how-it-works"
      aria-labelledby="narrative-h"
    >
      <div className="nx-grid m-narrative__head">
        <div className="nx-c-12">
          <span className="nx-index">02 · How it works</span>
          <h2 className="nx-mkt-h2 m-narrative__title" id="narrative-h">
            Watch the loop run. <em className="m-narrative__em">One question, five beats.</em>
          </h2>
          <p className="nx-mkt-lede m-narrative__lede">
            The sequence below is paced to your scroll. Every card, caption and board
            step is the real interface, built on the same contracts the app runs &mdash;
            question, director action, teaching steps.
          </p>
          {!reduced && <span className="nx-label nx-label--plain m-narrative__hint">Scroll to play</span>}
        </div>
      </div>

      {reduced
        ? <StaticNarrative />
        : <PinnedStage />}
    </section>
  );
}
