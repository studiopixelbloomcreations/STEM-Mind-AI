import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { UserPlus, Search, User, Flame, ArrowRight, Copy, Check, Key } from 'lucide-react';
import { StudentProfile } from '../../lib/api/database';

interface StudentRosterProps {
  students: StudentProfile[];
  selectedStudentId?: string;
  onSelectStudent: (student: StudentProfile) => void;
  onAddStudent?: (name: string, grade: number) => void;
  onOpenRegisterModal?: () => void;
}

export const StudentRoster: React.FC<StudentRosterProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  onAddStudent,
  onOpenRegisterModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.access_token && s.access_token.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCopy = (e: React.MouseEvent, token: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search by name or token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Icon icon={Search} size={16} />}
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            if (onOpenRegisterModal) {
              onOpenRegisterModal();
            } else if (onAddStudent) {
              const name = prompt('Enter student name:');
              if (name) onAddStudent(name, 10);
            }
          }}
          className="w-full sm:w-auto shadow-sm"
        >
          <Icon icon={UserPlus} size={16} />
          <span>Register Student</span>
        </Button>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <Card className="p-8 text-center bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Icon icon={User} size={24} />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">No Students Found</h4>
          <p className="text-xs text-[var(--color-text-secondary)] font-mono mb-4">
            {searchTerm ? 'No students match your search criteria.' : 'No students enrolled in this cohort yet.'}
          </p>
          {onOpenRegisterModal && !searchTerm && (
            <Button variant="secondary" size="sm" onClick={onOpenRegisterModal}>
              <Icon icon={UserPlus} size={14} />
              <span>Register First Student</span>
            </Button>
          )}
        </Card>
      )}

      {/* Roster List Cards */}
      <div className="space-y-2.5">
        {filtered.map((student) => {
          const isSelected = student.id === selectedStudentId;

          return (
            <div
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent-primary)] shadow-md ring-1 ring-indigo-500/20'
                  : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-indigo-500/40'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{student.name}</h4>
                    <Badge variant="indigo" size="sm">Grade {student.grade}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {student.access_token && (
                      <div
                        onClick={(e) => handleCopy(e, student.access_token)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-indigo-500/30 text-[11px] font-mono text-indigo-300 hover:text-white hover:border-indigo-400 transition-colors"
                        title="Click to copy student token"
                      >
                        <Icon icon={Key} size={10} />
                        <span>{student.access_token}</span>
                        <Icon icon={copiedToken === student.access_token ? Check : Copy} size={11} className={copiedToken === student.access_token ? 'text-emerald-400' : 'text-slate-400'} />
                      </div>
                    )}
                    <span className="text-[11px] text-[var(--color-text-secondary)] font-mono truncate max-w-[150px]">
                      {student.subjects?.length || 0} subjects
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-warning)]">
                  <Icon icon={Flame} size={14} />
                  <span>{student.streak || 0} streak</span>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold font-mono text-[var(--color-success)]">
                    {student.mastery_rate || 50}%
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] font-mono uppercase">Mastery</span>
                </div>
                <Icon
                  icon={ArrowRight}
                  size={16}
                  className={`transition-colors hidden sm:block ${isSelected ? 'text-[var(--color-accent-primary)]' : 'text-gray-600'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
