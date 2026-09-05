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

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { teacher, profile, signOut } = useTeacherAuth();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const teacherId = profile?.id || teacher?.uid || 'default-teacher';

  const loadStudents = async () => {
    setLoading(true);
    try {
      const roster = await fetchStudentsByTeacher(teacherId);
      setStudents(roster);
      if (roster.length > 0) {
        setSelectedStudent(roster[0]);
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
              <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                Teacher Control Room
              </h2>
              <Badge variant="indigo">Syllabus Cohort</Badge>
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
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
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
            className="shadow-sm shadow-indigo-500/20"
          >
            <Icon icon={UserPlus} size={15} />
            <span>Register Student</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-red-400 hover:text-red-300"
            title="Sign out of Educator Portal"
          >
            <Icon icon={LogOut} size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main 2-Column Dashboard Grid */}
      <main className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Student Roster */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Icon icon={Users} size={16} className="text-indigo-400" />
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
            <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wider">
              Diagnostic Telemetry &amp; Curriculum Verification
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/hub')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
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
