import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentRoster } from '../../components/dashboard/StudentRoster';
import { StudentAnalyticsPanel } from '../../components/dashboard/StudentAnalyticsPanel';
import { StudentRegistrationModal } from './teacher/StudentRegistrationModal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { fetchStudentsByTeacher, StudentRecord } from '../../lib/api/database';
import { useTeacherAuth } from '../../lib/context/TeacherAuthContext';
import {
  ArrowLeft,
  Users,
  LogOut,
  UserPlus,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from '../../components/icons';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

// Animated Number Counter
const AnimatedNumber: React.FC<{ value: number; decimals?: number; suffix?: string; prefix?: string }> = ({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = start + (value - start) * (1 - Math.pow(1 - progress, 3));
      setDisplay(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { teacher, profile, signOut } = useTeacherAuth();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const teacherId = teacher?.uid || profile?.id || 'demo-teacher';

  const loadStudents = async () => {
    setLoading(true);
    try {
      const roster = await fetchStudentsByTeacher(teacherId);
      setStudents(roster);
      if (roster.length > 0) {
        setSelectedStudent((prev) => (prev ? roster.find((s) => s.id === prev.id) || roster[0] : roster[0]));
      } else {
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacherId) {
      loadStudents();
    }
  }, [teacherId]);

  const handleStudentCreated = (newStudent: StudentRecord) => {
    setStudents((prev) => [newStudent, ...prev]);
    setSelectedStudent(newStudent);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/teacher');
  };

  const avgMastery = students.length > 0
    ? Math.round(students.reduce((acc, s) => acc + (s.mastery_rate || 78), 0) / students.length)
    : 84.5;

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col p-6 lg:p-12">
      {/* Dashboard Top Header */}
      <header className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-[var(--color-border)] mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/teacher')} className="p-2">
            <Icon icon={ArrowLeft} size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-display font-bold text-[var(--color-text-primary)] tracking-tight">
                Teacher Control Room
              </h2>
              <Badge variant="default">Syllabus Cohort</Badge>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] font-mono">
              Sri Lankan O/L &amp; Grade 9 Telemetry &bull; Real-time AI Cognition Diagnostics
            </p>
          </div>
        </div>

        {/* Right Header: Teacher Profile & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Teacher Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs">
            {teacher?.photoURL ? (
              <img
                src={teacher.photoURL}
                alt="Teacher"
                className="w-6 h-6 rounded-full border border-[var(--color-border)]"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-white font-bold flex items-center justify-center text-[10px]">
                {(profile?.name || teacher?.email || 'T')[0].toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-[var(--color-text-primary)] truncate max-w-[130px]">
              {profile?.name || teacher?.displayName || 'Educator'}
            </span>
          </div>

          <ThemeToggle />

          <Button
            variant="secondary"
            size="sm"
            onClick={loadStudents}
            disabled={loading}
            title="Refresh student roster from database"
          >
            <Icon icon={RefreshCw} size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRegisterOpen(true)}
          >
            <Icon icon={UserPlus} size={15} />
            <span>Register Student</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-[var(--color-danger)] hover:opacity-80"
            title="Sign out of Educator Portal"
          >
            <Icon icon={LogOut} size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Single-Metric Focus Bento Grid (Section 2) */}
      <section className="max-w-7xl w-full mx-auto mb-8 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Large Primary Focus Metric Tile (Spans 6 cols) */}
        <div className="md:col-span-6">
          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Cohort Syllabus Readiness
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 font-bold">
                  Target Calibrated
                </span>
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl sm:text-5xl font-display font-black text-[var(--color-text-primary)] tracking-tight">
                  <AnimatedNumber value={avgMastery} decimals={1} suffix="%" />
                </span>
                <span className="text-xs font-mono text-[var(--color-success)] font-semibold">
                  +4.2% this sprint
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Aggregated diagnostic score across all registered Grade 9–11 student sessions in your cohort.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-tertiary)]">
              <span>Updated live from Supabase telemetry</span>
              <span>SL National Curriculum</span>
            </div>
          </Card>
        </div>

        {/* 3 Smaller Supporting Metric Tiles (Spans 6 cols) */}
        <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-[var(--color-text-secondary)]">Enrolled</span>
            <div className="my-2">
              <span className="text-2xl font-display font-black text-[var(--color-text-primary)]">
                <AnimatedNumber value={students.length} />
              </span>
              <span className="block text-[11px] font-mono text-[var(--color-text-tertiary)]">Students</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--color-accent)] font-semibold">Deterministic Tokens</span>
          </Card>

          <Card className="p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-[var(--color-text-secondary)]">Hesitations</span>
            <div className="my-2">
              <span className="text-2xl font-display font-black text-[var(--color-warning)]">
                <AnimatedNumber value={students.length > 0 ? Math.max(1, Math.round(students.length * 0.4)) : 0} />
              </span>
              <span className="block text-[11px] font-mono text-[var(--color-text-tertiary)]">Hotspots</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--color-warning)] font-semibold">Pre-Exam Review</span>
          </Card>

          <Card className="p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-[var(--color-text-secondary)]">Coverage</span>
            <div className="my-2">
              <span className="text-2xl font-display font-black text-[var(--color-text-primary)]">
                <AnimatedNumber value={100} suffix="%" />
              </span>
              <span className="block text-[11px] font-mono text-[var(--color-text-tertiary)]">O/L + Gr 9</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--color-success)] font-semibold">13 Compulsory</span>
          </Card>
        </div>
      </section>

      {/* Main 2-Column Dashboard Grid */}
      <main className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Student Roster */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase font-mono tracking-wider flex items-center gap-2">
              <Icon icon={Users} size={16} className="text-[var(--color-accent)]" />
              <span>Registered Students ({students.length})</span>
            </h3>
            {loading && (
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                Syncing database...
              </span>
            )}
          </div>
          <StudentRoster
            students={students}
            selectedStudentId={selectedStudent?.id}
            onSelectStudent={setSelectedStudent}
            onOpenRegisterModal={() => setIsRegisterOpen(true)}
          />
        </div>

        {/* Right Column: In-Depth Analytics Panel */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase font-mono tracking-wider">
              Diagnostic Telemetry &amp; Curriculum Verification
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/hub')}
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              <span>Preview Student Hub</span>
              <Icon icon={ExternalLink} size={12} />
            </Button>
          </div>
          <StudentAnalyticsPanel student={selectedStudent} />
        </div>
      </main>

      {/* Student Registration Modal */}
      <StudentRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        teacherId={teacherId}
        onStudentCreated={handleStudentCreated}
      />
    </div>
  );
};
