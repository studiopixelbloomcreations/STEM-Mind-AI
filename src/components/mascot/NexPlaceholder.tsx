// TEMPORARY PLACEHOLDER — the full 3D Nex avatar is a separate,
// currently-paused workstream. This 2D placeholder exists only so
// the product doesn't feel empty. Replace this entire component
// when the 3D avatar project resumes. Do not extend this placeholder
// with additional features — swap, don't build on top of it.

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface NexPlaceholderProps {
  size?: number;
  className?: string;
}

export const NexPlaceholder: React.FC<NexPlaceholderProps> = ({
  size = 280,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) return;

    let timeoutId: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);

      // Random interval between 4000ms and 6000ms
      const nextInterval = 4000 + Math.random() * 2000;
      timeoutId = setTimeout(triggerBlink, nextInterval);
    };

    const initialInterval = 4000 + Math.random() * 2000;
    timeoutId = setTimeout(triggerBlink, initialInterval);

    return () => clearTimeout(timeoutId);
  }, [shouldReduceMotion]);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="Nex AI Tutor Mascot Placeholder"
    >
      {/* Soft outer glow backdrop */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--color-accent-primary) 0%, transparent 70%)',
        }}
      />

      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: [1, 1.03, 1],
              }
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10 drop-shadow-xl"
      >
        <defs>
          <radialGradient
            id="nexOrbGradient"
            cx="40%"
            cy="35%"
            r="65%"
            fx="35%"
            fy="30%"
          >
            <stop offset="0%" stopColor="#FFA18A" />
            <stop offset="45%" stopColor="var(--color-accent-primary)" />
            <stop offset="90%" stopColor="#C94426" />
            <stop offset="100%" stopColor="#962A14" />
          </radialGradient>

          <linearGradient id="visorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E2330" />
            <stop offset="100%" stopColor="#0B0D12" />
          </linearGradient>

          <filter id="coreGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer friendly organic orb shape */}
        <path
          d="M 100 18
             C 148 18, 182 52, 182 100
             C 182 148, 146 182, 100 182
             C 54 182, 18 148, 18 100
             C 18 52, 52 18, 100 18 Z"
          fill="url(#nexOrbGradient)"
        />

        {/* Specular highlight rim */}
        <path
          d="M 52 42
             C 72 26, 128 26, 148 42"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Visor band */}
        <rect
          x="44"
          y="76"
          width="112"
          height="48"
          rx="24"
          fill="url(#visorGradient)"
          stroke="#262B38"
          strokeWidth="2.5"
        />

        {/* Left eye with occasional subtle blink squash */}
        <motion.ellipse
          cx="76"
          cy="100"
          rx="9"
          ry="12"
          fill="#3DD9A4"
          filter="url(#coreGlow)"
          animate={
            isBlinking
              ? { scaleY: 0.1, transition: { duration: 0.08 } }
              : { scaleY: 1, transition: { duration: 0.1 } }
          }
        />
        {/* Left eye micro catchlight */}
        {!isBlinking && (
          <circle cx="73" cy="95" r="2.5" fill="#FFFFFF" opacity="0.9" />
        )}

        {/* Right eye with occasional subtle blink squash */}
        <motion.ellipse
          cx="124"
          cy="100"
          rx="9"
          ry="12"
          fill="#3DD9A4"
          filter="url(#coreGlow)"
          animate={
            isBlinking
              ? { scaleY: 0.1, transition: { duration: 0.08 } }
              : { scaleY: 1, transition: { duration: 0.1 } }
          }
        />
        {/* Right eye micro catchlight */}
        {!isBlinking && (
          <circle cx="121" cy="95" r="2.5" fill="#FFFFFF" opacity="0.9" />
        )}

        {/* Soft mouth smile arc */}
        <path
          d="M 92 110 Q 100 115 108 110"
          stroke="#A0A6B4"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </motion.svg>
    </div>
  );
};
