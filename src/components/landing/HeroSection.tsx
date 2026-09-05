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
      {/* Subtle radial glow strictly behind the mascot area */}
      <div
        className="absolute top-1/3 right-1/4 w-[480px] h-[480px] rounded-full pointer-events-none blur-[100px] opacity-10 z-0"
        style={{
          background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        {/* Left 60% Column: Kinetic Typography */}
        <motion.div
          className="lg:col-span-7 flex flex-col items-start text-left"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.65, 0, 0.35, 1] }}
        >
          {/* Subtle micro tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs font-mono tracking-wider uppercase text-[var(--color-accent)] mb-6 shadow-sm">
            <Icon icon={Sparkles} size={13} />
            <span>Sri Lankan National Curriculum &bull; Grades 9–11</span>
          </div>

          <h1 className="text-[clamp(2.75rem,5.5vw,5.5rem)] font-display font-black text-[var(--color-text-primary)] leading-[1.02] mb-6 tracking-tight">
            The tutor that <span className="text-[var(--color-accent)]">diagnoses</span> why you missed, then teaches until you understand.
          </h1>

          <p className="text-[var(--font-size-body-lg)] text-[var(--color-text-secondary)] max-w-lg mb-8 leading-relaxed font-body">
            Not another static question bank. NexLearn adapts question by question, notices when you hesitate, and steps in with whiteboard proofs before misconceptions solidify.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/login')}
              className="group shadow-sm hover:border-[var(--color-border-hover)]"
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
              <Icon icon={ShieldCheck} size={18} className="text-[var(--color-text-secondary)]" />
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
              <span className="block text-2xl font-display font-black text-[var(--color-text-primary)]">
                <AnimatedCounter value={100} suffix="%" />
              </span>
              <span>Deterministic Tokens</span>
            </div>
          </div>
        </motion.div>

        {/* Right 40% Column: Companion Stage */}
        <motion.div
          className="lg:col-span-5 flex items-center justify-center relative"
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.26, delay: 0.08, ease: [0.65, 0, 0.35, 1] }}
        >
          {/* Card container for mascot with 12px radius and 1px border */}
          <div className="relative w-full max-w-md aspect-square rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex flex-col items-center justify-center p-8 overflow-hidden shadow-sm">
            {/* Subtle radial glow strictly behind Nex */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: 'radial-gradient(circle at center, var(--color-accent) 0%, transparent 65%)',
              }}
            />

            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]" />
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
