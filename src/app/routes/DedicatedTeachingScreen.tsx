import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { NexLogo } from '../../components/mascot/NexLogo';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  X,
} from '../../components/icons';
import { voiceSynthesizer } from '../../utils/voiceSynthesizer';
import { SessionQuestion, SessionTeachingStep } from '../../lib/api/harmony';

export const DedicatedTeachingScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as {
    question?: SessionQuestion;
    questionIndex?: number;
    totalQuestions?: number;
    subject?: string;
  }) || {};

  const question = state.question || {
    id: 'sample',
    question: 'How do you solve this STEM problem?',
    questionType: 'MCQ',
    correctAnswer: 'Correct solution',
    hint: 'Review the given conditions',
    howToApproach: 'Identify known variables and apply the governing formula.',
    difficulty: 'medium',
    teachingSteps: [
      {
        stepNumber: 1,
        title: 'Identify the Given Variables',
        visual: `<div style="padding:16px; border:1px solid #38bdf8; border-radius:12px; text-align:center; font-family:monospace; background:rgba(56,189,248,0.06);"><strong>Step 1:</strong> Extract the parameters from the problem text.</div>`,
        speech: 'Do not worry at all. Let us take a deep breath and look at what the problem is asking. First, we identify each number given to us.',
      },
      {
        stepNumber: 2,
        title: 'Choose the Formula Connecting Them',
        visual: `<div style="padding:16px; border:1px solid #34d399; border-radius:12px; text-align:center; font-family:monospace; background:rgba(52,211,153,0.06);"><strong>Step 2:</strong> Substitute your knowns into the governing equation.</div>`,
        speech: 'Next, we select the formula that connects our known values to the unknown quantity, keeping our units consistent.',
      },
      {
        stepNumber: 3,
        title: 'Calculate and Verify the Solution',
        visual: `<div style="padding:16px; border:1px solid #fbbf24; border-radius:12px; text-align:center; font-family:monospace; background:rgba(251,191,36,0.06);"><strong>Step 3:</strong> Solve step by step to arrive at the solution.</div>`,
        speech: 'Now we simplify carefully. And look at that! We have arrived right at the correct answer.',
      },
    ],
  };

  const steps = question.teachingSteps && question.teachingSteps.length > 0
    ? question.teachingSteps
    : [
        {
          stepNumber: 1,
          title: 'Understanding the Core Question',
          visual: `<div style="padding:16px; text-align:center;">${question.question}</div>`,
          speech: 'Take your time. Let us walk through how this question works together.',
        },
      ];

  const questionIndex = state.questionIndex ?? 0;
  const totalQuestions = state.totalQuestions ?? 5;
  const subject = state.subject || sessionStorage.getItem('current_quiz_subject') || 'Science';

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasCompletedAllSteps, setHasCompletedAllSteps] = useState(false);
  const isCancelledRef = useRef(false);

  // Play narration for current step and automatically advance when speech completes
  useEffect(() => {
    isCancelledRef.current = false;
    const activeStep = steps[currentStepIndex];
    if (!activeStep) return;

    if (!isMuted) {
      setIsPlayingVoice(true);
      voiceSynthesizer.speak(
        activeStep.speech,
        () => {
          if (!isCancelledRef.current) setIsPlayingVoice(true);
        },
        () => {
          if (isCancelledRef.current) return;
          setIsPlayingVoice(false);

          // Auto-advance to next step if more steps remain
          if (currentStepIndex < steps.length - 1) {
            setTimeout(() => {
              if (!isCancelledRef.current) {
                setCurrentStepIndex((prev) => prev + 1);
              }
            }, 1200); // Gentle pause between steps
          } else {
            setHasCompletedAllSteps(true);
          }
        }
      );
    }

    return () => {
      isCancelledRef.current = true;
      voiceSynthesizer.stop();
    };
  }, [currentStepIndex, isMuted]);

  const handleStepSelect = (idx: number) => {
    voiceSynthesizer.stop();
    setCurrentStepIndex(idx);
    if (idx === steps.length - 1) {
      setHasCompletedAllSteps(true);
    }
  };

  const handleReplayStep = () => {
    voiceSynthesizer.stop();
    const activeStep = steps[currentStepIndex];
    if (activeStep && !isMuted) {
      setIsPlayingVoice(true);
      voiceSynthesizer.speak(
        activeStep.speech,
        () => setIsPlayingVoice(true),
        () => setIsPlayingVoice(false)
      );
    }
  };

  const handleReturnToQuiz = () => {
    voiceSynthesizer.stop();
    // Return to quiz and move to the next question
    navigate('/quiz', {
      state: {
        resumeFromIndex: questionIndex + 1,
      },
    });
  };

  const activeStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col p-6 lg:p-12 relative select-none font-body">
      {/* Top Header Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[var(--color-border)] mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <NexLogo size={32} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-display font-extrabold text-[var(--color-text-primary)]">
                  Nex Whiteboard Tutoring
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)] font-mono text-[10px] font-bold uppercase border border-[var(--color-accent)]/30">
                  Step-by-Step
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--color-text-secondary)]">
                {subject} &bull; Question {questionIndex + 1} of {totalQuestions}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isPlayingVoice) voiceSynthesizer.stop();
              setIsMuted(!isMuted);
            }}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            title={isMuted ? 'Unmute voice narration' : 'Mute voice narration'}
          >
            <Icon icon={isMuted ? VolumeX : Volume2} size={18} className={isPlayingVoice ? 'text-[var(--color-accent)]' : ''} />
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleReturnToQuiz}
            className="gap-2 text-xs font-mono"
          >
            <span>Return to Quiz</span>
            <Icon icon={ArrowRight} size={14} />
          </Button>
        </div>
      </header>

      {/* Main Full-Screen Stage */}
      <main className="max-w-5xl w-full mx-auto flex-1 flex flex-col justify-between space-y-6">
        {/* Original Problem Header Card */}
        <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono text-[var(--color-accent)] font-bold uppercase tracking-wider">
              Problem Under Review
            </span>
            <span className="text-xs font-mono text-[var(--color-text-secondary)]">
              {question.syllabusRef || 'National Syllabus Standard'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--color-text-primary)] leading-snug">
            {question.question}
          </h2>
        </Card>

        {/* Step Progression Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {steps.map((st, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isPast = idx < currentStepIndex;
            return (
              <button
                key={st.stepNumber}
                type="button"
                onClick={() => handleStepSelect(idx)}
                className={`flex-1 min-w-[140px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30 shadow-sm'
                    : isPast
                    ? 'bg-[var(--color-bg-surface)] border-[var(--color-success)]/40 text-[var(--color-text-secondary)]'
                    : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold">STEP {idx + 1}</span>
                  {isPast && <Icon icon={CheckCircle2} size={12} className="text-[var(--color-success)]" />}
                  {isCurrent && isPlayingVoice && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]" />
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold font-display text-[var(--color-text-primary)] truncate">
                  {st.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Synchronized Whiteboard Stage */}
        <Card className="flex-1 p-8 sm:p-10 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl flex flex-col justify-between shadow-lg relative overflow-hidden">
          {/* Subtle Stage Background Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

          {/* Whiteboard Visual Display */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)]" />
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-[var(--color-text-primary)]">
                  {activeStep.title}
                </h3>
              </div>
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>

            {/* Render Synchronized HTML Visual */}
            <div
              className="py-6 px-4 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] shadow-inner text-[var(--color-text-primary)] font-mono text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: activeStep.visual }}
            />

            {/* Caring Voice Narration Bubble */}
            <div className="p-5 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-accent)]/30 flex items-start gap-4 shadow-sm">
              <div className="shrink-0 mt-0.5">
                <NexLogo size={36} />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-[var(--color-accent)]">
                    Nex (AI Tutor)
                  </span>
                  {isPlayingVoice && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--color-success)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                      Narrating...
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-primary)] leading-relaxed font-sans italic">
                  &ldquo;{activeStep.speech}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Whiteboard Controls & Auto-Advance Bar */}
          <div className="relative z-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReplayStep}
                className="gap-1.5 text-xs font-mono"
              >
                <Icon icon={RotateCcw} size={14} />
                <span>Replay Narration</span>
              </Button>

              {currentStepIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStepSelect(currentStepIndex - 1)}
                  className="gap-1 text-xs"
                >
                  <Icon icon={ArrowLeft} size={14} />
                  <span>Previous</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {currentStepIndex < steps.length - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleStepSelect(currentStepIndex + 1)}
                  className="gap-2 w-full sm:w-auto px-6"
                >
                  <span>Skip to Next Step</span>
                  <Icon icon={ArrowRight} size={15} />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleReturnToQuiz}
                  className="gap-2 w-full sm:w-auto px-6 bg-[var(--color-success)] hover:bg-[var(--color-success)]/90"
                >
                  <Icon icon={CheckCircle2} size={16} />
                  <span>Continue Quiz with Next Question</span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};
