import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Icon } from '../../components/ui/Icon';
import { NexLogo } from '../../components/mascot/NexLogo';
import { NexPlaceholder } from '../../components/mascot/NexPlaceholder';
import {
  generateQuestionFromCouncil,
  generateFullSessionConcurrently,
  SessionQuestion,
} from '../../lib/api/harmony';
import { X, Sparkles, Flame, CheckCircle2 } from '../../components/icons';

export const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [subject, setSubject] = useState<string>('Science');
  const [grade, setGrade] = useState<number>(10);
  const [topic, setTopic] = useState<string>('Core Principles');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const TOTAL_QUESTIONS = 5;

  useEffect(() => {
    const savedSubject = sessionStorage.getItem('current_quiz_subject') || 'Science';
    const savedGrade = Number(sessionStorage.getItem('current_quiz_grade')) || 10;
    const savedDifficulty = (sessionStorage.getItem('current_quiz_difficulty') as any) || 'medium';
    const savedTopic = sessionStorage.getItem('current_quiz_topic') || 'Core Principles';

    setSubject(savedSubject);
    setGrade(savedGrade);
    setDifficulty(savedDifficulty);
    setTopic(savedTopic);

    // 1. Check if returning from Teaching or Correction screen
    const navState = location.state as { resumeFromIndex?: number } | undefined;
    const resumeIndex = navState?.resumeFromIndex ?? null;

    // 2. Load pre-generated questions from session storage (Section 1.3)
    const rawQuestions = sessionStorage.getItem('current_quiz_session_questions');
    if (rawQuestions) {
      try {
        const parsed: SessionQuestion[] = JSON.parse(rawQuestions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessionQuestions(parsed);
          setLoading(false);
          if (resumeIndex !== null) {
            if (resumeIndex >= parsed.length) {
              finishSession(score);
              return;
            }
            setCurrentIndex(resumeIndex);
          }
          return;
        }
      } catch (e) {
        console.warn('Failed to parse cached session questions:', e);
      }
    }

    // 3. Fallback if user navigated directly without loading screen
    generateFullSessionConcurrently(savedSubject, savedTopic, savedGrade, savedDifficulty)
      .then((qs) => {
        setSessionQuestions(qs);
        sessionStorage.setItem('current_quiz_session_questions', JSON.stringify(qs));
        if (resumeIndex !== null) {
          setCurrentIndex(Math.min(qs.length - 1, resumeIndex));
        }
      })
      .finally(() => setLoading(false));
  }, [location.state]);

  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const finishSession = (finalScore: number) => {
    // Record cross-session history for Section 0's adaptive difficulty engine
    try {
      const historyStr = localStorage.getItem('nexlearn_performance_history') || '{}';
      const history = JSON.parse(historyStr);
      const existing = history[subject] || { correct: 0, totalAnswered: 0, sessions: 0 };
      existing.correct += finalScore;
      existing.totalAnswered += TOTAL_QUESTIONS;
      existing.sessions += 1;
      history[subject] = existing;
      localStorage.setItem('nexlearn_performance_history', JSON.stringify(history));
    } catch (e) {
      // fallback
    }

    sessionStorage.setItem('quiz_final_score', String(finalScore));
    sessionStorage.setItem('quiz_total_count', String(TOTAL_QUESTIONS));
    sessionStorage.setItem('quiz_subject', subject);
    navigate('/results');
  };

  const handleNextQuestion = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= TOTAL_QUESTIONS) {
      finishSession(score);
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  const handleGoToTeaching = () => {
    const currentQ = sessionQuestions[currentIndex];
    navigate('/session/teach', {
      state: {
        question: currentQ,
        questionIndex: Number(currentIndex),
        totalQuestions: Number(TOTAL_QUESTIONS),
        subject: String(subject),
      },
    });
  };

  const handleGoToCorrection = (userAnswer: any) => {
    const safeAnswer = typeof userAnswer === 'string' ? userAnswer : String(userAnswer || '');
    const currentQ = sessionQuestions[currentIndex];
    navigate('/session/correct', {
      state: {
        question: currentQ,
        userAnswer: safeAnswer,
        questionIndex: Number(currentIndex),
        totalQuestions: Number(TOTAL_QUESTIONS),
        subject: String(subject),
      },
    });
  };

  const activeQuestion = sessionQuestions[currentIndex];

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col p-6 lg:p-12 relative font-body select-none">
      {/* Quiz Top Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[var(--color-border)] mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/hub')}
            aria-label="Exit Session"
            className="p-2"
          >
            <Icon icon={X} size={18} />
          </Button>
          <div className="flex items-center gap-3">
            <NexLogo size={26} />
            <div>
              <span className="text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider block font-bold">
                {subject} &bull; {topic}
              </span>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Question {currentIndex + 1} of {TOTAL_QUESTIONS}
              </h4>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-warning)]">
            <Icon icon={Flame} size={16} />
            <span>{streak} STREAK</span>
          </div>
          <div className="w-32 hidden sm:block">
            <ProgressBar
              value={((currentIndex + 1) / TOTAL_QUESTIONS) * 100}
              variant="accent"
              size="sm"
            />
          </div>
        </div>
      </header>

      {/* Main Question Stage */}
      <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center">
        {loading || !activeQuestion ? (
          <div className="w-full max-w-3xl mx-auto p-8 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton width="140px" height="20px" />
              <Skeleton width="80px" height="20px" />
            </div>
            <Skeleton width="100%" height="64px" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <Skeleton width="100%" height="48px" />
              <Skeleton width="100%" height="48px" />
              <Skeleton width="100%" height="48px" />
              <Skeleton width="100%" height="48px" />
            </div>
            <div className="pt-4 flex justify-between">
              <Skeleton width="140px" height="36px" />
              <Skeleton width="120px" height="36px" />
            </div>
          </div>
        ) : (
          <QuestionCard
            question={activeQuestion}
            questionIndex={currentIndex}
            totalQuestions={TOTAL_QUESTIONS}
            onAnswerSubmit={handleAnswerSubmit}
            onNextQuestion={handleNextQuestion}
            onGoToTeaching={handleGoToTeaching}
            onGoToCorrection={handleGoToCorrection}
          />
        )}
      </main>

      {/* Mascot docked bottom-right in quiz mode */}
      <div className="fixed bottom-6 right-6 z-30 hidden sm:block pointer-events-none">
        <div className="relative p-2 rounded-xl bg-[var(--color-bg-surface)] backdrop-blur border border-[var(--color-border)] shadow-md flex items-center gap-3 pr-4 pointer-events-auto">
          <NexPlaceholder size={52} />
          <div className="text-left">
            <span className="text-[10px] font-mono text-[var(--color-accent)] block font-bold">NEX TUTOR ONLINE</span>
            <span className="text-xs font-medium text-[var(--color-text-primary)]">Ready to explain if stuck</span>
          </div>
        </div>
      </div>
    </div>
  );
};
