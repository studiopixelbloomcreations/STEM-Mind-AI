import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  variant?: 'accent' | 'success' | 'indigo' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'accent',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  const fillColors = {
    accent: 'bg-[var(--color-accent)]',
    success: 'bg-[var(--color-success)]',
    indigo: 'bg-[var(--color-accent)]',
    warning: 'bg-[var(--color-warning)]',
  }[variant];

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-[var(--color-text-secondary)] font-mono">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-[var(--color-bg-surface-alt)] rounded-full overflow-hidden border border-[var(--color-border)] ${heightStyles}`}>
        <motion.div
          className={`h-full rounded-full ${fillColors}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.24, ease: [0.65, 0, 0.35, 1] }
          }
        />
      </div>
    </div>
  );
};
