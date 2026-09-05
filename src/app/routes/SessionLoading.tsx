import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { NexLogo } from '../../components/mascot/NexLogo';
import { AlertCircle, RefreshCw, ArrowLeft, Sparkles, CheckCircle2 } from '../../components/icons';
import { generateFullSessionConcurrently, SessionQuestion } from '../../lib/api/harmony';

export const SessionLoading: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navState = (location.state as {
    subject?: string;
    grade?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    topic?: string;
  }) || {};

  const rawSubject = typeof navState.subject === 'string' ? navState.subject : sessionStorage.getItem('current_quiz_subject');
  const subject = (typeof rawSubject === 'string' && !rawSubject.includes('[object')) ? rawSubject : 'Science';
  const rawGrade = typeof navState.grade === 'number' ? navState.grade : Number(sessionStorage.getItem('current_quiz_grade'));
  const grade = (typeof rawGrade === 'number' && !isNaN(rawGrade) && rawGrade > 0) ? rawGrade : 10;
  const rawDiff = typeof navState.difficulty === 'string' ? navState.difficulty : (sessionStorage.getItem('current_quiz_difficulty') as any);
  const difficulty = (rawDiff === 'easy' || rawDiff === 'hard') ? rawDiff : 'medium';
  const rawTopic = typeof navState.topic === 'string' ? navState.topic : sessionStorage.getItem('current_quiz_topic');
  const topic = (typeof rawTopic === 'string' && !rawTopic.includes('[object')) ? rawTopic : 'Core Principles';

  const [completedCount, setCompletedCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing multi-agent session...');
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);

  const TOTAL_QUESTIONS = 5;
  const hasTriggeredRef = useRef(false);

  // Looping Mascot Blink & Bob cycle (Section 4)
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const loopBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
      const nextDelay = 3000 + Math.random() * 2000;
      blinkTimeout = setTimeout(loopBlink, nextDelay);
    };
    blinkTimeout = setTimeout(loopBlink, 2500);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Execution: Concurrently generate all 5 questions
  const startSessionGeneration = async () => {
    setErrorState(null);
    setCompletedCount(0);
    setStatusMessage('Formulating curriculum questions...');

    try {
      const questions: SessionQuestion[] = await generateFullSessionConcurrently(
        subject,
        topic,
        grade,
        difficulty,
        (done, total) => {
          setCompletedCount(done);
          if (done < total) {
            setStatusMessage(`Calibrating question ${done + 1} of ${total} with step derivations...`);
          } else {
            setStatusMessage('All 5 questions and whiteboard derivations ready!');
          }
        }
      );

      if (!questions || questions.length === 0) {
        throw new Error('No questions could be assembled.');
      }

      // Store pre-generated session bundle into sessionStorage
      sessionStorage.setItem('current_quiz_session_questions', JSON.stringify(questions));
      sessionStorage.setItem('current_quiz_subject', subject);
      sessionStorage.setItem('current_quiz_grade', String(grade));
      sessionStorage.setItem('current_quiz_difficulty', difficulty);
      sessionStorage.setItem('current_quiz_topic', topic);

      // Brief moment to show 100% completion before auto-redirecting
      setTimeout(() => {
        navigate('/quiz');
      }, 400);
    } catch (err: any) {
      console.error('Session generation error:', err);
      setErrorState(
        err?.message || 'Unable to finalize session. Please retry calibration.'
      );
    }
  };

  useEffect(() => {
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      startSessionGeneration();
    }
  }, []);

  const progressPercent = Math.min(100, Math.round((completedCount / TOTAL_QUESTIONS) * 100));

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-6 relative select-none font-body">
      {/* Background Soft Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none blur-[120px] opacity-20"
        style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
      />

      <div className="max-w-md w-full text-center relative z-10 space-y-8">
        {/* Animated Mascot Loading Stage (Section 4) */}
        <div className="relative inline-flex items-center justify-center">
          {/* Subtle Rotating Orbital Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 rounded-full border border-dashed border-[var(--color-accent)]/30 pointer-events-none"
          />

          {/* Bobbing Mascot Container */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            {/* Mascot SVG */}
            <svg
              width="140"
              height="140"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              <defs>
                <radialGradient id="loadOrbGrad" cx="40%" cy="35%" r="65%" fx="35%" fy="30%">
                  <stop offset="0%" stopColor="#FFA18A" />
                  <stop offset="45%" stopColor="#FF6B4A" />
                  <stop offset="90%" stopColor="#C94426" />
                  <stop offset="100%" stopColor="#962A14" />
                </radialGradient>
                <linearGradient id="loadVisor" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1E2330" />
                  <stop offset="100%" stopColor="#0B0D12" />
                </linearGradient>
                <filter id="loadEyeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Main Body */}
              <path
                d="M 100 18 C 148 18, 182 52, 182 100 C 182 148, 146 182, 100 182 C 54 182, 18 148, 18 100 C 18 52, 52 18, 100 18 Z"
                fill="url(#loadOrbGrad)"
              />

              {/* Specular Highlight */}
              <path
                d="M 52 42 C 72 26, 128 26, 148 42"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Visor */}
              <rect
                x="44"
                y="76"
                width="112"
                height="48"
                rx="24"
                fill="url(#loadVisor)"
                stroke="#262B38"
                strokeWidth="2.5"
              />

              {/* Left Eye */}
              <motion.ellipse
                cx="76"
                cy="100"
                rx="9"
                ry="12"
                fill="#3DD9A4"
                filter="url(#loadEyeGlow)"
                animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
                transition={{ duration: 0.1 }}
              />
              {!isBlinking && <circle cx="73" cy="95" r="2.5" fill="#FFFFFF" opacity="0.9" />}

              {/* Right Eye */}
              <motion.ellipse
                cx="124"
                cy="100"
                rx="9"
                ry="12"
                fill="#3DD9A4"
                filter="url(#loadEyeGlow)"
                animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
                transition={{ duration: 0.1 }}
              />
              {!isBlinking && <circle cx="121" cy="95" r="2.5" fill="#FFFFFF" opacity="0.9" />}

              {/* Smile */}
              <path
                d="M 92 110 Q 100 115 108 110"
                stroke="#A0A6B4"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </motion.div>
        </div>

        {/* Message & Session Meta */}
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-black text-[var(--color-text-primary)] tracking-tight">
            Your questions are on the way
          </h2>
          <p className="text-xs font-mono text-[var(--color-text-secondary)]">
            {subject} &bull; {topic} &bull; Grade {grade} ({difficulty.toUpperCase()})
          </p>
          <p className="text-xs text-[var(--color-accent)] font-mono animate-pulse min-h-[20px]">
            {statusMessage}
          </p>
        </div>

        {/* Real Progress Bar & Counter (Section 6) */}
        {!errorState && (
          <div className="space-y-2.5 p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--color-text-secondary)]">Concurrent Calibration</span>
              <span className="font-bold text-[var(--color-text-primary)]">
                {completedCount} of {TOTAL_QUESTIONS} Ready ({progressPercent}%)
              </span>
            </div>
            <ProgressBar value={progressPercent} variant="accent" size="sm" />
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-tertiary)] pt-1">
              <span>Parallel Question Synthesis</span>
              <span>Sub-second Pre-Generation</span>
            </div>
          </div>
        )}

        {/* Timeout / Error Guard State */}
        <AnimatePresence>
          {errorState && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-danger)]/50 shadow-lg space-y-3 text-left"
            >
              <div className="flex items-start gap-2.5 text-xs text-[var(--color-danger)]">
                <Icon icon={AlertCircle} size={18} className="shrink-0 mt-0.5" />
                <span>{errorState}</span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => startSessionGeneration()}
                  className="gap-1.5"
                >
                  <Icon icon={RefreshCw} size={14} />
                  <span>Retry Generation</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate('/session/setup')}
                >
                  <span>Return to Setup</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
