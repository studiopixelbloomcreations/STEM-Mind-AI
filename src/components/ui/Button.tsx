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
    'relative inline-flex items-center justify-center font-body font-medium transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-base)]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2.5 font-semibold',
  }[size];

  const variantStyles = {
    primary:
      'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-hover)] shadow-none border border-transparent',
    secondary:
      'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-surface)] active:bg-[var(--color-bg-base)]',
    ghost:
      'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface)] active:bg-[var(--color-bg-surface-alt)]',
    danger:
      'bg-[var(--color-danger)] text-white hover:opacity-90 active:opacity-100 border border-transparent',
    success:
      'bg-[var(--color-success)] text-[var(--color-text-inverse)] font-semibold hover:opacity-90 active:opacity-100 border border-transparent',
    stuck:
      'bg-transparent text-[var(--color-warning)] border border-[var(--color-warning)]/30 hover:bg-[var(--color-warning)]/10 active:bg-[var(--color-warning)]/20',
  }[variant];

  const disabledStyles = disabled
    ? 'opacity-40 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileHover={shouldReduceMotion || disabled ? {} : { y: -1 }}
      whileTap={shouldReduceMotion || disabled ? {} : { y: 0, scale: 0.98 }}
      transition={{ duration: 0.14, ease: [0.65, 0, 0.35, 1] }}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${disabledStyles} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

