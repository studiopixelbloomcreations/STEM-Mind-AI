import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { MasteryChart } from './MasteryChart';
import { StudentProfile } from '../../lib/api/database';
import { Icon } from '../ui/Icon';
import { AlertCircle, CheckCircle2, TrendingUp, Award } from 'lucide-react';

interface StudentAnalyticsPanelProps {
  student: StudentProfile | null;
}

export const StudentAnalyticsPanel: React.FC<StudentAnalyticsPanelProps> = ({ student }) => {
  if (!student) {
    return (
      <Card className="h-full flex items-center justify-center p-12 text-center bg-[var(--color-bg-surface)]">
        <p className="text-sm text-[var(--color-text-secondary)] font-mono">
          Select a student from the roster to inspect diagnostic telemetry.
        </p>
      </Card>
    );
  }

  // Realistic mock data mapped to student profile
  const topicBreakdown = [
    { topic: 'Kinematics', mastery: Math.min(95, (student.mastery_rate || 50) + 12) },
    { topic: 'Dynamics', mastery: Math.max(40, (student.mastery_rate || 50) - 8) },
    { topic: 'Ohm’s Law', mastery: Math.min(88, (student.mastery_rate || 50) + 6) },
    { topic: 'Stoichiometry', mastery: Math.max(35, (student.mastery_rate || 50) - 15) },
    { topic: 'Logarithms', mastery: Math.min(92, (student.mastery_rate || 50) + 10) },
  ];

  return (
    <div className="space-y-6">
      {/* Student Overview Bar */}
      <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-display font-bold text-white">{student.name}</h3>
              <Badge variant="indigo">Grade {student.grade}</Badge>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] font-mono">
              Enrolled: {new Date(student.created_at || Date.now()).toLocaleDateString()} &bull; ID: {student.id}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-2xl font-display font-bold text-[var(--color-success)]">
                {student.mastery_rate || 50}%
              </span>
              <span className="block text-[10px] font-mono text-[var(--color-text-secondary)] uppercase">
                Overall Mastery
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Chart Section */}
      <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Syllabus Topic Mastery</h4>
            <span className="text-xs text-[var(--color-text-secondary)] font-mono">
              Evaluated across adaptive council question cycles
            </span>
          </div>
          <Badge variant="accent">Live Calibration</Badge>
        </div>
        <MasteryChart data={topicBreakdown} />
      </Card>

      {/* Weak-Area Detection & Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-3 text-[var(--color-warning)] font-semibold text-sm">
            <Icon icon={AlertCircle} size={18} />
            <span>Hesitation Hotspot</span>
          </div>
          <h5 className="text-sm font-display font-bold text-white mb-1">Stoichiometry &amp; Mole Ratio</h5>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
            Hesitation detected on multi-step unit conversions. Recommended intervention: 3 targeted interactive whiteboard proofs.
          </p>
          <ProgressBar value={42} variant="warning" size="sm" showLabel />
        </Card>

        <Card className="p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-3 text-[var(--color-success)] font-semibold text-sm">
            <Icon icon={Award} size={18} />
            <span>Demonstrated Strength</span>
          </div>
          <h5 className="text-sm font-display font-bold text-white mb-1">Kinematic Equations (v²=u²+2as)</h5>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
            Consistently evaluates non-zero roots and gravitational acceleration within 1% error margin across 5 consecutive sets.
          </p>
          <ProgressBar value={95} variant="success" size="sm" showLabel />
        </Card>
      </div>
    </div>
  );
};
