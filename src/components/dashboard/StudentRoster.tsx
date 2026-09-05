import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { UserPlus, Search, User, Flame, ArrowRight } from 'lucide-react';
import { StudentProfile } from '../../lib/api/database';

interface StudentRosterProps {
  students: StudentProfile[];
  selectedStudentId?: string;
  onSelectStudent: (student: StudentProfile) => void;
  onAddStudent: (name: string, grade: number) => void;
}

export const StudentRoster: React.FC<StudentRosterProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  onAddStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState(10);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddStudent(newName.trim(), newGrade);
    setNewName('');
    setIsAdding(false);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search student roster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Icon icon={Search} size={16} />}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto"
        >
          <Icon icon={UserPlus} size={16} />
          <span>Add Student Profile</span>
        </Button>
      </div>

      {/* Add Student inline form */}
      {isAdding && (
        <Card className="p-4 bg-[var(--color-bg-surface-alt)] border border-[var(--color-accent-primary)]">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <Input
                label="Student Full Name"
                placeholder="e.g. Nimesh Wickramasinghe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="w-full sm:w-32">
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1.5">
                Grade
              </label>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(Number(e.target.value))}
                className="w-full bg-[var(--color-bg-surface)] text-white border border-[var(--color-border)] rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-[var(--color-accent-primary)]"
              >
                <option value={9}>Grade 9</option>
                <option value={10}>Grade 10</option>
                <option value={11}>Grade 11</option>
              </select>
            </div>
            <Button variant="primary" size="md" type="submit">
              Save
            </Button>
          </form>
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
              className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent-primary)] shadow-md'
                  : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[#3E465B]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#1C202B] border border-[#262B38] flex items-center justify-center text-white font-bold text-sm">
                  <Icon icon={User} size={18} className="text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{student.name}</h4>
                    <Badge variant="indigo" size="sm">Grade {student.grade}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] font-mono mt-0.5">
                    {student.preferred_subjects?.join(', ') || 'General STEM'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-[var(--color-warning)]">
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
                  className={`transition-colors ${isSelected ? 'text-[var(--color-accent-primary)]' : 'text-gray-600'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
