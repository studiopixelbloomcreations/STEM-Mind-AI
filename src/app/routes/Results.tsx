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
          colors: ['#FF6B4A', '#FAFAFA', '#22C55E'],
        });
      } catch (err) {
        // canvas-confetti fallback
      }
    }
  }, [isStrongResult]);

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-6 lg:p-12">
      <Card className="w-full max-w-xl p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm text-center">
        <div className="flex justify-center mb-6">
          <div
            className={`w-20 h-20 rounded-full border flex items-center justify-center ${
              isStrongResult
                ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-success)] text-[var(--color-success)]'
                : 'bg-[var(--color-bg-surface-alt)] border-[var(--color-border)] text-[var(--color-accent)]'
            }`}
          >
            <Icon icon={isStrongResult ? Trophy : Award} size={36} />
          </div>
        </div>

        <Badge variant={isStrongResult ? 'success' : 'default'} className="mb-4">
          {percentage >= 95 ? 'Top Decile Frontier' : isStrongResult ? 'Target Mastery' : 'Evaluation Complete'}
        </Badge>

        <h2 className="text-3xl font-display font-bold text-[var(--color-text-primary)] mb-2">
          {percentage >= 95
            ? 'Top Decile Diagnostic Mastery'
            : isStrongResult
            ? 'Frontier Standard Retained'
            : 'Evaluation Set Concluded'}
        </h2>

        <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-8 font-body">
          You evaluated <span className="text-[var(--color-text-primary)] font-bold">{score} of {total}</span> problems within target parameters in {subject}. Real-time student profile metrics have been updated.
        </p>

        {/* Score Metric Card */}
        <div className="p-6 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] mb-8 flex items-center justify-around">
          <div>
            <span className="text-3xl font-display font-bold text-[var(--color-text-primary)] block">
              {percentage}%
            </span>
            <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase">
              Accuracy
            </span>
          </div>
          <div className="h-10 w-px bg-[var(--color-border)]" />
          <div>
            <span className="text-3xl font-display font-bold text-[var(--color-accent)] block">
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
        <div className="space-y-2 text-xs font-mono text-left mb-8 bg-[var(--color-bg-surface-alt)] p-4 rounded-lg border border-[var(--color-border)]">
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
