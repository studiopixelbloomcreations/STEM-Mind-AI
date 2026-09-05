import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { NexLogo } from '../../components/mascot/NexLogo';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle2,
  BookOpen,
  Brain,
  TrendingUp,
} from '../../components/icons';
import {
  fetchTopicSuggestions,
  TopicSuggestion,
} from '../../lib/api/harmony';

type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const SessionSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve subject & grade from navigation state or session storage
  const navState = (location.state as { subject?: string; grade?: number }) || {};
  const rawSubject = typeof navState.subject === 'string' ? navState.subject : sessionStorage.getItem('current_quiz_subject');
  const initialSubject = (typeof rawSubject === 'string' && !rawSubject.includes('[object')) ? rawSubject : 'Science';
  const rawGrade = typeof navState.grade === 'number' ? navState.grade : Number(sessionStorage.getItem('current_quiz_grade'));
  const initialGrade = (typeof rawGrade === 'number' && !isNaN(rawGrade) && rawGrade > 0) ? rawGrade : 10;

  const [subject, setSubject] = useState<string>(initialSubject);
  const [grade, setGrade] = useState<number>(initialGrade);

  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [recommendationReason, setRecommendationReason] = useState<string>(
    'Calibrated based on Grade 10 National Curriculum diagnostic standard.'
  );

  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(true);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Section 0 Resolution: Determine recommended difficulty baseline from student history
  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('nexlearn_performance_history');
      if (historyStr) {
        const history = JSON.parse(historyStr);
        const subjectStats = history[subject];
        if (subjectStats && subjectStats.totalAnswered >= 3) {
          const accuracy = (subjectStats.correct / subjectStats.totalAnswered) * 100;
          if (accuracy >= 80) {
            setDifficulty('hard');
            setRecommendationReason(
              `Recommended Hard: You demonstrated strong ${Math.round(accuracy)}% mastery in prior ${subject} sessions.`
            );
            return;
          } else if (accuracy < 50) {
            setDifficulty('easy');
            setRecommendationReason(
              `Recommended Easy: Reinforcing foundational principles in ${subject} before scaling challenge.`
            );
            return;
          } else {
            setDifficulty('medium');
            setRecommendationReason(
              `Recommended Medium: Standard adaptive progression calibrated to your recent ${Math.round(accuracy)}% score.`
            );
            return;
          }
        }
      }
    } catch (e) {
      // fallback
    }

    setDifficulty('medium');
    setRecommendationReason('Standard G.C.E. O/L diagnostic baseline recommended for initial evaluation.');
  }, [subject]);

  // Load AI topics for selected subject & grade
  const loadTopics = async () => {
    setIsLoadingTopics(true);
    try {
      const suggestions = await fetchTopicSuggestions(subject, grade);
      setTopics(suggestions);
      if (suggestions.length > 0) {
        setSelectedTopic(suggestions[0].topic);
      }
    } catch (err) {
      console.warn('Failed to fetch syllabus topics:', err);
    } finally {
      setIsLoadingTopics(false);
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [subject, grade]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await loadTopics();
  };

  const handleChooseForMe = () => {
    if (topics.length > 0) {
      // Pick random or second topic to simulate intelligent syllabus sequencing
      const chosen = topics[Math.floor(Math.random() * topics.length)];
      setSelectedTopic(chosen.topic);
      handleProceed(chosen.topic);
    }
  };

  const handleProceed = (topicToUse?: any) => {
    const finalTopic = (typeof topicToUse === 'string' && topicToUse.trim())
      ? topicToUse.trim()
      : (selectedTopic || (topics[0]?.topic ?? `${subject} Core Principles`));
    
    // Save selections for session loading and quiz
    sessionStorage.setItem('current_quiz_subject', String(subject));
    sessionStorage.setItem('current_quiz_grade', String(grade));
    sessionStorage.setItem('current_quiz_difficulty', String(difficulty));
    sessionStorage.setItem('current_quiz_topic', String(finalTopic));

    navigate('/session/loading', {
      state: {
        subject: String(subject),
        grade: Number(grade),
        difficulty: String(difficulty),
        topic: String(finalTopic),
      },
    });
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col p-6 lg:p-12 relative font-body">
      {/* Top Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[var(--color-border)] mb-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/hub')}
            className="p-2"
            aria-label="Back to Hub"
          >
            <Icon icon={ArrowLeft} size={18} />
          </Button>
          <div className="flex items-center gap-2">
            <NexLogo size={28} />
            <span className="font-display font-black text-xl tracking-tight text-[var(--color-text-primary)]">
              NexLearn<span className="text-[var(--color-accent)]">.</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-secondary)]">
          <Badge variant="default">Grade {grade}</Badge>
          <span className="hidden sm:inline">&bull;</span>
          <span className="font-semibold text-[var(--color-accent)]">{subject}</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-between">
        <div className="space-y-10">
          {/* Header Title */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-bg-surface-alt)] text-xs font-mono font-bold tracking-wider uppercase text-[var(--color-text-secondary)] border border-[var(--color-border)] mb-3">
              Session Calibration
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[var(--color-text-primary)] tracking-tight">
              Calibrate your {subject} session
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
              Select your challenge baseline and target syllabus topic. Nex will formulate 5 tailored problems with instant whiteboard derivations.
            </p>
          </div>

          {/* Section 1: Difficulty Selector */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-display font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <span>1. Baseline Difficulty</span>
                <span className="text-xs font-normal text-[var(--color-text-secondary)]">
                  (Sets starting problem complexity)
                </span>
              </label>
              <span className="text-[11px] font-mono text-[var(--color-accent)] flex items-center gap-1">
                <Icon icon={Brain} size={13} />
                <span>Adaptive Recommendation</span>
              </span>
            </div>

            {/* 3-Level Segmented Control */}
            <div className="grid grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((lvl) => {
                const isSelected = difficulty === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent)] shadow-md ring-1 ring-[var(--color-accent)]/30'
                        : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display font-bold text-sm capitalize text-[var(--color-text-primary)]">
                        {lvl}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                      )}
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)] block font-mono">
                      {lvl === 'easy'
                        ? 'Foundational recall & basic applications'
                        : lvl === 'medium'
                        ? 'Standard G.C.E. O/L multi-step problem solving'
                        : 'Rigorous exam proof & high-discrimination questions'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Recommendation Explanation Pill */}
            <div className="p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
              <Icon icon={TrendingUp} size={15} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
              <span>{recommendationReason}</span>
            </div>
          </div>

          {/* Section 2: AI-Generated Syllabus Topics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-display font-bold text-[var(--color-text-primary)]">
                2. Target Sri Lankan Syllabus Topic (Exactly 5 Options)
              </label>

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isLoadingTopics || isRegenerating}
                className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Icon
                  icon={RefreshCw}
                  size={12}
                  className={isRegenerating ? 'animate-spin text-[var(--color-accent)]' : ''}
                />
                <span>Regenerate Topics</span>
              </button>
            </div>

            {isLoadingTopics ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className="h-16 rounded-xl bg-[var(--color-bg-surface-alt)] animate-pulse border border-[var(--color-border)]"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {topics.map((t, idx) => {
                  const isSelected = selectedTopic === t.topic;
                  return (
                    <div
                      key={t.topic + idx}
                      onClick={() => setSelectedTopic(t.topic)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent)] shadow-sm ring-1 ring-[var(--color-accent)]/20'
                          : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg border shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-[var(--color-bg-surface)] border-[var(--color-accent)] text-[var(--color-accent)]'
                              : 'bg-[var(--color-bg-surface-alt)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          <Icon icon={BookOpen} size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-sm text-[var(--color-text-primary)] truncate">
                            {t.topic}
                          </h4>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
                            {t.syllabusReference} &bull; {t.whyRelevant}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isSelected && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)] font-mono text-[10px] font-bold uppercase border border-[var(--color-accent)]/30">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-8 border-t border-[var(--color-border)] mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleChooseForMe}
            disabled={isLoadingTopics}
            className="w-full sm:w-auto gap-2"
          >
            <Icon icon={Sparkles} size={15} className="text-[var(--color-accent)]" />
            <span>Choose for Me (Auto-Pick)</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => handleProceed()}
            disabled={isLoadingTopics || !selectedTopic}
            className="w-full sm:w-auto px-8 gap-2"
          >
            <span>Proceed to Session</span>
            <Icon icon={ArrowRight} size={16} />
          </Button>
        </div>
      </main>
    </div>
  );
};
