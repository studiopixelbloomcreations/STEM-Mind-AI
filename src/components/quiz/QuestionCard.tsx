import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Lightbulb, HelpCircle, X, Sparkles } from '../icons';
import { AnswerInput } from './AnswerInput';
import { StuckButton } from './StuckButton';
import { FeedbackBanner } from './FeedbackBanner';
import { QuizQuestionPayload, TeachingStep, explainWrongAnswer } from '../../lib/api/harmony';

export interface QuestionCardProps {
  question: QuizQuestionPayload;
  questionIndex: number;
  totalQuestions: number;
  onAnswerSubmit: (isCorrect: boolean) => void;
  onNextQuestion: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  onAnswerSubmit,
  onNextQuestion,
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [submissionState, setSubmissionState] = useState<'unanswered' | 'correct' | 'incorrect' | 'teaching'>('unanswered');
  const [teachingSteps, setTeachingSteps] = useState<TeachingStep[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);

  // Real Hesitation Detection (Section 4)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [switchCount, setSwitchCount] = useState(0);
  const [showHesitationNudge, setShowHesitationNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [revealedHint, setRevealedHint] = useState<string | null>(null);
  const prevAnswerRef = useRef('');

  // Reset hesitation trackers on question index change
  useEffect(() => {
    setUserAnswer('');
    setSubmissionState('unanswered');
    setTeachingSteps([]);
    setIsLoadingSteps(false);
    setElapsedSeconds(0);
    setSwitchCount(0);
    setShowHesitationNudge(false);
    setNudgeDismissed(false);
    setRevealedHint(null);
    prevAnswerRef.current = '';
  }, [questionIndex]);

  // Track elapsed inspection time per question
  useEffect(() => {
    if (submissionState !== 'unanswered' || nudgeDismissed || showHesitationNudge) return;

    const timer = setInterval(() => {
      setElapsedSeconds((sec) => sec + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [submissionState, nudgeDismissed, showHesitationNudge]);

  // Track secondary hesitation signal: switching answers / editing repeatedly
  const handleAnswerChange = (val: string) => {
    if (prevAnswerRef.current && val !== prevAnswerRef.current) {
      setSwitchCount((c) => c + 1);
    }
    prevAnswerRef.current = val;
    setUserAnswer(val);
  };

  // Compute adaptive threshold based on difficulty, type, and hesitation signals
  const getHesitationThreshold = () => {
    let base = 24; // baseline seconds
    if (question.difficulty === 'easy') base = 18;
    if (question.difficulty === 'hard') base = 35;
    if (question.questionType === 'NUMERICAL') base += 6;
    // Each option flip/edit deducts 3s from the trigger time
    const acceleration = Math.min(12, switchCount * 3);
    return Math.max(10, base - acceleration);
  };

  // Evaluate proactive hesitation trigger
  useEffect(() => {
    if (
      submissionState === 'unanswered' &&
      !nudgeDismissed &&
      !showHesitationNudge &&
      !revealedHint &&
      elapsedSeconds >= getHesitationThreshold()
    ) {
      setShowHesitationNudge(true);
    }
  }, [elapsedSeconds, switchCount, submissionState, nudgeDismissed, showHesitationNudge, revealedHint]);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    const trimmedUser = userAnswer.trim().toLowerCase();
    const trimmedTarget = question.correctAnswer.trim().toLowerCase();

    // Numerical evaluation with tolerance
    let correct = false;
    if (question.questionType === 'NUMERICAL') {
      const numUser = parseFloat(trimmedUser);
      const numTarget = parseFloat(trimmedTarget);
      if (!isNaN(numUser) && !isNaN(numTarget)) {
        const diff = Math.abs(numUser - numTarget);
        correct = diff <= Math.abs(numTarget) * 0.02 || diff < 0.01;
      } else {
        correct = trimmedUser === trimmedTarget;
      }
    } else {
      correct = trimmedUser === trimmedTarget;
    }

    if (correct) {
      setSubmissionState('correct');
      onAnswerSubmit(true);
    } else {
      setSubmissionState('incorrect');
      onAnswerSubmit(false);
      // Fetch step-by-step repair
      setIsLoadingSteps(true);
      try {
        const steps = await explainWrongAnswer(question.question, question.correctAnswer, userAnswer);
        setTeachingSteps(steps);
      } finally {
        setIsLoadingSteps(false);
      }
    }
  };

  const handleStuck = async () => {
    setSubmissionState('teaching');
    setIsLoadingSteps(true);
    try {
      const steps = await explainWrongAnswer(question.question, question.correctAnswer, 'Uncertain');
      setTeachingSteps(steps);
    } finally {
      setIsLoadingSteps(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
      {/* Header telemetry */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--color-accent)] font-bold">
            QUESTION {questionIndex + 1} / {totalQuestions}
          </span>
          <Badge variant="default">{question.syllabusRef || 'Syllabus Standard'}</Badge>
        </div>
        <Badge variant={question.difficulty === 'hard' ? 'warning' : 'default'}>
          {question.difficulty || 'Medium'}
        </Badge>
      </div>

      {/* Main Question Text */}
      <h3 className="text-xl lg:text-2xl font-display font-bold text-[var(--color-text-primary)] mb-8 leading-snug">
        {question.question}
      </h3>

      {/* Proactive Hesitation Detection Nudge (Section 4) */}
      <AnimatePresence>
        {showHesitationNudge && submissionState === 'unanswered' && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.65, 0, 0.35, 1] }}
            className="mb-6 p-4 rounded-xl liquid-glass border border-[var(--color-accent)]/40 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center font-display font-bold text-xs shrink-0 shadow-sm">
                  N
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-wider">
                      Nex Support Check-in
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">
                      Hesitation Telemetry
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)] font-medium leading-relaxed">
                    Noticing you&apos;re taking your time on this derivation. Would you like a nudge on the core syllabus principle, or want to keep working independently?
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNudgeDismissed(true);
                  setShowHesitationNudge(false);
                }}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 shrink-0 transition-colors"
                aria-label="Dismiss assistance"
              >
                <Icon icon={X} size={14} />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-3 pt-3 border-t border-[var(--color-border)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNudgeDismissed(true);
                  setShowHesitationNudge(false);
                }}
                className="text-xs"
              >
                I&apos;ve Got This
              </Button>

              {question.hint && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setRevealedHint(question.hint || 'Check fundamental principles.');
                    setShowHesitationNudge(false);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Icon icon={Lightbulb} size={13} className="text-[var(--color-accent)]" />
                  <span>Show Hint</span>
                </Button>
              )}

              <Button
                variant="stuck"
                size="sm"
                onClick={handleStuck}
                className="text-xs gap-1.5"
              >
                <Icon icon={HelpCircle} size={13} />
                <span>Explain with Nex</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revealed Hint Banner */}
      <AnimatePresence>
        {revealedHint && submissionState === 'unanswered' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-3.5 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-accent)]/30 text-xs text-[var(--color-text-primary)] flex items-start gap-2.5"
          >
            <Icon icon={Lightbulb} size={16} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-mono font-bold text-[var(--color-accent)] block mb-0.5 uppercase text-[10px]">
                Target Principle Hint
              </span>
              <p className="leading-relaxed">{revealedHint}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer Form Input Section */}
      <div className="mb-8">
        <AnswerInput
          questionType={question.questionType}
          choices={question.choices}
          value={userAnswer}
          onChange={handleAnswerChange}
          disabled={submissionState !== 'unanswered'}
          status={submissionState === 'correct' ? 'correct' : submissionState === 'incorrect' ? 'incorrect' : 'idle'}
        />
      </div>

      {/* Primary Action + "I'm Stuck" Button Row */}
      {submissionState === 'unanswered' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--color-border)]">
          <StuckButton onClick={handleStuck} disabled={isLoadingSteps} />

          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!userAnswer.trim() || isLoadingSteps}
            className="w-full sm:w-auto px-6"
          >
            Submit Answer
          </Button>
        </div>
      )}

      {/* Feedback & Teaching Transition State */}
      {submissionState !== 'unanswered' && (
        <FeedbackBanner
          status={submissionState}
          correctAnswer={question.correctAnswer}
          explanationSteps={teachingSteps}
          examTips={question.examTips}
          onContinue={onNextQuestion}
        />
      )}
    </Card>
  );
};
