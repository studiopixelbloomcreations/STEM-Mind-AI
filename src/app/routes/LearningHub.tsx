import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { NexPlaceholder } from '../../components/mascot/NexPlaceholder';
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
} from '../../components/icons';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { StudentRecord } from '../../lib/api/database';

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

  // Default subject representations if student has custom curriculum subjects
  const defaultSubjects = [
    { name: 'Science', icon: Atom, units: 'Physics, Chemistry, Biology Units', mastery: 84 },
    { name: 'Mathematics', icon: Calculator, units: 'Algebra, Geometry, Trigonometry', mastery: 76 },
    { name: 'English', icon: BookOpen, units: 'Comprehension, Grammar, Essay', mastery: 88 },
    { name: 'History', icon: BookOpen, units: 'Ancient Civilizations & Kingdom Era', mastery: 70 },
  ];

  const subjectsToDisplay =
    student.subjects && student.subjects.length > 0
      ? student.subjects.slice(0, 6).map((sub, i) => {
          const icons = [Atom, Calculator, FlaskConical, Dna, BookOpen];
          return {
            name: sub.name,
            icon: icons[i % icons.length],
            units: sub.category ? `${sub.category.toUpperCase()} MODULE` : 'Curriculum Unit',
            mastery: 75 + (i * 4) % 20,
          };
        })
      : defaultSubjects;

  const handleStartSession = () => {
    sessionStorage.setItem('current_quiz_subject', selectedSubject);
    sessionStorage.setItem('current_quiz_grade', String(student.grade));
    navigate('/quiz');
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
          <span
            onClick={() => navigate('/')}
            className="text-2xl font-display font-black text-white cursor-pointer"
          >
            NexLearn<span className="text-[var(--color-accent-primary)]">.</span>
          </span>
          <Badge variant="indigo">Grade {student.grade} Student Hub</Badge>
          {student.access_token && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/40 border border-indigo-500/30 text-[11px] font-mono text-indigo-300">
              <Icon icon={Key} size={11} />
              <span>{student.access_token}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-warning)] bg-[#1C202B] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
            <Icon icon={Flame} size={16} />
            <span>5 DAY STREAK</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsLiveOpen(true)}
            className="shadow-sm shadow-indigo-500/30 gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
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
            <span className="text-xs font-mono text-[var(--color-accent-primary)] uppercase tracking-wider block mb-1">
              Sri Lankan National Curriculum &bull; Grade {student.grade}
            </span>
            <h2 className="text-3xl font-display font-bold text-white">
              Welcome back, {student.name}.
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Select a syllabus unit below to launch an adaptive challenge, or talk live with Nex.
            </p>
          </div>

          {/* Live NexLearn Highlight Banner */}
          <Card className="p-6 bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/40 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                <span className="text-xs font-mono text-indigo-300 font-bold tracking-wider uppercase">
                  Real-time Audio &amp; Vision
                </span>
              </div>
              <h3 className="text-xl font-display font-bold text-white">
                Live NexLearn Multimodal Room
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                Need instant spoken help? Speak directly with Nex, share your camera or screen, and solve complex step-by-step problems in real time.
              </p>
            </div>
            <Button
              size="md"
              variant="primary"
              onClick={() => setIsLiveOpen(true)}
              className="relative z-10 shrink-0 shadow-lg shadow-indigo-500/30 gap-2"
            >
              <Icon icon={Radio} size={16} />
              <span>Launch Live Session</span>
            </Button>
          </Card>

          {/* Subject Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjectsToDisplay.map((sub) => {
              const isSelected = selectedSubject === sub.name;
              return (
                <Card
                  key={sub.name}
                  interactive
                  onClick={() => setSelectedSubject(sub.name)}
                  className={`p-6 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent-primary)] shadow-md ring-1 ring-indigo-500/20'
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#0B0D12] text-indigo-400 border border-[var(--color-border)]">
                      <Icon icon={sub.icon} size={22} />
                    </div>
                    <span className="text-xs font-mono font-bold text-[var(--color-success)]">
                      {sub.mastery}%
                    </span>
                  </div>
                  <h4 className="text-lg font-display font-bold text-white mb-1">{sub.name}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-4">{sub.units}</p>

                  <div className="w-full bg-[#0B0D12] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--color-success)] h-full rounded-full"
                      style={{ width: `${sub.mastery}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Launch Quiz Action Card */}
          <Card className="p-8 bg-[#14171F] border border-[#2B3245] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono text-[var(--color-accent-secondary)] uppercase">
                Active Selection
              </span>
              <h3 className="text-2xl font-display font-bold text-white mt-1">
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
              className="w-full sm:w-auto px-8 gap-2 shadow-lg shadow-indigo-500/25"
            >
              <Icon icon={Play} size={18} />
              <span>Launch Session</span>
            </Button>
          </Card>
        </div>

        {/* Right Column: Companion Desk & Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-center">
            <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase block mb-3">
              Stationed AI Tutor
            </span>
            <div className="flex justify-center my-2">
              <NexPlaceholder size={140} />
            </div>
            <h4 className="text-base font-display font-bold text-white mt-2">Nex is Online</h4>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed mb-4">
              Calibrated for Grade {student.grade} {selectedSubject}. Ready for quiz practice or live spoken tutoring.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsLiveOpen(true)}
              className="w-full justify-center gap-2"
            >
              <Icon icon={Sparkles} size={14} className="text-indigo-400" />
              <span>Start Live Voice Conversation</span>
            </Button>
          </Card>

          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
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
          className="cursor-pointer group relative p-2 rounded-2xl bg-[#14171F]/95 backdrop-blur border border-indigo-500/30 shadow-2xl flex items-center gap-3 pr-4 hover:border-indigo-400 transition-all active:scale-95"
        >
          <NexPlaceholder size={58} />
          <div className="text-left">
            <span className="text-[10px] font-mono text-indigo-400 block font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE NEXLEARN
            </span>
            <span className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
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
