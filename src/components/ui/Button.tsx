import React from 'react';
import { motion, useReducedMotion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'stuck';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const baseStyles =
    'relative inline-flex items-center justify-center font-body font-medium transition-colors select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0D12]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-md gap-2',
    lg: 'px-7 py-3.5 text-base rounded-md gap-2.5 font-semibold',
  }[size];

  const variantStyles = {
    primary:
      'bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-hover)] active:bg-[#e05435] focus:ring-[var(--color-accent-primary)] shadow-md hover:shadow-[var(--shadow-glow-accent)]',
    secondary:
      'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[#252b3a] hover:border-[#384052] active:bg-[#181c25] focus:ring-[var(--color-accent-secondary)]',
    ghost:
      'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface)] active:bg-[var(--color-bg-surface-alt)] focus:ring-[var(--color-border)]',
    danger:
      'bg-[var(--color-danger)] text-white hover:bg-[#ff4355] active:bg-[#d93b4a] focus:ring-[var(--color-danger)]',
    success:
      'bg-[var(--color-success)] text-[#0B0D12] font-semibold hover:bg-[#32be8f] active:bg-[#289e76] focus:ring-[var(--color-success)]',
    stuck:
      'bg-transparent text-[var(--color-warning)] border border-[#ffc15e44] hover:bg-[#ffc15e18] hover:border-[var(--color-warning)] active:bg-[#ffc15e28] focus:ring-[var(--color-warning)]',
  }[variant];

  const disabledStyles = disabled
    ? 'opacity-45 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileHover={shouldReduceMotion || disabled ? {} : { scale: 1.02 }}
      whileTap={shouldReduceMotion || disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${disabledStyles} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
