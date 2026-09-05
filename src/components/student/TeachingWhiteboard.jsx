import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Label, Index } from '../ui/index.jsx';
import './whiteboard.css';

/* ==========================================================================
   NexLearn — TeachingWhiteboard (workstream 10)
   The interactive teaching board: where Nex takes a question apart, step by
   step. Renders TeachingStep[] / BoardScene (contract §3.2) as real SVG
   instruments — expression, diagram, comparison, numberline, progress —
   never HTML snippet cards. The board is the product's most serious surface:
   a dark instrument panel, amber reserved for Nex's pointing light.

   Robustness (contract rules honored):
   - Malformed/empty AI steps never crash the board: every step is
     normalized, and an unusable list falls back to one step built from the
     question itself. No dead ends.
   - boardHighlight (§3.3) arrives either as a prop or inside a
     DirectorAction prop; unknown targets degrade to a whole-board glow.
   ========================================================================== */

const AMBER = 'var(--amber-400)';
const AMBER_HI = 'var(--amber-300)';
const TEXT_HI = 'var(--text-hi)';
const TEXT_LO = 'var(--text-lo)';
const INK_LINE = 'var(--ink-600)';
const INK_CELL = 'rgba(242, 240, 234, 0.03)';

const W = 1000;
const H = 600;
const SCENE = { x: 48, y: 40, w: W - 96, h: H - 130 };

const num = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? '');
  const r = Math.round(n * 1000) / 1000;
  return String(Number.isInteger(r) ? r : parseFloat(r.toFixed(2)));
};
const esc = (s, max = 120) => String(s ?? '').slice(0, max);
const pad2 = (n) => String(n).padStart(2, '0');

/* ------------------------------------------------------------------------ */
/* Math typesetting — a tiny superscript/fraction-aware SVG text renderer.
   Preprocesses:  sqrt(x) → √x   * → ×
   Keeps inline:  a/b fractions (per spec), ×, ÷, √.
   Exponents:     ^2 → ², ^23 → ²³ (superscript glyphs, inline at full size —
                  the glyphs carry their own raise); ^n → a real raised
                  tspan with the baseline restored after it (dy is a shift,
                  not a position). Long text wraps so a question-length
                  fallback still fits the stage.                          */

const SUPER_DIGITS = { 0: '\u2070', 1: '\u00b9', 2: '\u00b2', 3: '\u00b3', 4: '\u2074', 5: '\u2075', 6: '\u2076', 7: '\u2077', 8: '\u2078', 9: '\u2079' };

function prepMath(src) {
  return String(src ?? '')
    .replace(/sqrt\(([^()]*)\)/gi, '\u221a$1')
    .replace(/\*/g, '\u00d7');
}

/** Split into superscript-aware runs: { t, sup }. Digit exponents become
    inline ²³ glyphs (sup=false); only ^n needs a raised tspan. */
function mathRuns(raw) {
  const src = prepMath(raw);
  const runs = [];
  const push = (t, sup) => {
    const last = runs[runs.length - 1];
    if (last && last.sup === sup) last.t += t;
    else runs.push({ t, sup });
  };
  let i = 0;
  while (i < src.length) {
    if (src[i] === '^' && i + 1 < src.length) {
      const digits = src.slice(i + 1).match(/^[0-9]+/);
      const letter = src.slice(i + 1).match(/^[a-zA-Z]/);
      if (digits) {
        // ^23 → ²³ — every digit maps to its superscript glyph, inline.
        let glyphs = '';
        for (const d of digits[0]) glyphs += SUPER_DIGITS[d] || d;
        push(glyphs, false);
        i += 1 + digits[0].length;
      } else if (letter) {
        push(letter[0], true);
        i += 2;
      } else {
        push('^', false);
        i += 1;
      }
      continue;
    }
    push(src[i], false);
    i += 1;
  }
  return runs.filter((r) => r.t);
}

/** One wrapped line of runs. dy balances: raise for a superscript, drop back
    after it, so the baseline always returns home. */
function MathLine({ runs, x, y, size, anchor = 'middle', fill }) {
  return (
    <text
      x={x} y={y} textAnchor={anchor} dominantBaseline="central"
      fontFamily="var(--font-mono)" fontSize={size} fill={fill}
    >
      {runs.map((r, i) => {
        const prev = i > 0 ? runs[i - 1].sup : false;
        const dy = r.sup && !prev ? -size * 0.34 : (!r.sup && prev ? size * 0.34 : 0);
        return (
          <tspan key={i} dy={dy} fontSize={r.sup ? size * 0.66 : size}>{r.t}</tspan>
        );
      })}
    </text>
  );
}

