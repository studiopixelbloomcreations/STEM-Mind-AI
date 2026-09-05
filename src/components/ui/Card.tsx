import React, { useRef } from 'react';
import { motion, useReducedMotion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'surface' | 'surface-alt' | 'light';
  interactive?: boolean;
  glowOnHover?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  interactive = false,
  glowOnHover = false,
  className = '',
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const variantStyles = {
    surface: 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
    'surface-alt': 'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
    light: 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
  }[variant];

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-surface-alt)]/60 active:bg-[var(--color-bg-surface-alt)]'
    : '';

  return (
    <motion.div
      ref={cardRef}
      whileHover={shouldReduceMotion || !interactive ? {} : { y: -2 }}
      whileTap={shouldReduceMotion || !interactive ? {} : { y: 0, scale: 0.995 }}
      transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
      className={`rounded-xl p-6 transition-colors duration-150 ${variantStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

