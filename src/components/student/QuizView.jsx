import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { runQuestionCycle } from '../../council/orchestrator.js';
import { agentList } from '../../council/roster.js';
import AgentMonitor from '../council/AgentMonitor.jsx';
import Nex from '../nex/Nex.jsx';
import { deriveDirectorAction } from '../../nex/director.js';
import { nexEngine } from '../../nex/behaviorEngine.js';
import voiceSynthesizer from '../../utils/voiceSynthesizer.js';
import { Button, Chip, Label } from '../ui/index.jsx';
import './quiz.css';

/* ==========================================================================
   Adaptive Quiz View — the working session.
   Per-type answer registers, the I'm-stuck sequence (Nex reacts before
   teaching, never an instant page swap), the council monitor replacing
   any spinner, and adaptive difficulty across the session.
   ========================================================================== */

const TeachingWhiteboard = lazy(() => import('./TeachingWhiteboard.jsx'));
const AGENTS = agentList();
const QUESTION_COUNT = 5;

export default function QuizView() {
  const {
    currentQuiz, setCurrentQuiz, activeStudent, recordQuizResult,
  } = useApp();

  const [question, setQuestion] = useState(null);
  const [events, setEvents] = useState([]);
  const [generating, setGenerating] = useState(true);
  const [genError, setGenError] = useState(null);

  // Session state
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [asked, setAsked] = useState([]);
  const [difficulty, setDifficulty] = useState(currentQuiz?.difficulty || 'medium');
  const [seconds, setSeconds] = useState(0);
  const startedRef = useRef(null);
  useEffect(() => { startedRef.current = Date.now(); }, []);

  // Answer state
  const [selected, setSelected] = useState(null);
  const [typed, setTyped] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Teaching state
  const [teaching, setTeaching] = useState(false);
  const [teachStep, setTeachStep] = useState(0);
  const [nexLine, setNexLine] = useState('');

  const ctxBase = useMemo(() => ({
    subject: currentQuiz?.subject || 'Science',
    topic: currentQuiz?.topic || 'core concepts',
    grade: currentQuiz?.grade ?? activeStudent?.grade ?? 10,
    history: asked.map((q) => ({ topic: currentQuiz.topic, correct: q.correct })),
  }), [currentQuiz, asked, activeStudent]);

  // Generate the next question through the council.
  const nextQuestion = useCallback(async (performanceNow, diffNow) => {
    setGenerating(true);
    setGenError(null);
    setSelected(null);
    setTyped('');
    setSubmitted(false);
    setTeaching(false);
    const evts = [];
    const push = (e) => { evts.push(e); setEvents([...evts]); };
    try {
      const q = await runQuestionCycle(
        { ...ctxBase, difficulty: diffNow, ...performanceNow },
        { onEvent: push }
      );
      setQuestion(q);
      if (q.difficulty) setDifficulty(q.difficulty);
      const action = deriveDirectorAction('question_shown', { streak: performanceNow.streak || 0 });
      nexEngine.dispatch(action);
      setNexLine(action.speech);
    } catch (err) {
      setGenError(err?.message || 'The council could not be reached.');
    } finally {
      setGenerating(false);
    }
  }, [ctxBase]);

  // Kick off the session.
  useEffect(() => {
    // First question runs as a microtask so no setState fires synchronously
    // inside the effect body (avoiding cascading renders on mount).
    let alive = true;
    Promise.resolve().then(() => {
      if (alive) nextQuestion({ correctCount: 0, incorrectCount: 0, streak: 0 }, difficulty);
    });
    voiceSynthesizer.unlock?.();
    return () => {
      alive = false;
      voiceSynthesizer.stop?.();
      nexEngine.dispatch(deriveDirectorAction('return_to_idle'));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Session timer.
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const speak = useCallback((text) => {
    setNexLine(text);
    try { voiceSynthesizer.speak?.(text, () => {}); } catch { /* voice is optional */ }
  }, []);

  /* ------------------------------------------------------------------
     Answer evaluation — per-type aware.
  ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------
     The "I'm stuck" sequence — the centerpiece.
     Nex visibly reacts FIRST (turn, lean, enter teaching), his line
     settles, THEN the whiteboard mounts. Never an instant swap.
     Declared before evaluate — evaluate schedules it on a wrong answer.
  ------------------------------------------------------------------ */
  const beginTeaching = useCallback(() => {
    const action = deriveDirectorAction('student_stuck', {});
    nexEngine.dispatch(action);
    setNexLine(action.speech);
    setTimeout(() => {
      setTeaching(true);
      setTeachStep(0);
      const start = deriveDirectorAction('teaching_started', {});
      nexEngine.dispatch(start);
    }, 900);
  }, []);

  const evaluate = useCallback(() => {
    if (!question || submitted) return;
    const type = question.questionType;
    const studentAnswer = (type === 'MCQ' || type === 'TRUE_FALSE') ? (selected ?? '') : typed;

    if (!String(studentAnswer).trim()) return;
    setSubmitted(true);
    voiceSynthesizer.stop?.();

    let correct = false;
    if (type === 'NUMERICAL') {
      const norm = (v) => String(v).replace(/,/g, '.').trim();
      const a = parseFloat(norm(studentAnswer));
      const b = parseFloat(norm(question.correctAnswer));
      correct = Number.isFinite(a) && Number.isFinite(b)
        ? Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 0.005)
        : String(studentAnswer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
    } else {
      correct = String(studentAnswer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
    }
    setIsCorrect(correct);

    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);
    setAsked((prev) => [...prev, { question: question.question, correct }]);

    if (correct) {
      setScore((s) => s + 1);
      const action = deriveDirectorAction('answer_correct', { streak: nextStreak });
      nexEngine.dispatch(action);
      speak(action.speech);
    } else {
      // Wrong answer: Nex reacts supportively, then we go teach — paced.
      const action = deriveDirectorAction('answer_incorrect', {});
      nexEngine.dispatch(action);
      speak(action.speech);
      setTimeout(() => beginTeaching(), 900);
    }
  }, [question, submitted, selected, typed, streak, speak, beginTeaching]);

  const handleStuck = useCallback(() => {
    if (generating || submitted) return;
    setSubmitted(true);
    setIsCorrect(false);
    setAsked((prev) => [...prev, { question: question?.question, correct: false }]);
    beginTeaching();
  }, [generating, submitted, question, beginTeaching]);

  const stepTo = useCallback((i) => {
    setTeachStep(i);
    const step = question?.steps?.[i];
    const action = deriveDirectorAction('teaching_step', { stepCaption: step?.caption });
    nexEngine.dispatch(action);
    if (step?.narration) speak(step.narration);
  }, [question, speak]);

  const exitTeaching = useCallback(() => {
    nexEngine.dispatch(deriveDirectorAction('teaching_ended', {}));
    setTeaching(false);
  }, []);

  /* ------------------------------------------------------------------
     Session end — record honestly, return to hub.
  ------------------------------------------------------------------ */
  const endSession = useCallback(async () => {
    voiceSynthesizer.stop?.();
    const timeSpent = Math.round((Date.now() - startedRef.current) / 1000);
    try {
      if (activeStudent && asked.length > 0) {
        await recordQuizResult(
          activeStudent.id, currentQuiz.subject, currentQuiz.topic,
          difficulty, asked, score, timeSpent
        );
      }
    } finally {
      setCurrentQuiz(null);
    }
  }, [activeStudent, asked, score, difficulty, currentQuiz, recordQuizResult, setCurrentQuiz]);

  const nextQuestionBtn = useCallback(() => {
    if (qIndex + 1 >= QUESTION_COUNT) { endSession(); return; }
    setQIndex((i) => i + 1);
    nextQuestion(
      { correctCount: score, incorrectCount: (qIndex + 1) - score, streak, avgTime: seconds / (qIndex + 1) },
      difficulty
    );
  }, [qIndex, score, streak, seconds, difficulty, nextQuestion, endSession]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  /* ------------------------------------------------------------------ */

  if (generating && !question) {
    return (
      <div className="q-loading">
        <div className="q-loading__grid">
          <div>
            <Label>Council in session</Label>
            <p className="q-loading__lede">
              Thirteen agents are working — this is the real run, not a spinner.
            </p>
          </div>
          <AgentMonitor events={events} agents={AGENTS} running title="Question cycle" />
        </div>
      </div>
    );
  }

  if (genError && !question) {
    return (
      <div className="q-loading">
        <div className="q-error">
          <h2>The council couldn&rsquo;t be reached.</h2>
          <p>{genError}</p>
          <div className="q-error__row">
            <Button variant="secondary" size="sm" onClick={() => nextQuestion({ correctCount: score, incorrectCount: 0, streak }, difficulty)}>Try again</Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentQuiz(null)}>Back to topics</Button>
          </div>
        </div>
      </div>
    );
  }

  const type = question.questionType;

  return (
    <div className={`q-shell ${teaching ? 'q-shell--teaching' : ''}`}>
      <header className="q-top">
        <div className="q-top__left">
          <span className="nx-label">Session</span>
          <span className="q-top__topic">{currentQuiz.subject} · {currentQuiz.topic}</span>
        </div>
        <div className="q-top__stats">
          <Chip>Q {qIndex + 1} / {QUESTION_COUNT}</Chip>
          <Chip>Score {score}</Chip>
          {streak >= 2 && <Chip tone="resolve">Streak {streak}</Chip>}
          <Chip tone="amber">{difficulty}</Chip>
          <span className="nx-num q-top__time">{mm}:{ss}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={endSession}>End session</Button>
      </header>

      <div className="q-body">
        <section className={`q-main ${teaching ? 'q-main--narrow' : ''}`} aria-live="polite">
          {teaching ? (
            <Suspense fallback={<div className="q-board-loading">Preparing the whiteboard…</div>}>
              <TeachingWhiteboard
                question={question}
                steps={question.steps?.length ? question.steps : null}
                activeStep={teachStep}
                onStep={stepTo}
                onExit={exitTeaching}
              />
            </Suspense>
          ) : (
            <>
              <div className="q-question">
                <Label plain>{typeLabel(type)}</Label>
                <h2 className="q-question__text">{question.question}</h2>
                {question.syllabusRef && <p className="q-question__ref">{question.syllabusRef}</p>}
              </div>

              <div className="q-answer">
                {type === 'MCQ' && (
                  <div className="q-options" role="radiogroup" aria-label="Answer options">
                    {question.choices?.map((c, i) => (
                      <button
                        key={c}
                        className={`nx-quiz-option ${selected === c ? 'nx-quiz-option--selected' : ''} ${
                          submitted && c === question.correctAnswer ? 'nx-quiz-option--correct' : ''
                        } ${submitted && selected === c && c !== question.correctAnswer ? 'nx-quiz-option--wrong' : ''}`}
                        onClick={() => !submitted && setSelected(c)}
                        disabled={submitted}
                      >
                        <span className="nx-quiz-option__key">{String.fromCharCode(65 + i)}</span>
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {type === 'TRUE_FALSE' && (
                  <div className="q-options q-options--tf">
                    {['True', 'False'].map((c) => (
                      <button
                        key={c}
                        className={`nx-quiz-option ${selected === c ? 'nx-quiz-option--selected' : ''} ${
                          submitted && c.toLowerCase() === String(question.correctAnswer).toLowerCase() ? 'nx-quiz-option--correct' : ''
                        } ${submitted && selected === c && c.toLowerCase() !== String(question.correctAnswer).toLowerCase() ? 'nx-quiz-option--wrong' : ''}`}
                        onClick={() => !submitted && setSelected(c)}
                        disabled={submitted}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {type === 'FILL_BLANK' && (
                  <FillBlank question={question.question} value={typed} onChange={setTyped} disabled={submitted} />
                )}

                {type === 'SHORT_ANSWER' && (
                  <textarea
                    className="nx-concept-input"
                    placeholder="Write your answer…"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    disabled={submitted}
                    rows={3}
                  />
                )}

                {type === 'NUMERICAL' && (
                  <div className="q-num">
                    <input
                      className="nx-num-input"
                      inputMode="decimal"
                      placeholder="0"
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      disabled={submitted}
                      aria-label="Numerical answer"
                    />
                  </div>
                )}

                {type === 'CONCEPTUAL' && (
                  <div className="q-concept">
                    <textarea
                      className="nx-concept-input q-concept__ta"
                      placeholder="Explain in your own words — structure beats length."
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      disabled={submitted}
                      rows={5}
                    />
                    <span className="q-concept__count nx-num">{typed.trim() ? `${typed.trim().split(/\s+/).length} words` : ''}</span>
                  </div>
                )}
              </div>

              {!submitted && (
                <div className="q-actions">
                  <Button variant="primary" onClick={evaluate}>Check answer</Button>
                  <Button variant="secondary" size="sm" onClick={handleStuck}>I&rsquo;m stuck</Button>
                </div>
              )}

              {submitted && !teaching && (
                <div className={`q-result ${isCorrect ? 'q-result--ok' : 'q-result--no'}`}>
                  <Label plain>{isCorrect ? 'Correct' : 'Not this time'}</Label>
                  <p>{question.motivator || 'Take the next one steady.'}</p>
                  {question.examTips && <p className="q-result__tip">{question.examTips}</p>}
                  <Button variant="primary" size="sm" onClick={nextQuestionBtn}>
                    {qIndex + 1 >= QUESTION_COUNT ? 'Finish session' : 'Next question'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="q-rail">
          <div className="q-rail__nex">
            <Nex dock speechBubble={nexLine} />
          </div>
          {generating && <AgentMonitor events={events} agents={AGENTS} compact title="Next question" />}
        </aside>
      </div>
    </div>
  );
}

function typeLabel(t) {
  return {
    MCQ: 'Multiple choice',
    TRUE_FALSE: 'True or false',
    FILL_BLANK: 'Fill the blank',
    SHORT_ANSWER: 'Short answer',
    NUMERICAL: 'Numerical',
    CONCEPTUAL: 'Conceptual',
  }[t] || 'Question';
}

function FillBlank({ question: text, value, onChange, disabled }) {
  const parts = String(text).split(/(_{2,}|\[?blank\]?)/i);
  return (
    <div className="q-fill">
      {parts.map((p, i) =>
        /^(_{2,}|\[?blank\]?)$/i.test(p)
          ? <input key={i} className="q-fill__input" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} aria-label="Your answer" placeholder="answer" />
          : <span key={i}>{p}</span>
      )}
    </div>
  );
}
