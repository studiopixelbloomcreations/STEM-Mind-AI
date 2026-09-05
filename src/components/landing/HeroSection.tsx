import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ArrowRight, Sparkles, ShieldCheck, KeyRound } from '../icons';
import { NexPlaceholder } from '../mascot/NexPlaceholder';

// Animated Stat Counter Component
const AnimatedCounter: React.FC<{ value: number; suffix?: string; prefix?: string; decimals?: number }> = ({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = start + (value - start) * (1 - Math.pow(1 - progress, 3));
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden px-6 lg:px-16 pt-12 pb-20 bg-[var(--color-bg-base)]"
    >
      {/* Subtle background noise texture */}
      <div className="absolute inset-0 bg-noise pointer-events-none z-0" />

      {/* Interactive cursor-reactive glow strictly using brand colors (Indigo & Coral) */}
      <div
        className="absolute w-[520px] h-[520px] rounded-full pointer-events-none transition-all duration-300 ease-out blur-[120px] opacity-15 z-0"
        style={{
          background: 'radial-gradient(circle, var(--color-accent-secondary) 0%, var(--color-accent-primary) 60%, transparent 70%)',
          left: mousePos.x ? `${mousePos.x - 260}px` : '40%',
          top: mousePos.y ? `${mousePos.y - 260}px` : '30%',
        }}
      />

      {/* Ambient drifting gradient meshes — Coral and Indigo brand tokens */}
      <motion.div
        animate={{
          x: [0, 35, -25, 0],
          y: [0, -35, 25, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ repeat: Infinity, duration: 32, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] rounded-full blur-[110px] pointer-events-none opacity-20 z-0"
        style={{ backgroundColor: 'var(--color-accent-primary)' }}
      />
      <motion.div
        animate={{
          x: [0, -45, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.95, 1.1, 1],
        }}
        transition={{ repeat: Infinity, duration: 38, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] rounded-full blur-[130px] pointer-events-none opacity-20 z-0"
        style={{ backgroundColor: 'var(--color-accent-secondary)' }}
      />

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        {/* Left 60% Column: Kinetic Typography */}
        <motion.div
          className="lg:col-span-7 flex flex-col items-start text-left"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle micro tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs font-mono tracking-wider uppercase text-[var(--color-accent-primary)] mb-6 shadow-sm">
            <Icon icon={Sparkles} size={14} className="animate-spin" style={{ animationDuration: '8s' }} />
            <span>Sri Lankan National Curriculum &bull; Grades 9–11</span>
          </div>

          <h1 className="text-[clamp(2.75rem,5.5vw,5.5rem)] font-display font-black text-[var(--color-text-primary)] leading-[1.02] mb-6 tracking-tight">
            The tutor that <span className="gradient-brand-text">diagnoses</span> why you missed, then teaches until you understand.
          </h1>

          <p className="text-[var(--font-size-body-lg)] text-[var(--color-text-secondary)] max-w-lg mb-8 leading-relaxed font-body">
            Not another static question bank. NexLearn adapts question by question, notices when you hesitate, and steps in with whiteboard proofs before misconceptions solidify.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/login')}
              className="group shadow-lg hover:shadow-[var(--shadow-glow-accent)] transition-all"
            >
              <Icon icon={KeyRound} size={18} />
              <span>Student Token Login</span>
              <Icon
                icon={ArrowRight}
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/teacher')}
              className="gap-2"
            >
              <Icon icon={ShieldCheck} size={18} className="text-[var(--color-accent-secondary)]" />
              <span>Teacher Portal</span>
            </Button>
          </div>

          {/* Metric badges with animated numbers */}
          <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex items-center gap-8 text-xs text-[var(--color-text-secondary)] font-mono">
            <div>
              <span className="block text-2xl font-display font-black text-[var(--color-text-primary)]">
                Grades 9–11
              </span>
              <span>Exact national syllabi</span>
            </div>
            <div className="h-8 w-px bg-[var(--color-border)]" />
            <div>
              <span className="block text-2xl font-display font-black text-[var(--color-success)]">
                <AnimatedCounter value={98.4} suffix="%" decimals={1} />
              </span>
              <span>Syllabus mastery goal</span>
            </div>
            <div className="h-8 w-px bg-[var(--color-border)]" />
            <div>
              <span className="block text-2xl font-display font-black text-[var(--color-accent-secondary)]">
                <AnimatedCounter value={100} suffix="%" />
              </span>
              <span>Deterministic Tokens</span>
            </div>
          </div>
        </motion.div>

        {/* Right 40% Column: Companion Stage */}
        <motion.div
          className="lg:col-span-5 flex items-center justify-center relative"
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Card container for mascot with glass blur */}
          <div className="relative w-full max-w-md aspect-square rounded-2xl bg-[var(--color-bg-surface)]/90 backdrop-blur-xl border border-[var(--color-border)] flex flex-col items-center justify-center p-8 overflow-hidden shadow-2xl">
            {/* Ambient background bloom inside card */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent-primary)]/5 via-transparent to-[var(--color-accent-secondary)]/5 pointer-events-none" />

            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase tracking-wider">Nex AI Online</span>
            </div>

            <NexPlaceholder size={240} />

            <div className="mt-4 text-center relative z-10">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                &ldquo;Ready when you are. Let&apos;s conquer today&apos;s target.&rdquo;
              </p>
              <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                Multimodal voice &bull; Live whiteboard guidance
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
