import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{
        opacity: 0.45,
        scale: 0.97,
        filter: 'blur(3px)',
      }}
      whileInView={{
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
      }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.35,
        delay,
        ease: [0.65, 0, 0.35, 1], // Apple-grade precise easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
