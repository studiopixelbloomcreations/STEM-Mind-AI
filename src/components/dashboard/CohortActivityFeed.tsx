import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Sparkles, Brain, CheckCircle2, TrendingUp, Zap } from '../icons';

export interface ActivityEvent {
  id: string;
  studentName: string;
  action: string;
  topic: string;
  timestamp: string;
  type: 'mastery' | 'intervention' | 'milestone' | 'progress';
}

const SAMPLE_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    studentName: 'Sahan K.',
    action: 'Completed Full Learning Session',
    topic: 'Newton’s Laws & Motion',
    timestamp: '2m ago',
    type: 'mastery',
  },
  {
    id: 'act-2',
    studentName: 'Kavindi P.',
    action: 'AI Step Explainer Engaged',
    topic: 'Momentum Vector Resolution',
    timestamp: '8m ago',
    type: 'intervention',
  },
  {
    id: 'act-3',
    studentName: 'Nethmi W.',
    action: 'Mastered Compulsory Module',
    topic: 'Equations of Uniform Acceleration',
    timestamp: '24m ago',
    type: 'milestone',
  },
  {
    id: 'act-4',
    studentName: 'Dineth R.',
    action: 'Calibrated Diagnostic Benchmark',
    topic: 'Grade 10 Science Standard',
    timestamp: '1h ago',
    type: 'progress',
  },
];

export const CohortActivityFeed: React.FC<{ activities?: ActivityEvent[] }> = ({
  activities = SAMPLE_ACTIVITIES,
}) => {
  return (
    <Card className="p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-primary)] font-bold">
            Live Cohort Activity Stream
          </h4>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Live Stream
        </span>
      </div>

      <div className="space-y-3">
        {activities.map((item) => {
          let badgeVariant: 'default' | 'success' | 'warning' | 'accent' = 'default';
          let icon = <Brain className="w-3.5 h-3.5 text-neutral-400" />;

          if (item.type === 'mastery') {
            badgeVariant = 'success';
            icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
          } else if (item.type === 'intervention') {
            badgeVariant = 'warning';
            icon = <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
          } else if (item.type === 'milestone') {
            badgeVariant = 'accent';
            icon = <TrendingUp className="w-3.5 h-3.5 text-sky-400" />;
          }

          return (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)]/60 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-black/20 border border-white/5 shrink-0">
                  {icon}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--color-text-primary)] truncate">
                      {item.studentName}
                    </span>
                    <Badge variant={badgeVariant} className="text-[9px] py-0 px-1.5">
                      {item.action}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] font-mono truncate">
                    {item.topic}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] shrink-0">
                {item.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
