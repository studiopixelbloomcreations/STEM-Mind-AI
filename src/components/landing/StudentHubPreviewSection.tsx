import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import {
  Brain,
  Calculator,
  Atom,
  Binary,
  BookOpen,
  ArrowRight,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  TrendingUp,
  KeyRound,
} from '../icons';
import { RevealOnScroll } from '../ui/RevealOnScroll';

interface PreviewSubject {
  id: string;
  name: string;
  code: string;
  icon: any;
  currentUnit: string;
  masteryPct: number;
  completedTopics: number;
  totalTopics: number;
  nextConcept: string;
  hesitationStatus: string;
}

const PREVIEW_SUBJECTS: PreviewSubject[] = [
  {
    id: 'math',
    name: 'Mathematics (O/L)',
    code: 'MATH-10',
    icon: Calculator,
    currentUnit: 'Unit 14: Quadratic Equations & Formula Derivation',
    masteryPct: 82,
    completedTopics: 18,
    totalTopics: 22,
    nextConcept: 'Completing the square with negative discriminant conditions',
    hesitationStatus: 'Hesitation detector calibrated (14s latency ceiling)',
  },
  {
    id: 'science',
    name: 'Science (O/L)',
    code: 'SCI-10',
    icon: Atom,
    currentUnit: 'Unit 9: Chemical Bonding & Electrovalent Structures',
    masteryPct: 76,
    completedTopics: 14,
    totalTopics: 19,
    nextConcept: 'Electron dot cross diagrams for covalent triple bonds',
    hesitationStatus: 'Voice & diagram vision tutor ready',
  },
  {
    id: 'ict',
    name: 'ICT (Basket 3)',
    code: 'ICT-10',
    icon: Binary,
    currentUnit: 'Unit 5: Flowcharts, Selection & Iteration Logic',
    masteryPct: 91,
    completedTopics: 11,
    totalTopics: 12,
    nextConcept: 'Nested while-loop trace tables with sentinel values',
    hesitationStatus: 'Code validation agent active',
  },
  {
    id: 'history',
    name: 'History of Sri Lanka',
    code: 'HIST-10',
    icon: BookOpen,
    currentUnit: 'Unit 4: Ancient Hydraulic Civilization & Cascades',
    masteryPct: 88,
    completedTopics: 15,
    totalTopics: 17,
    nextConcept: 'Sluice gate engineering at Parakrama Samudra',
    hesitationStatus: 'Historical chronology map verified',
  },
];

