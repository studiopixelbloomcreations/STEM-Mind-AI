import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { NexPlaceholder } from '../../components/mascot/NexPlaceholder';
import { NexLogo } from '../../components/mascot/NexLogo';
import { LiveNexLearnModal } from '../../components/live/LiveNexLearnModal';
import {
  Atom,
  Calculator,
  FlaskConical,
  Dna,
  Play,
  Settings as SettingsIcon,
  LogOut,
  Flame,
  Sparkles,
  Radio,
  BookOpen,
  Key,
  Binary,
} from '../../components/icons';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { StudentRecord } from '../../lib/api/database';
import {
  getDefaultGrade9Subjects,
  getDefaultGrade10or11Subjects,
} from '../../lib/curriculum';

export const LearningHub: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<{
    name: string;
    grade: number;
    access_token?: string;
    subjects?: Array<{ name: string; category?: string }>;
  }>({
    name: 'Student',
    grade: 10,
    access_token: 'TG100001',
  });

  const [selectedSubject, setSelectedSubject] = useState('Science');
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [streakDays, setStreakDays] = useState(5);

  const handleStreakMilestone = () => {
    const nextStreak = streakDays === 5 ? 30 : 5;
    setStreakDays(nextStreak);
    if (nextStreak >= 30) {
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF6B4A', '#FAFAFA', '#3DD9A4'],
        });
      } catch (e) {
        // fallback
      }
      window.dispatchEvent(new CustomEvent('nex-easter-egg', { detail: 'celebrate' }));
    }
  };

  useEffect(() => {
    // 1. Check student session from token login
    const session = localStorage.getItem('nexlearn_student_session');
    if (session) {
      try {
        const parsed = JSON.parse(session) as StudentRecord;
        setStudent({
          name: parsed.name,
          grade: parsed.grade,
          access_token: parsed.access_token,
          subjects: parsed.subjects,
        });
        if (parsed.subjects && parsed.subjects.length > 0) {
          setSelectedSubject(parsed.subjects[0].name);
        }
        return;
      } catch (e) {
        // fallback
      }
    }

    // 2. Check legacy active student
    const saved = localStorage.getItem('nexlearn_active_student');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStudent({
          name: parsed.name || 'Student',
          grade: parsed.grade || 10,
          subjects: parsed.preferred_subjects?.map((s: string) => ({ name: s })) || [],
        });
      } catch (e) {
        // fallback
      }
    }
  }, []);

  const getSubjectIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('math')) return Calculator;
    if (lower.includes('science') || lower.includes('physic') || lower.includes('chem')) return Atom;
    if (lower.includes('bio') || lower.includes('health')) return Dna;
    if (lower.includes('ict') || lower.includes('tech') || lower.includes('pts')) return Binary;
    if (lower.includes('art') || lower.includes('music') || lower.includes('dance') || lower.includes('religion')) return Sparkles;
    return BookOpen;
  };

  const rawSubjects =
    student.subjects && student.subjects.length > 0
      ? student.subjects
      : (student.grade === 9 ? getDefaultGrade9Subjects() : getDefaultGrade10or11Subjects()).map((s) => ({
          name: s.name,
          category: s.category,
        }));

  const subjectsToDisplay = rawSubjects.map((sub, i) => {
    return {
      name: sub.name,
      icon: getSubjectIcon(sub.name),
      units: sub.category ? `${sub.category.toUpperCase()} MODULE` : 'Curriculum Standard Unit',
      mastery: 72 + ((i * 7) % 24),
    };
  });

  const handleStartSession = (subjectName?: string) => {
    const target = subjectName || selectedSubject || (subjectsToDisplay[0]?.name ?? 'Science');
    sessionStorage.setItem('current_quiz_subject', target);
    sessionStorage.setItem('current_quiz_grade', String(student.grade));
    navigate('/session/setup', { state: { subject: target, grade: student.grade } });
  };

  const handleLogout = () => {
    localStorage.removeItem('nexlearn_student_session');
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col p-6 lg:p-12 relative">
      {/* Top Bar */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[var(--color-border)] mb-10">
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <NexLogo size={28} className="transition-transform group-hover:scale-105" />
            <span className="text-2xl font-display font-black text-[var(--color-text-primary)] tracking-tight">
              NexLearn<span className="text-[var(--color-accent)]">.</span>
            </span>
          </div>
          <Badge variant="default">Grade {student.grade} Student Hub</Badge>
          {student.access_token && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-secondary)]">
              <Icon icon={Key} size={11} className="text-[var(--color-accent)]" />
              <span className="font-bold text-[var(--color-text-primary)]">{student.access_token}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleStreakMilestone}
            title={streakDays >= 30 ? "Milestone Unlocked! Click to reset" : "Click to inspect 30-Day Milestone Benchmark"}
            className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
              streakDays >= 30
                ? 'text-[var(--color-success)] bg-[var(--color-bg-surface-alt)] border-[var(--color-success)] shadow-md ring-1 ring-[var(--color-success)]/30'
                : 'text-[var(--color-warning)] bg-[var(--color-bg-surface-alt)] border-[var(--color-border)] hover:border-[var(--color-warning)]'
            }`}
          >
            <Icon icon={Flame} size={16} className={streakDays >= 30 ? 'text-[var(--color-success)] animate-bounce' : ''} />
            <span>{streakDays} DAY STREAK</span>
            {streakDays >= 30 && <span className="text-[10px] uppercase font-bold text-[var(--color-accent)]">Milestone!</span>}
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsLiveOpen(true)}
            className="gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <Icon icon={Radio} size={14} />
            <span className="hidden sm:inline">Live NexLearn</span>
          </Button>

          <ThemeToggle />

          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            <Icon icon={SettingsIcon} size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} title="Log Out">
            <Icon icon={LogOut} size={16} />
          </Button>
        </div>
      </header>

      {/* Main Hub Body */}
      <main className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Subject Selection & Launchers */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            <span className="text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider block mb-1 font-semibold">
              Sri Lankan National Curriculum &bull; Grade {student.grade}
            </span>
            <h2 className="text-3xl font-display font-black text-[var(--color-text-primary)] tracking-tight">
              Welcome back, {student.name}.
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Select a syllabus unit below to launch an adaptive challenge, or talk live with Nex.
            </p>
          </div>

          {/* High-Tech Live NexLearn Highlight Tile */}
          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]"></span>
                </span>
                <span className="text-xs font-mono text-[var(--color-accent)] font-bold tracking-wider uppercase">
                  Real-time Audio &amp; Vision
                </span>
              </div>
              <h3 className="text-xl font-display font-bold text-[var(--color-text-primary)]">
                Live NexLearn Multimodal Room
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-lg leading-relaxed">
                Spoken conversation with Nex: share your webcam or screen for instant step-by-step problem diagnosis.
              </p>
            </div>
            <Button
              size="md"
              variant="primary"
              onClick={() => setIsLiveOpen(true)}
              className="shrink-0 gap-2"
            >
              <Icon icon={Radio} size={16} />
              <span>Launch Live Session</span>
            </Button>
          </Card>

          {/* Asymmetric Bento Subject Grid (Section 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjectsToDisplay.map((sub) => {
              const isSelected = selectedSubject === sub.name;
              return (
                <div
                  key={sub.name}
                  onClick={() => setSelectedSubject(sub.name)}
                  className={`${isSelected ? 'sm:col-span-2' : 'sm:col-span-1'} cursor-pointer`}
                >
                  <Card
                    interactive
                    className={`p-6 border transition-all rounded-xl ${
                      isSelected
                        ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20'
                        : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg border ${
                          isSelected
                            ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] border-[var(--color-accent)]/30'
                            : 'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
                        }`}>
                          <Icon icon={sub.icon} size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-display font-bold text-[var(--color-text-primary)]">{sub.name}</h4>
                          <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">{sub.units}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[var(--color-success)] block">
                          {sub.mastery}%
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)] font-semibold">
                            Focused
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[var(--color-bg-base)] h-1.5 rounded-full overflow-hidden mt-3">
                      <div
                        className="bg-[var(--color-success)] h-full rounded-full transition-all duration-300"
                        style={{ width: `${sub.mastery}%` }}
                      />
                    </div>

                    {/* Expanded Content on Featured / Selected Subject */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                        <span className="text-[var(--color-text-secondary)]">
                          Active National Target: Grade {student.grade} Curriculum Calibrated
                        </span>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartSession(sub.name);
                          }}
                          className="gap-1.5 text-xs"
                        >
                          <Icon icon={Play} size={13} />
                          <span>Configure Session</span>
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Launch Quiz Action Card */}
          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-6 rounded-xl">
            <div>
              <span className="text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider font-semibold">
                Active Selection
              </span>
              <h3 className="text-xl font-display font-bold text-[var(--color-text-primary)] mt-1">
                {selectedSubject} Adaptive Set
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                5 calibrated questions &bull; Real-time hints &bull; Step-by-step whiteboard repair
              </p>
            </div>
            <Button
              size="lg"
              variant="primary"
              onClick={handleStartSession}
              className="w-full sm:w-auto px-6 gap-2"
            >
              <Icon icon={Play} size={16} />
              <span>Launch Session</span>
            </Button>
          </Card>
        </div>

        {/* Right Column: Companion Desk & Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-center rounded-xl">
            <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase block mb-3">
              Stationed AI Tutor
            </span>
            <div className="flex justify-center my-2">
              <NexPlaceholder size={140} />
            </div>
            <h4 className="text-base font-display font-bold text-[var(--color-text-primary)] mt-2">Nex is Online</h4>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed mb-4">
              Calibrated for Grade {student.grade} {selectedSubject}. Ready for quiz practice or live spoken tutoring.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsLiveOpen(true)}
              className="w-full justify-center gap-2"
            >
              <Icon icon={Sparkles} size={14} className="text-[var(--color-accent)]" />
              <span>Start Live Voice Conversation</span>
            </Button>
          </Card>

          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl">
            <h5 className="text-xs font-mono uppercase text-[var(--color-text-secondary)] mb-4">
              Diagnostic Insights
            </h5>
            <div className="space-y-3 text-xs font-mono">
              {subjectsToDisplay.slice(0, 3).map((sub, i) => (
                <div
                  key={sub.name}
                  className={`flex justify-between ${i < 2 ? 'pb-2 border-b border-[var(--color-border)]' : ''}`}
                >
                  <span className="text-[var(--color-text-secondary)]">{sub.name} Units</span>
                  <span className={sub.mastery >= 75 ? 'text-[var(--color-success)] font-bold' : 'text-[var(--color-warning)] font-bold'}>
                    {sub.mastery >= 75 ? `Strong (${sub.mastery}%)` : `Calibrating (${sub.mastery}%)`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Docked Nex Trigger */}
      <div className="fixed bottom-6 right-6 z-30 hidden sm:block">
        <div
          onClick={() => setIsLiveOpen(true)}
          className="cursor-pointer group relative p-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center gap-3 pr-4 transition-all active:scale-95"
        >
          <NexPlaceholder size={54} />
          <div className="text-left">
            <span className="text-[10px] font-mono text-[var(--color-accent)] block font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              LIVE NEXLEARN
            </span>
            <span className="text-xs font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
              Click to speak with Nex
            </span>
          </div>
        </div>
      </div>

      {/* Live NexLearn Modal */}
      <LiveNexLearnModal
        isOpen={isLiveOpen}
        onClose={() => setIsLiveOpen(false)}
        subject={selectedSubject}
        grade={student.grade}
      />
    </div>
  );
};
