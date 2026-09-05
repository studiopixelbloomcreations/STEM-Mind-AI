import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { NexPlaceholder } from '../../components/mascot/NexPlaceholder';
import { Atom, Calculator, FlaskConical, Dna, Play, Settings as SettingsIcon, LogOut, Flame } from 'lucide-react';

export const LearningHub: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<{ name: string; grade: number; preferred_subjects: string[] }>({
    name: 'Kavindu',
    grade: 10,
    preferred_subjects: ['Physics', 'Mathematics'],
  });
  const [selectedSubject, setSelectedSubject] = useState('Physics');

  useEffect(() => {
    const saved = localStorage.getItem('nexlearn_active_student');
    if (saved) {
      try {
        setStudent(JSON.parse(saved));
      } catch (e) {
        // use default
      }
    }
  }, []);

  const subjects = [
    { name: 'Physics', icon: Atom, units: 'Motion, Optics, Electric Current', mastery: 84 },
    { name: 'Mathematics', icon: Calculator, units: 'Algebra, Logarithms, Matrices', mastery: 76 },
    { name: 'Chemistry', icon: FlaskConical, units: 'Mole Concept, Acids, Bonding', mastery: 62 },
    { name: 'Biology', icon: Dna, units: 'Cell Division, Circulatory System', mastery: 90 },
  ];

  const handleStartSession = () => {
    sessionStorage.setItem('current_quiz_subject', selectedSubject);
    sessionStorage.setItem('current_quiz_grade', String(student.grade));
    navigate('/quiz');
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
          <Badge variant="indigo">Student Hub</Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-warning)] bg-[#1C202B] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
            <Icon icon={Flame} size={16} />
            <span>5 DAY STREAK</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            <Icon icon={SettingsIcon} size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Icon icon={LogOut} size={16} />
          </Button>
        </div>
      </header>

      {/* Main Hub Body */}
      <main className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Greeting & Subject Selection */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            <span className="text-xs font-mono text-[var(--color-accent-primary)] uppercase tracking-wider block mb-1">
              Grade {student.grade} Curriculum
            </span>
            <h2 className="text-3xl font-display font-bold text-white">
              Welcome back, {student.name}.
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Select a subject module to launch an adaptive challenge with Nex.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map((sub) => {
              const isSelected = selectedSubject === sub.name;
              return (
                <Card
                  key={sub.name}
                  interactive
                  onClick={() => setSelectedSubject(sub.name)}
                  className={`p-6 border transition-all ${
                    isSelected
                      ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent-primary)] shadow-md'
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[#3E465B]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-md bg-[#0B0D12] text-white">
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

          {/* Launch Action Card */}
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
              className="w-full sm:w-auto px-8 gap-2"
            >
              <Icon icon={Play} size={18} />
              <span>Launch Session</span>
            </Button>
          </Card>
        </div>

        {/* Right Column: Companion Desk & Recent Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-center">
            <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase block mb-3">
              Stationed AI Tutor
            </span>
            <div className="flex justify-center my-2">
              <NexPlaceholder size={150} />
            </div>
            <h4 className="text-base font-display font-bold text-white mt-2">Nex is Online</h4>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              Ready to guide you through {selectedSubject}. If you get stuck at any point, click the &ldquo;I&apos;m Stuck&rdquo; button.
            </p>
          </Card>

          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
            <h5 className="text-xs font-mono uppercase text-[var(--color-text-secondary)] mb-4">
              Diagnostic Insights
            </h5>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between pb-2 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)]">Velocity &amp; Motion</span>
                <span className="text-[var(--color-success)] font-bold">Strong (92%)</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)]">Ohm&apos;s Law Series</span>
                <span className="text-[var(--color-warning)] font-bold">Needs Focus (64%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Logarithms</span>
                <span className="text-[var(--color-success)] font-bold">Strong (88%)</span>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Mascot docked bottom-right (small, ~120px, non-intrusive per section 2.5) */}
      <div className="fixed bottom-6 right-6 z-30 hidden sm:block pointer-events-none">
        <div className="relative p-2 rounded-2xl bg-[#14171F]/90 backdrop-blur border border-[var(--color-border)] shadow-2xl flex items-center gap-3 pr-4 pointer-events-auto">
          <NexPlaceholder size={64} />
          <div className="text-left">
            <span className="text-[10px] font-mono text-[var(--color-accent-primary)] block font-bold">NEX DOCKED</span>
            <span className="text-xs font-medium text-white">Your tutor is ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
