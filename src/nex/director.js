import { CLIP_NAMES } from './clips.js';

/* ==========================================================================
   NexLearn — Nex director
   The reasoning layer's deterministic core. Maps learning-state events to
   DirectorAction JSON (contract §3.3). LLM speech refinement is optional
   and travels through the council proxy; structure, clips and gaze are
   ALWAYS decided here — the LLM never invents motion.
   ========================================================================== */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const SPEECH = {
  question_shown: [
    'Here\u2019s the next one. Read it twice before you leap.',
    'New question. Take your time \u2014 I\u2019m right here.',
    'I picked this one for you. Steady.',
  ],
  answer_correct: [
    'Exactly right. That\u2019s the concept, not luck.',
    'Clean work. You saw the trap and walked past it.',
    'Correct \u2014 and you were fast about it. Nicely done.',
  ],
  answer_incorrect: [
    'Not this time \u2014 and that\u2019s fine. Let\u2019s see where it turned.',
    'Close, but the reasoning slipped somewhere. Let\u2019s find it.',
    'That answer hides a common mistake. Worth taking apart.',
  ],
  student_stuck: [
    'Good \u2014 asking is the smart move. Let\u2019s build it together, step by step.',
    'Then we slow down. No points for rushing \u2014 let\u2019s take it apart.',
    'Stuck is where learning actually happens. Watch the board.',
  ],
  teaching_started: [
    'Watch the board \u2014 I\u2019ll take this one piece at a time.',
    'Let\u2019s start from what you already know.',
  ],
  teaching_step: [
    'See how that lands?',
    'Follow the highlighted part.',
    'One more piece now.',
  ],
  teaching_ended: [
    'That\u2019s the whole idea. Want to try one like it?',
    'You\u2019ve got the pieces. The next one will feel lighter.',
  ],
  live_listening: ['I\u2019m listening.'],
  live_thinking: ['Thinking\u2026 give me a second.'],
  live_speaking: ['\u2014'],
  session_idle: ['Ready when you are.'],
};

/**
 * deriveDirectorAction(event, context) -> DirectorAction
 * Pure, synchronous, deterministic-safe. `speech` may be overridden by an
 * LLM refinement upstream, but every field has a valid fallback here.
 */
export function deriveDirectorAction(event, ctx = {}) {
  const streak = ctx.streak ?? 0;

  switch (event) {
    case 'question_shown':
      return {
        mode: 'quiz', emotion: 'curious',
        speech: pick(SPEECH.question_shown),
        animations: ['notice', 'turn_toward', 'head_tilt'],
        gazeTarget: 'screen', intensity: 0.8,
      };

    case 'answer_correct':
      return {
        mode: 'quiz', emotion: streak >= 3 ? 'celebrating' : 'encouraging',
        speech: pick(SPEECH.answer_correct),
        animations: streak >= 3 ? ['celebrate', 'nod'] : ['nod', 'encourage'],
        gazeTarget: 'student', intensity: streak >= 3 ? 1 : 0.8,
      };

    case 'answer_incorrect':
      return {
        mode: 'quiz', emotion: 'supportive',
        speech: pick(SPEECH.answer_incorrect),
        animations: ['supportive_lean', 'head_tilt'],
        gazeTarget: 'screen', intensity: 0.6,
      };

    case 'student_stuck':
      return {
        mode: 'teaching', emotion: 'encouraging',
        speech: pick(SPEECH.student_stuck),
        animations: ['notice', 'supportive_lean', 'enter_teaching_mode'],
        gazeTarget: 'student', intensity: 0.9,
        boardHighlight: { target: 'board' },
      };

    case 'teaching_started':
      return {
        mode: 'teaching', emotion: 'attentive',
        speech: pick(SPEECH.teaching_started),
        animations: ['enter_teaching_mode', 'point'],
        gazeTarget: 'board', intensity: 0.85,
        boardHighlight: { target: 'board' },
      };

    case 'teaching_step':
      return {
        mode: 'teaching', emotion: 'encouraging',
        speech: ctx.stepCaption || pick(SPEECH.teaching_step),
        animations: ['point', 'explain'],
        gazeTarget: 'board', intensity: 0.7,
        boardHighlight: { target: ctx.boardHighlightTarget || 'expression' },
      };

    case 'teaching_ended':
      return {
        mode: 'quiz', emotion: 'encouraging',
        speech: pick(SPEECH.teaching_ended),
        animations: ['exit_teaching_mode', 'nod'],
        gazeTarget: 'student', intensity: 0.7,
      };

    case 'live_listening':
      return {
        mode: 'live', emotion: 'attentive',
        speech: pick(SPEECH.live_listening),
        animations: ['listen_loop'], gazeTarget: 'camera', intensity: 0.5,
      };

    case 'live_thinking':
      return {
        mode: 'live', emotion: 'thinking',
        speech: pick(SPEECH.live_thinking),
        animations: ['think'], gazeTarget: 'off', intensity: 0.6,
      };

    case 'live_speaking':
      return {
        mode: 'live', emotion: 'encouraging',
        speech: ctx.speech || '\u2014',
        animations: ['talk_loop'], gazeTarget: 'camera', intensity: 0.8,
      };

    case 'session_idle':
    default:
      return {
        mode: 'idle', emotion: 'neutral',
        speech: pick(SPEECH.session_idle),
        animations: ['return_to_idle'], gazeTarget: 'screen', intensity: 0.4,
      };
  }
}

/** Sanitize an LLM-refined director payload against the closed vocabulary. */
export function sanitizeDirectorPayload(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    mode: ['idle', 'quiz', 'teaching', 'live'].includes(raw.mode) ? raw.mode : 'quiz',
    emotion: ['neutral', 'curious', 'thinking', 'encouraging', 'celebrating', 'supportive', 'attentive'].includes(raw.emotion) ? raw.emotion : 'neutral',
    speech: typeof raw.speech === 'string' ? raw.speech.slice(0, 280) : '',
    animations: Array.isArray(raw.animations)
      ? raw.animations.filter((c) => CLIP_NAMES.includes(c)).slice(0, 4)
      : [],
    gazeTarget: ['screen', 'student', 'board', 'camera', 'off'].includes(raw.gazeTarget) ? raw.gazeTarget : 'screen',
    intensity: Number.isFinite(Number(raw.intensity)) ? Math.max(0, Math.min(1, Number(raw.intensity))) : 0.8,
  };
}
