import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentRoster } from '../../components/dashboard/StudentRoster';
import { StudentAnalyticsPanel } from '../../components/dashboard/StudentAnalyticsPanel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { fetchTeacherStudents, createStudent, StudentProfile } from '../../lib/api/database';
import { ArrowLeft, Users, ShieldAlert, Download } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const roster = await fetchTeacherStudents();
      setStudents(roster);
      if (roster.length > 0) {
        setSelectedStudent(roster[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (name: string, grade: number) => {
    const created = await createStudent(name, grade);
    setStudents((prev) => [created, ...prev]);
    setSelectedStudent(created);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col p-6 lg:p-12">
      {/* Dashboard Header */}
      <header className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[var(--color-border)] mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="p-2">
            <Icon icon={ArrowLeft} size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-display font-bold text-white">Teacher Control Room</h2>
              <Badge variant="indigo">Grade 9–11 Cohort</Badge>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] font-mono">
              Real-time syllabus mastery diagnostics &bull; Instant student intervention tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => alert('Syllabus Diagnostic Report exported as CSV.')}
          >
            <Icon icon={Download} size={16} />
            <span>Export Analytics</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/hub')}>
            <span>Student Hub</span>
          </Button>
        </div>
      </header>

      {/* Main 2-Column Dashboard Grid */}
      <main className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Student Roster */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Icon icon={Users} size={16} className="text-[var(--color-accent-primary)]" />
              <span>Student Roster ({students.length})</span>
            </h3>
          </div>
          <StudentRoster
            students={students}
            selectedStudentId={selectedStudent?.id}
            onSelectStudent={setSelectedStudent}
            onAddStudent={handleAddStudent}
          />
        </div>

        {/* Right Column: In-Depth Analytics Panel */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wider">
              Diagnostic Telemetry
            </h3>
          </div>
          <StudentAnalyticsPanel student={selectedStudent} />
        </div>
      </main>
    </div>
  );
};
