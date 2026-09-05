import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { Trophy, ArrowRight, RotateCcw, Award, CheckCircle2 } from '../../components/icons';

export const Results: React.FC = () => {
  const navigate = useNavigate();

  const score = Number(sessionStorage.getItem('quiz_final_score')) || 4;
  const total = Number(sessionStorage.getItem('quiz_total_count')) || 5;
  const subject = sessionStorage.getItem('quiz_subject') || 'Physics';

  const percentage = Math.round((score / total) * 100);
  const isStrongResult = percentage >= 80;

  useEffect(() => {
    // Only fire confetti if result is genuinely strong (>80%) per section 2.5
    if (isStrongResult) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B4A', '#5B7CFA', '#3DD9A4'],
        });
      } catch (err) {
        // canvas-confetti fallback
      }
    }
  }, [isStrongResult]);

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-6 lg:p-12">
      <Card className="w-full max-w-xl p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isStrongResult ? 'bg-[#3dd9a41c] text-[var(--color-success)]' : 'bg-[#5b7cfa1c] text-[var(--color-accent-secondary)]'
            }`}
          >
            <Icon icon={isStrongResult ? Trophy : Award} size={36} />
          </div>
        </div>

        <Badge variant={isStrongResult ? 'success' : 'indigo'} className="mb-4">
          {isStrongResult ? 'Exceptional Mastery' : 'Session Complete'}
        </Badge>

        <h2 className="text-3xl font-display font-bold text-white mb-2">
          {isStrongResult ? 'Outstanding Work!' : 'Solid Session Completed!'}
        </h2>

        <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-8 font-body">
          You answered <span className="text-white font-bold">{score} out of {total}</span> questions correctly in {subject}. Your diagnostic profile has been updated.
        </p>

        {/* Score Metric Card */}
        <div className="p-6 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[#262B38] mb-8 flex items-center justify-around">
          <div>
            <span className="text-3xl font-display font-bold text-white block">
              {percentage}%
            </span>
            <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase">
              Accuracy
            </span>
          </div>
          <div className="h-10 w-px bg-[var(--color-border)]" />
          <div>
            <span className="text-3xl font-display font-bold text-[var(--color-accent-primary)] block">
              +{score * 12}
            </span>
            <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase">
              Elo Rating
            </span>
          </div>
          <div className="h-10 w-px bg-[var(--color-border)]" />
          <div>
            <span className="text-3xl font-display font-bold text-[var(--color-success)] block">
              +1
            </span>
            <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase">
              Streak Day
            </span>
          </div>
        </div>

        {/* Summary points */}
        <div className="space-y-2 text-xs font-mono text-left mb-8 bg-[#0B0D12] p-4 rounded-md border border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Icon icon={CheckCircle2} size={14} className="text-[var(--color-success)]" />
            <span>Formulas: Equations of motion under gravity retained</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Icon icon={CheckCircle2} size={14} className="text-[var(--color-success)]" />
            <span>Hesitation telemetry: 0 unaddressed blockers</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/quiz')}
            className="w-full sm:w-auto"
          >
            <Icon icon={RotateCcw} size={16} />
            <span>Another Set</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/hub')}
            className="w-full sm:w-auto"
          >
            <span>Return to Hub</span>
            <Icon icon={ArrowRight} size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
};
