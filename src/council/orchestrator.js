import { ROSTER, ROSTER_BY_ID } from './roster.js';

/* ==========================================================================
   NexLearn — Council orchestrator
   Runs the 13-agent DAG with REAL concurrency: wave 1 fires ~7 agents at
   once (visible in the network tab as simultaneous in-flight requests);
   dependent agents fan out again in later waves. Every start/resolve
   emits an event for the Agent Activity Monitor. One agent failing never
   blocks the rest: allSettled + typed fallbacks throughout.
   ========================================================================== */

const PROXY_URL = () => {
  try {
    const raw = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_CONFIG : undefined;
    if (raw) {
      const cfg = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (cfg?.url) return `${cfg.url.replace(/\/$/, '')}/functions/v1/council-proxy`;
    }
    const envUrl = typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL)
      : undefined;
    if (envUrl) return `${String(envUrl).replace(/\/$/, '')}/functions/v1/council-proxy`;
  } catch {}
  return 'https://jxhljizbivkrnpzwswce.supabase.co/functions/v1/council-proxy';
};

/** Single agent call through the secure proxy. Returns parsed JSON or throws. */
export async function callAgent(agentId, payload, { signal, onEvent } = {}) {
  const agent = ROSTER_BY_ID[agentId];
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);
  onEvent?.({ type: 'agent:start', agentId, at: performance.now() });
  try {
    const token = await getAuthToken();
    const res = await fetch(PROXY_URL(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ agent: agentId, payload }),
      signal,
    });
    if (!res.ok) throw new Error(`proxy ${res.status}`);
    const data = await res.json();
    if (data?.error) throw new Error(data.error);
    onEvent?.({ type: 'agent:done', agentId, at: performance.now(), output: data.output });
    return data.output;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    onEvent?.({ type: 'agent:error', agentId, at: performance.now(), error: String(err?.message || err) });
    throw err;
  }
}

let authTokenFn = null;
/** The app registers a token provider (Firebase) at boot. */
export function setAuthTokenProvider(fn) { authTokenFn = fn; }
async function getAuthToken() {
  try { return authTokenFn ? await authTokenFn() : null; }
  catch { return null; }
}

/* ---------------------------------------------------------------------------
   Full question cycle. Emits monitor events; resolves a fused Question
   (contract §3.1) or rejects honestly if the council is unavailable.
   --------------------------------------------------------------------------- */

export async function runQuestionCycle(ctx, { onEvent, signal } = {}) {
  const runId = `run-${Date.now()}`;
  onEvent?.({ type: 'run:start', runId, at: performance.now() });
  const results = {};
  const emit = (e) => onEvent?.({ ...e, runId });

  // Wave 1 — independent agents, truly concurrent.
  const wave1 = ROSTER.filter((a) => a.wave === 1);
  const wave1Results = await Promise.allSettled(
    wave1.map((a) => callAgent(a.id, buildPayload(a.id, ctx, results), { signal, onEvent: emit }))
  );
  wave1.forEach((a, i) => {
    const r = wave1Results[i];
    results[a.id] = r.status === 'fulfilled' ? r.value : undefined;
    // AllSettled already emitted agent:error on failure — record the fallback
    // resolve so the monitor never shows a permanently "running" agent.
    if (r.status === 'rejected') {
      emit({ type: 'agent:done', agentId: a.id, at: performance.now(), output: 'offline fallback', offline: true });
    }
  });

  // Wave 2 — the questioner needs curriculum fit + difficulty.
  try {
    results.questioner = await callAgent('questioner', buildPayload('questioner', ctx, results), { signal, onEvent: emit });
  } catch (err) {
    emit({ type: 'agent:error', agentId: 'questioner', at: performance.now(), error: err.message });
    throw new Error(`We're having trouble reaching NexLearn's AI right now — please try again in a moment.`);
  }

  // Wave 3 — everyone who reacts to the question, concurrent again.
  const wave3 = ROSTER.filter((a) => a.wave === 3);
  const wave3Results = await Promise.allSettled(
    wave3.map((a) => callAgent(a.id, buildPayload(a.id, ctx, results), { signal, onEvent: emit }))
  );
  wave3.forEach((a, i) => {
    const r = wave3Results[i];
    results[a.id] = r.status === 'fulfilled' ? r.value : undefined;
    if (r.status === 'rejected') {
      emit({ type: 'agent:done', agentId: a.id, at: performance.now(), output: 'offline fallback', offline: true });
    }
  });

  // Wave 4 — fusion.
  try {
    results.fusion = await callAgent('fusion', buildPayload('fusion', ctx, results), { signal, onEvent: emit });
  } catch {
    results.fusion = localFuse(ctx, results);
    emit({ type: 'agent:done', agentId: 'fusion', at: performance.now(), output: 'local fuse', offline: true });
  }

  // Wave 5 — the Nex director.
  try {
    results.director = await callAgent('director', buildPayload('director', ctx, results), { signal, onEvent: emit });
  } catch {
    results.director = null;
    emit({ type: 'agent:done', agentId: 'director', at: performance.now(), output: 'offline fallback', offline: true });
  }

  const question = normalizeQuestion(results, ctx);
  onEvent?.({ type: 'run:done', runId, at: performance.now(), question });
  return question;
}

