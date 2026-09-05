import React from 'react';
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

  const variantStyles = {
    surface: 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
    'surface-alt': 'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
    light: 'bg-[var(--color-bg-light)] text-[var(--color-text-inverse)] border border-[#E4E4DC]',
  }[variant];

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-[#3E465B] active:border-[#525D78]'
    : '';

  const glowStyles = glowOnHover
    ? 'hover:shadow-[0_0_24px_rgba(255,107,74,0.22)]'
    : '';

  return (
    <motion.div
      whileHover={shouldReduceMotion || !interactive ? {} : { y: -2 }}
      whileTap={shouldReduceMotion || !interactive ? {} : { y: 0, scale: 0.995 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-lg p-6 transition-colors ${variantStyles} ${interactiveStyles} ${glowStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
