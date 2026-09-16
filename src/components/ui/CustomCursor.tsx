import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isInputHover, setIsInputHover] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 400 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Check if pointer is coarse (touch screen)
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouch(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = target.closest('button, a, [role="button"], .interactive-element, select');
        const isInputElement = target.closest('input, textarea');

        setIsHovering(Boolean(isInteractive));
        setIsInputHover(Boolean(isInputElement));
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, cursorX, cursorY]);

  if (isTouch || isInputHover || !isVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Outer Ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border border-emerald-400/40 dark:border-white/30 backdrop-blur-[1px]"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 38 : 22,
          height: isHovering ? 38 : 22,
          backgroundColor: isHovering ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.03)',
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      />

      {/* Inner Dot */}
      <motion.div
        className="fixed top-0 left-0 rounded-full bg-emerald-400 dark:bg-white shadow-[0_0_8px_rgba(52,211,153,0.6)]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 6 : 4,
          height: isHovering ? 6 : 4,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 500 }}
      />
    </div>
  );
};