/** A whole expression, centered at (cx, cy): auto-sized 26–64px, wrapped to
   at most 4 lines against `maxW`. */
function ExpressionText({ text, cx, cy, maxW = SCENE.w - 64, fill = AMBER_HI, ariaLabel }) {
  const layout = useMemo(() => {
    const src = prepMath(text).trim() || '\u2014';
    // JetBrains Mono advance ≈ 0.6em; pick the largest size that fits, floor 44.
    const fits = (s) => src.length * 0.6 * s <= maxW;
    let size = 64;
    while (size > 44 && !fits(size)) size -= 2;
    if (fits(size)) return { size, lines: [src] };
    // Too long — wrap at word level, settle at 40px, floor 26.
    size = Math.max(26, Math.min(40, Math.floor(maxW / (0.6 * 24))));
    const words = src.split(/\s+/).filter(Boolean);
    const maxChars = Math.floor(maxW / (0.6 * size));
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length <= maxChars) cur = next;
      else { if (cur) lines.push(cur); cur = w.slice(0, maxChars); }
    }
    if (cur) lines.push(cur);
    return { size, lines: lines.slice(0, 4) };
  }, [text, maxW]);

  const lineH = layout.size * 1.35;
  const y0 = cy - ((layout.lines.length - 1) * lineH) / 2;
  return (
    <g aria-hidden={ariaLabel ? undefined : true} {...(ariaLabel ? { role: 'img', 'aria-label': ariaLabel } : {})}>
      {layout.lines.map((line, li) => (
        <MathLine
          key={li}
          runs={mathRuns(line)}
          x={cx}
          y={y0 + li * lineH}
          size={layout.size}
          fill={fill}
        />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* Scene renderers — one per BoardScene kind (§3.2). Each is wrapped in the
   id'd group the highlight targets: g#board-expression / g#board-items.   */

function ExpressionScene({ board }) {
  const expression = String(board.expression ?? board.text ?? '').trim() || '\u2014';
  return (
    <g id="board-expression">
      <ExpressionText
        text={expression}
        cx={SCENE.x + SCENE.w / 2}
        cy={(SCENE.y + SCENE.h) / 2 - 10}
        fill={AMBER_HI}
        ariaLabel={`Expression: ${expression}`}
      />
    </g>
  );
}

function FallbackScene() {
  return (
    <g id="board-expression">
      <ExpressionText
        text="Let us start from what we know."
        cx={SCENE.x + SCENE.w / 2}
        cy={(SCENE.y + SCENE.h) / 2 - 10}
        fill={AMBER_HI}
      />
    </g>
  );
}

function DiagramScene({ board }) {
  const items = (Array.isArray(board.items) ? board.items : [])
    .filter((it) => it && typeof it === 'object' && (it.label || it.value != null))
    .slice(0, 6);
  if (!items.length) return <FallbackScene />;

  const count = items.length;
  const cx = SCENE.x + SCENE.w / 2;
  const cy = (SCENE.y + SCENE.h) / 2;

  // Layout: 1 centered, 2 stacked, 3-6 on a flattened ring.
  const pos = [];
  if (count === 1) pos.push([cx, cy]);
  else if (count === 2) { pos.push([cx, cy - 96], [cx, cy + 96]); }
  else {
    const r = count <= 3 ? 250 : count === 4 ? 268 : 285;
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + (i / count) * Math.PI * 2;
      pos.push([cx + r * Math.cos(a), cy + r * 0.46 * Math.sin(a)]);
    }
  }

  const nw = count <= 2 ? 250 : count === 3 ? 230 : 200;
  const nh = 96;
  // Connector i→i+1 (ring wraps; a lone pair draws once).
  const links = count > 1
    ? Array.from({ length: count === 2 ? 1 : count }, (_, i) => [i, (i + 1) % count])
    : [];

  return (
    <g id="board-items">
      {links.map(([a, b], li) => {
        const [x1, y1] = pos[a];
        const [x2, y2] = pos[b];
        // Hairline stops at the node edge, not its center.
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const sx = x1 + ux * (nw / 2 + 10), sy = y1 + uy * (nh / 2 + 10);
        const ex = x2 - ux * (nw / 2 + 10), ey = y2 - uy * (nh / 2 + 10);
        // Arrowhead mid-line when the source node's note annotates the relation.
        const arrow = !!items[a].note;
        const mx = (sx + ex) / 2, my = (sy + ey) / 2;
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <g key={`l${li}`} aria-hidden="true">
            <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={INK_LINE} strokeWidth={1} />
            {arrow && (
              <polygon
                points="7,0 -4,4 -4,-4"
                fill={INK_LINE}
                transform={`translate(${mx}, ${my}) rotate(${ang})`}
              />
            )}
          </g>
        );
      })}
      {items.map((it, i) => {
        const [x, y] = pos[i];
        const label = esc(it.label, 28);
        const value = it.value != null ? num(it.value) : '';
        const unit = esc(it.unit, 10);
        return (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <rect
              x={-nw / 2} y={-nh / 2} width={nw} height={nh} rx={10}
              fill={INK_CELL} stroke={INK_LINE} strokeWidth={1}
            />
            <text y={-16} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={20} fill={TEXT_HI}>
              {label}
            </text>
            {value && (
              <text y={16} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={25} fill={AMBER}>
                {value}{unit ? ` ${unit}` : ''}
              </text>
            )}
            {it.note && (
              <text y={36} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11} fill={TEXT_LO}>
                {esc(it.note, 34)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function ComparisonScene({ board }) {
  const rows = (Array.isArray(board.rows) ? board.rows : [])
    .filter((r) => r && typeof r === 'object' && (r.left != null || r.right != null))
    .slice(0, 5);
  if (!rows.length) return <FallbackScene />;

  const colL = SCENE.x + SCENE.w * 0.22;
  const colR = SCENE.x + SCENE.w * 0.78;
  const colOp = SCENE.x + SCENE.w / 2;
  const rowH = Math.min(88, Math.floor((SCENE.h - 40) / rows.length));
  const top = (SCENE.y + SCENE.h) / 2 - (rows.length * rowH) / 2 + 12;

  return (
    <g id="board-items">
      {rows.map((r, i) => {
        const y = top + i * rowH + rowH / 2;
        const isLast = i === rows.length - 1;
        return (
          <g key={i}>
            <text x={colL} y={y} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)" fontSize={21} fill={TEXT_HI}>
              {esc(r.left, 20)}
            </text>
            <text x={colOp} y={y} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)" fontSize={19} fill={AMBER}>
              {esc(r.op ?? '=', 6)}
            </text>
            <text x={colR} y={y} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)" fontSize={21} fill={TEXT_HI}>
              {esc(r.right, 20)}
            </text>
            {r.note && (
              <text x={colR} y={y + 26} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11} fill={TEXT_LO}>
                {esc(r.note, 40)}
              </text>
            )}
            {!isLast && (
              <line
                x1={SCENE.x + 60} y1={y + rowH / 2} x2={SCENE.x + SCENE.w - 60} y2={y + rowH / 2}
                stroke={INK_LINE} strokeWidth={1} opacity={0.65}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

function NumberlineScene({ board }) {
  const from = Number.isFinite(Number(board.from)) ? Number(board.from) : 0;
  const rawTo = Number(board.to);
  const to = Number.isFinite(rawTo) && rawTo > from ? rawTo : from + 10;
  let step = Number(board.step);
  if (!Number.isFinite(step) || step <= 0 || step > (to - from) / 1.5) step = (to - from) / 10;
  const value = Number.isFinite(Number(board.value))
    ? Math.min(to, Math.max(from, Number(board.value)))
    : null;

  const pad = 72;
  const x0 = SCENE.x + pad;
  const x1 = SCENE.x + SCENE.w - pad;
  const y = (SCENE.y + SCENE.h) / 2;
  const toX = (v) => x0 + ((v - from) / (to - from)) * (x1 - x0);

  const ticks = [];
  const maxTicks = Math.min(11, Math.floor((to - from) / step) + 1);
  for (let i = 0; i < maxTicks; i++) ticks.push(from + i * step);
  if (ticks[ticks.length - 1] < to - step * 0.25) ticks.push(to);

  return (
    <g id="board-items">
      <line x1={x0 - 14} y1={y} x2={x1} y2={y} stroke={INK_LINE} strokeWidth={1.5} />
      <polygon points={`12,0 0,4.5 0,-4.5`} fill={INK_LINE} transform={`translate(${x1 + 4}, ${y})`} />
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={toX(v)} y1={y - 8} x2={toX(v)} y2={y + 8} stroke={INK_LINE} strokeWidth={1} />
          <text x={toX(v)} y={y + 30} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={15} fill={TEXT_LO}>
            {num(v)}
          </text>
        </g>
      ))}
      {value != null && (() => {
        const px = toX(value);
        const label = num(value);
        return (
          <g>
            <line x1={px} y1={y - 42} x2={px} y2={y - 13} stroke={AMBER} strokeWidth={1} opacity={0.5} />
            <circle cx={px} cy={y} r={10} fill={AMBER} />
            <circle cx={px} cy={y} r={16} fill="none" stroke={AMBER} strokeWidth={1} opacity={0.35} />
            <text x={px} y={y - 56} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={26} fill={AMBER}>
              {label}
            </text>
          </g>
        );
      })()}
    </g>
  );
}

function ProgressScene({ board }) {
  const total = Number.isFinite(Number(board.total)) && Number(board.total) > 0 ? Number(board.total) : 100;
  const raw = Number(board.value);
  const value = Number.isFinite(raw) ? Math.min(total, Math.max(0, raw)) : 0;
  const frac = value / total;

  const barH = 24;
  const barY = (SCENE.y + SCENE.h) / 2 - 14;
  const x0 = SCENE.x + 60;
  const bw = SCENE.w - 120;

  return (
    <g id="board-items">
      <rect x={x0} y={barY} width={bw} height={barH} rx={barH / 2} fill={INK_CELL} stroke={INK_LINE} strokeWidth={1} />
      <rect
        className="nx-wb-bar"
        x={x0} y={barY} height={barH} rx={barH / 2}
        width={Math.max(barH, bw * frac)}
        fill={AMBER} opacity={0.85}
      />
      <text x={x0} y={barY - 16} fontFamily="var(--font-mono)" fontSize={15} fill={TEXT_LO}>
        {`${num(value)} / ${num(total)}`}
      </text>
      <text x={x0 + bw} y={barY - 16} textAnchor="end" fontFamily="var(--font-mono)" fontSize={15} fill={AMBER}>
        {`${num(Math.round(frac * 1000) / 10)}%`}
      </text>
    </g>
  );
}

const SCENES = {
  expression: ExpressionScene,
  diagram: DiagramScene,
  comparison: ComparisonScene,
  numberline: NumberlineScene,
  progress: ProgressScene,
};

/* The note line every scene gets — quiet mono microtype, bottom-left. */
function SceneNote({ note }) {
  const txt = String(note ?? '').trim();
  if (!txt) return null;
  return (
    <g id="board-note">
      <text
        x={SCENE.x + 4}
        y={H - 30}
        fontFamily="var(--font-mono)"
        fontSize={15}
        className="nx-wb-note"
        fill={TEXT_LO}
      >
        {txt.slice(0, 96)}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* Nex's pointing light (§3.3 boardHighlight).
   Targets the id'd scene groups: g#board-expression, g#board-items,
   g#board-note; 'board' covers the whole stage. Because scene layouts are
   deterministic per kind, each target maps to a fixed frame. pct (optional,
   0-100) narrows the lamp horizontally — a reading-progress sweep.        */

const HL_REGIONS = {
  expression: { x: SCENE.x + 36, y: (SCENE.y + SCENE.h) / 2 - 118, w: SCENE.w - 72, h: 236 },
  items: { x: SCENE.x + 14, y: SCENE.y + 6, w: SCENE.w - 28, h: SCENE.h - 12 },
  note: { x: SCENE.x - 8, y: H - 62, w: SCENE.w - 10, h: 46 },
  board: { x: SCENE.x - 14, y: SCENE.y - 8, w: SCENE.w + 28, h: SCENE.h + 16 },
};

function Highlight({ spec, generation }) {
  // spec is already a resolved { target, pct } — target is validated by the caller.
  const base = HL_REGIONS[spec.target] || HL_REGIONS.board;
  const raw = Number(spec.pct);
  const sx = Number.isFinite(raw) && raw > 0 ? Math.min(1, raw / 100) : 1;
  const w = Math.max(120, base.w * sx);
  const dash = Math.ceil(2 * (w + base.h));
  return (
    <g className="nx-wb-hl" key={generation} aria-hidden="true">
      <rect className="nx-wb-hl__fill" x={base.x} y={base.y} width={w} height={base.h} rx={14} opacity={0.12} />
      <rect
        className="nx-wb-hl__line"
        x={base.x} y={base.y} width={w} height={base.h} rx={14}
        strokeDasharray={dash}
        style={{ '--wb-dash': `${dash}` }}
      />
    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* Step normalization — malformed AI output must never crash the board.     */

function hasSceneContent(b) {
  switch (b.kind) {
    case 'expression': return typeof b.expression === 'string' && !!b.expression.trim();
    case 'diagram': return Array.isArray(b.items) && b.items.length > 0;
    case 'comparison': return Array.isArray(b.rows) && b.rows.length > 0;
    case 'numberline': return ['from', 'to', 'value'].some((k) => Number.isFinite(Number(b[k])));
    case 'progress': return ['value', 'total'].some((k) => Number.isFinite(Number(b[k])));
    default: return false;
  }
}

function normalizeStep(raw, i, question) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const fallbackText = String(question?.question ?? 'The question').slice(0, 180);

  const caption = typeof src.caption === 'string' && src.caption.trim()
    ? src.caption.trim().slice(0, 90)
    : `Step ${i + 1}`;
  const narration = typeof src.narration === 'string' && src.narration.trim()
    ? src.narration.trim().slice(0, 600)
    : (typeof src.speech === 'string' && src.speech.trim() ? src.speech.trim() : caption);

  const rawBoard = src.board && typeof src.board === 'object' ? src.board : null;
  const board = rawBoard && SCENES[rawBoard.kind] && hasSceneContent(rawBoard)
    ? rawBoard
    : { kind: 'expression', expression: caption !== `Step ${i + 1}` ? caption : fallbackText };

  const tags = Array.isArray(src.conceptTags)
    ? src.conceptTags.filter((t) => typeof t === 'string' && t.trim()).slice(0, 4).map((t) => t.trim())
    : (Array.isArray(question?.conceptTags) ? question.conceptTags.slice(0, 3) : []);

  return {
    id: typeof src.id === 'string' && src.id ? src.id.slice(0, 24) : `s${i + 1}`,
    caption,
    narration,
    board,
    conceptTags: tags,
  };
}

function fallbackSteps(question) {
  const qText = String(question?.question ?? '').trim();
  return [{
    id: 's1',
    caption: 'The question',
    narration: qText || 'Let\u2019s read the question together, then take it apart.',
    board: { kind: 'expression', expression: qText || 'The question' },
    conceptTags: Array.isArray(question?.conceptTags) ? question.conceptTags.slice(0, 3) : [],
  }];
}

/* ------------------------------------------------------------------------ */
/* The whiteboard                                                            */

export default function TeachingWhiteboard({
  question,
  steps: stepsProp,
  activeStep = 0,
  onStep,
  onExit,
  compact = false,
  boardHighlight: highlightProp,
  directorAction,
}) {
  const [outgoing, setOutgoing] = useState(null);
  const prevScene = useRef(null);

  const steps = useMemo(() => {
    const list = Array.isArray(stepsProp) ? stepsProp : [];
    const norm = list.slice(0, 12).map((s, i) => normalizeStep(s, i, question));
    return norm.length ? norm : fallbackSteps(question);
  }, [stepsProp, question]);

  const count = steps.length;
  const idx = Math.max(0, Math.min(count - 1, Math.trunc(Number(activeStep) || 0)));
  const step = steps[idx];
  const Scene = SCENES[step.board.kind] || ExpressionScene;

  /* Scene identity — step id + index + a cheap content signature, so a
     parent replacing steps mid-flight still triggers the crossfade. */
  const sceneKey = useMemo(() => {
    const b = step.board;
    const sig = b.kind === 'expression'
      ? esc(prepMath(b.expression), 200)
      : `${b.kind}:${b.items?.length ?? 0}${b.rows?.length ?? 0}:${b.value ?? ''}${b.to ?? ''}${b.total ?? ''}:${esc(b.note, 40)}`;
    return `${step.id}:${idx}:${sig}`;
  }, [step, idx]);

  /* Step transition: keep the outgoing scene mounted briefly so the new one
     settles in over it; the highlight key remount re-draws its outline. */
  useEffect(() => {
    const prev = prevScene.current;
    if (prev && prev.key !== sceneKey) {
      setOutgoing({ key: prev.key, step: prev.step });
      const t = setTimeout(() => setOutgoing(null), 300);
      prevScene.current = { key: sceneKey, step };
      return () => clearTimeout(t);
    }
    prevScene.current = { key: sceneKey, step };
  }, [sceneKey, step]);

  /* boardHighlight precedence (§3.3): direct prop, then the DirectorAction
     prop. Absent either, no pointing — the parent owns the choreography. */
  const boardHighlight = (() => {
    const candidates = [highlightProp, directorAction?.boardHighlight];
    for (const c of candidates) {
      if (!c) continue;
      const target = typeof c === 'string' ? c : c.target;
      if (typeof target === 'string' && target.trim()) {
        return { target: HL_REGIONS[target] ? target : 'board', pct: c.pct };
      }
    }
    return null;
  })();

  const hlGen = `${sceneKey}:${boardHighlight ? boardHighlight.target : 'none'}`;

  const go = (i) => {
    if (typeof onStep === 'function' && i >= 0 && i < count && i !== idx) onStep(i);
  };

  return (
    <div className={`nx-wb${compact ? ' nx-wb--compact' : ''}`}>
      <div className="nx-board">
        {/* Chrome: microlabel, step index, exit */}
        <div className="nx-board__chrome">
          <div className="nx-board__meta">
            <Label amber plain>Nex&rsquo;s board</Label>
            <span className="nx-board__idx">
              <Index n={idx + 1}>{`${count} ${count === 1 ? 'step' : 'steps'}`}</Index>
            </span>
          </div>
          {typeof onExit === 'function' && (
            <Button variant="ghost" size="sm" className="nx-wb__exit" onClick={onExit}>
              <span className="nx-wb__exit-full">Back to the question</span>
              <span className="nx-wb__exit-short">Back</span>
            </Button>
          )}
        </div>

        {/* The stage — 5:3, scales with the viewport */}
        <div className="nx-board__stage">
          <svg
            className="nx-board__svg"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Teaching board, step ${idx + 1} of ${count}: ${step.caption}`}
          >
            {outgoing && (() => {
              const OutScene = SCENES[outgoing.step.board.kind] || ExpressionScene;
              return (
                <g className="nx-wb-scene nx-wb-scene--out" key={`out-${outgoing.key}`} aria-hidden="true">
                  <OutScene board={outgoing.step.board} />
                  <SceneNote note={outgoing.step.board.note} />
                </g>
              );
            })()}
            <g className="nx-wb-scene" key={sceneKey}>
              <Scene board={step.board} />
              <SceneNote note={step.board.note} />
            </g>
            {boardHighlight && <Highlight spec={boardHighlight} generation={hlGen} />}
          </svg>
        </div>

        {/* Filmstrip */}
        <div className="nx-board__strip">
          <div className="nx-wb__nav">
            <Button variant="secondary" size="sm" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous step">
              &larr; Prev
            </Button>
          </div>
          <div className="nx-wb__chips">
            {steps.map((s, i) => {
              const isDone = i < idx;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`nx-wb-chip${i === idx ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
                  aria-current={i === idx ? 'step' : undefined}
                  aria-label={`Step ${i + 1}${isDone ? ' (done)' : ''}: ${s.caption}`}
                  onClick={() => go(i)}
                >
                  {isDone ? (
                    <span className="nx-wb-chip__tick">
                      {pad2(i + 1)}
                      <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                        <path d="M2 6.5 L4.8 9 L10 3" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  ) : pad2(i + 1)}
                </button>
              );
            })}
          </div>
          <div className="nx-wb__nav">
            <Button variant="secondary" size="sm" onClick={() => go(idx + 1)} disabled={idx >= count - 1} aria-label="Next step">
              Next &rarr;
            </Button>
          </div>
        </div>
      </div>

      {/* Caption + narration + concept tags */}
      <div className="nx-wb__body">
        <p className="nx-wb__caption">{step.caption}</p>
        <p className="nx-wb__narration">{step.narration}</p>
        {step.conceptTags.length > 0 && (
          <div className="nx-wb__tags">
            {step.conceptTags.map((t) => <Chip key={t}>{t}</Chip>)}
          </div>
        )}
      </div>
    </div>
  );
}