export const StudentHubPreviewSection: React.FC = () => {
  const navigate = useNavigate();
  const [activeSubjectId, setActiveSubjectId] = useState<string>('math');

  const selectedSubject =
    PREVIEW_SUBJECTS.find((s) => s.id === activeSubjectId) || PREVIEW_SUBJECTS[0];

  return (
    <section
      id="student-hub"
      className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)] border-t border-[var(--color-border)] relative"
    >
      <RevealOnScroll className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-bg-surface-alt)] text-xs font-mono font-bold tracking-wider uppercase text-[var(--color-text-secondary)] border border-[var(--color-border)] mb-4">
            The Learner Workstation
          </span>
          <h2 className="text-[var(--font-size-h1)] font-display font-extrabold text-[var(--color-text-primary)] mb-4 tracking-tight">
            See the exact interface your student wakes up to
          </h2>
          <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)] leading-relaxed">
            No social feeds, no distracting gamification traps. Just a calibrated, high-focus
            terminal built around national syllabus goals, clear mastery telemetry, and instant AI tutor
            intervention.
          </p>
        </div>

        {/* Realistic Interactive Student Hub Shell */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl overflow-hidden">
          {/* Top Hub Bar Mockup */}
          <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface-alt)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] flex items-center justify-center font-mono font-bold text-xs text-[var(--color-accent)]">
                TG
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-sm text-[var(--color-text-primary)]">
                    Senuli Ratnayake
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--color-bg-base)] border border-[var(--color-border)] font-mono text-[10px] text-[var(--color-text-secondary)] flex items-center gap-1">
                    <Icon icon={KeyRound} size={10} className="text-[var(--color-accent)]" />
                    TG100024
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                  Grade 10 &bull; O/L National Cohort
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text-secondary)]">
                <Icon icon={Flame} size={14} className="text-[var(--color-accent)]" />
                <span className="text-[var(--color-text-primary)] font-bold">5 Days</span>
                <span className="hidden sm:inline">Streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-success)]">
                <Icon icon={CheckCircle2} size={14} />
                <span>Diagnostic Active</span>
              </div>
            </div>
          </div>

          {/* Main Hub Workstation Area */}
          <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Subject Selector Sidebar (4 Cols) */}
            <div className="lg:col-span-4 space-y-2.5">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                Active Enrolled Roster
              </span>
              {PREVIEW_SUBJECTS.map((sub) => {
                const isSelected = sub.id === activeSubjectId;
                const SubIcon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubjectId(sub.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 flex items-center justify-between ${
                      isSelected
                        ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent)] shadow-sm'
                        : 'bg-[var(--color-bg-base)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg border shrink-0 ${
                          isSelected
                            ? 'bg-[var(--color-bg-surface)] border-[var(--color-accent)] text-[var(--color-accent)]'
                            : 'bg-[var(--color-bg-surface-alt)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        <Icon icon={SubIcon} size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                          {sub.name}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--color-text-secondary)]">
                          {sub.code} &bull; {sub.completedTopics}/{sub.totalTopics} Topics
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[var(--color-text-primary)] shrink-0 ml-2">
                      {sub.masteryPct}%
                    </span>
                  </button>
                );
              })}

              <div className="pt-3 border-t border-[var(--color-border)]">
                <div className="p-3 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-start gap-2.5">
                  <Icon icon={Brain} size={16} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                  <span>
                    Deterministic token auth locks the curriculum profile strictly to the school syllabus.
                  </span>
                </div>
              </div>
            </div>

            {/* Subject Detail & Diagnostic Workstation (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col justify-between rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] p-6 lg:p-7">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[11px] font-mono font-medium text-[var(--color-accent)]">
                    Target Syllabus Frontier
                  </span>
                  <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                    National Curriculum Benchmark 2026
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-[var(--color-text-primary)] mb-2">
                  {selectedSubject.currentUnit}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6 font-body leading-relaxed">
                  Next concept in sequence: <strong className="text-[var(--color-text-primary)] font-medium">{selectedSubject.nextConcept}</strong>. The Council has prepared multi-tier step derivations and targeted diagnostic checks.
                </p>

                {/* Progress Bar & Telemetry */}
                <div className="space-y-3 mb-6 p-4 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--color-text-secondary)]">Syllabus Topic Mastery</span>
                    <span className="text-[var(--color-text-primary)] font-bold">
                      {selectedSubject.masteryPct}% Verified
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--color-bg-surface-alt)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${selectedSubject.masteryPct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-mono text-[var(--color-text-secondary)]">
                    <div className="flex items-center gap-1.5">
                      <Icon icon={Clock} size={12} className="text-[var(--color-text-secondary)]" />
                      <span>Avg: 42s/Step</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon icon={TrendingUp} size={12} className="text-[var(--color-success)]" />
                      <span>+14% This Week</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                      <Icon icon={Sparkles} size={12} className="text-[var(--color-accent)]" />
                      <span>Council Ready</span>
                    </div>
                  </div>
                </div>

                {/* Hesitation Telemetry Banner */}
                <div className="p-3 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)] mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                    <span>{selectedSubject.hesitationStatus}</span>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-secondary)] hidden sm:inline">
                    Strict Local Privacy
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--color-border)]">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/login')}
                  className="gap-2"
                >
                  <span>Launch Interactive Diagnostic</span>
                  <Icon icon={ArrowRight} size={16} />
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/login')}
                >
                  <span>Enter with Token</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
};