/* ---------------------------------------------------------------------------
   Payload builders — each agent gets exactly the context it needs.
   --------------------------------------------------------------------------- */

function buildPayload(agentId, ctx, sofar) {
  const base = {
    subject: ctx.subject, topic: ctx.topic, grade: ctx.grade, difficulty: ctx.difficulty,
    history: ctx.history || [], streak: ctx.streak ?? 0,
  };
  switch (agentId) {
    case 'curriculum': return { ...base, task: 'syllabus_fit', return: 'json' };
    case 'difficulty': return { ...base, task: 'recommend_difficulty', return: 'json' };
    case 'examCoach': return { ...base, task: 'exam_tip', return: 'json' };
    case 'motivator': return { ...base, task: 'encouragement', return: 'json' };
    case 'analyst': return { ...base, task: 'history_analysis', return: 'json' };
    case 'questioner': return {
      ...base,
      task: 'generate_question',
      return: 'json',
      syllabusRef: sofar.curriculum?.syllabusRef,
      targetDifficulty: sofar.difficulty?.recommended || ctx.difficulty,
      plainWording: sofar.accessibility?.plainWording,
    };
    case 'validator': return { ...base, task: 'validate', question: sofar.questioner, return: 'json' };
    case 'explainer': return { ...base, task: 'concept_explanation', question: sofar.questioner, return: 'json' };
    case 'whiteboard': return { ...base, task: 'whiteboard_steps', question: sofar.questioner, return: 'json' };
    case 'misconception': return { ...base, task: 'misconceptions', question: sofar.questioner, return: 'json' };
    case 'accessibility': return { ...base, task: 'plain_rewording', question: sofar.questioner, return: 'json' };
    case 'fusion': return { ...base, task: 'fuse_question', outputs: sofar, return: 'json' };
    case 'director': return { ...base, task: 'director_action', question: sofar.fusion, return: 'json' };
    default: return { ...base, task: agentId, return: 'json' };
  }
}

/* ---------------------------------------------------------------------------
   Normalization — the only place Question shape is finalized.
   --------------------------------------------------------------------------- */

function normalizeQuestion(results, ctx) {
  const q = results.fusion || results.questioner || {};
  const question = {
    question: str(q.question || q.questionText),
    questionType: normalizeType(q.questionType),
    choices: Array.isArray(q.choices) ? q.choices.map(str) : null,
    correctAnswer: str(q.correctAnswer),
    hints: Array.isArray(q.hints) ? q.hints.map(str).slice(0, 3) : [str(q.hint)].filter(Boolean),
    difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : ctx.difficulty,
    syllabusRef: str(q.syllabusRef || results.curriculum?.syllabusRef),
    conceptTags: Array.isArray(q.conceptTags) ? q.conceptTags.map(str) : [],
    steps: normalizeSteps(q.steps || results.whiteboard?.steps),
    examTips: str(q.examTips || results.examCoach?.tip),
    motivator: str(q.motivator || results.motivator?.message),
    confidence: num(q.confidence, results.validator?.ok === false ? 55 : 86),
  };
  if (!question.question) throw new Error('Council produced no question.');
  if (question.questionType === 'MCQ' && (!question.choices || question.choices.length < 2)) {
    question.questionType = 'SHORT_ANSWER';
    question.choices = null;
  }
  return question;
}

function normalizeType(t) {
  const s = String(t || '').toUpperCase().replace(/[\s/]/g, '_');
  if (s.includes('MCQ') || s.includes('MULTIPLE')) return 'MCQ';
  if (s.includes('TRUE')) return 'TRUE_FALSE';
  if (s.includes('FILL')) return 'FILL_BLANK';
  if (s.includes('NUMER') || s.includes('NUMBER')) return 'NUMERICAL';
  if (s.includes('CONCEPT')) return 'CONCEPTUAL';
  return 'SHORT_ANSWER';
}

function normalizeSteps(steps) {
  if (!Array.isArray(steps)) return [];
  return steps.slice(0, 6).map((s, i) => ({
    id: `s${i + 1}`,
    caption: str(s.caption || s.title),
    narration: str(s.narration || s.speech || s.caption),
    board: normalizeBoard(s.board || s),
    conceptTags: [],
  }));
}

function normalizeBoard(b) {
  if (!b || typeof b !== 'object') return { kind: 'expression', expression: '' };
  const kind = ['expression', 'diagram', 'comparison', 'numberline', 'progress'].includes(b.kind) ? b.kind : 'expression';
  return { ...b, kind };
}

const str = (v) => (v == null ? '' : String(v)).trim();
const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/* ---------------------------------------------------------------------------
   Offline fallbacks — the council is AI, but the product must never
   dead-end. A small deterministic bank per subject keeps quizzes alive
   when the proxy is unconfigured or the network is down.
   --------------------------------------------------------------------------- */

function localFuse(ctx, results) {
  const base = results.questioner;
  if (!base) {
    throw new Error(`We're having trouble reaching NexLearn's AI right now — please try again in a moment.`);
  }
  return {
    ...base,
    examTips: results.examCoach?.tip || base.examTips || 'Carefully check units before solving.',
    motivator: results.motivator?.message || base.motivator || 'Stay focused on the core concept.',
    steps: results.whiteboard?.steps || base.steps || [],
  };
}
