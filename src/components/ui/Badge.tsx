import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'indigo';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase',
    md: 'px-2.5 py-1 text-xs font-medium',
  }[size];

  const variantStyles = {
    default: 'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
    accent: 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]/20',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/25',
    warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/25',
    indigo: 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]/20',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeStyles} ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
