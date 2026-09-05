import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Icon } from '../../components/ui/Icon';
import { NexPlaceholder } from '../../components/mascot/NexPlaceholder';
import { generateQuestionFromCouncil, QuizQuestionPayload } from '../../lib/api/harmony';
import { X, Sparkles, Flame } from '../../components/icons';

export const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('Physics');
  const [grade, setGrade] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestionPayload | null>(null);

  const TOTAL_QUESTIONS = 5;

  useEffect(() => {
    const savedSubject = sessionStorage.getItem('current_quiz_subject') || 'Physics';
    const savedGrade = Number(sessionStorage.getItem('current_quiz_grade')) || 10;
    setSubject(savedSubject);
    setGrade(savedGrade);
    loadQuestion(savedSubject, savedGrade, 0);
  }, []);

  const loadQuestion = async (subj: string, grd: number, index: number) => {
    setLoading(true);
    try {
      const q = await generateQuestionFromCouncil(subj, 'Core Principles', grd, 'medium');
      setCurrentQuestion(q);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= TOTAL_QUESTIONS) {
      // Store final score and navigate to results
      sessionStorage.setItem('quiz_final_score', String(score));
      sessionStorage.setItem('quiz_total_count', String(TOTAL_QUESTIONS));
      sessionStorage.setItem('quiz_subject', subject);
      navigate('/results');
    } else {
      setCurrentIndex(nextIdx);
      loadQuestion(subject, grade, nextIdx);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col p-6 lg:p-12 relative">
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
          <div>
            <span className="text-xs font-mono text-[var(--color-accent-primary)] uppercase tracking-wider block">
              {subject} &bull; Adaptive Set
            </span>
            <h4 className="text-sm font-semibold text-white">
              Question {currentIndex + 1} of {TOTAL_QUESTIONS}
            </h4>
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
        {loading || !currentQuestion ? (
          <div className="w-full max-w-3xl mx-auto p-8 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-6">
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
            question={currentQuestion}
            questionIndex={currentIndex}
            totalQuestions={TOTAL_QUESTIONS}
            onAnswerSubmit={handleAnswerSubmit}
            onNextQuestion={handleNextQuestion}
          />
        )}
      </main>

      {/* Mascot docked bottom-right in quiz mode */}
      <div className="fixed bottom-6 right-6 z-30 hidden sm:block pointer-events-none">
        <div className="relative p-2 rounded-2xl bg-[#14171F]/90 backdrop-blur border border-[var(--color-border)] shadow-2xl flex items-center gap-3 pr-4 pointer-events-auto">
          <NexPlaceholder size={56} />
          <div className="text-left">
            <span className="text-[10px] font-mono text-[var(--color-accent-primary)] block font-bold">NEX LISTENING</span>
            <span className="text-xs font-medium text-white">Focus &bull; Take your time</span>
          </div>
        </div>
      </div>
    </div>
  );
};
