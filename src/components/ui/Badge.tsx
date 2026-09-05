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
    accent: 'bg-[#ff6b4a1f] text-[var(--color-accent-primary)] border border-[#ff6b4a44]',
    success: 'bg-[#3dd9a41f] text-[var(--color-success)] border border-[#3dd9a444]',
    warning: 'bg-[#ffc15e1f] text-[var(--color-warning)] border border-[#ffc15e44]',
    indigo: 'bg-[#5b7cfa1f] text-[var(--color-accent-secondary)] border border-[#5b7cfa44]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeStyles} ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
