import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ArrowRight, Sparkles } from 'lucide-react';
import { NexPlaceholder } from '../mascot/NexPlaceholder';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden px-6 lg:px-16 pt-12 pb-20">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF6B4A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5B7CFA]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        {/* Left 60% Column: Confident Typography */}
        <motion.div
          className="lg:col-span-7 flex flex-col items-start text-left"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle micro tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C202B] border border-[var(--color-border)] text-xs font-mono tracking-wider uppercase text-[var(--color-accent-primary)] mb-6">
            <Icon icon={Sparkles} size={14} />
            <span>Sri Lankan GCE O/L & A/L Curriculum</span>
          </div>

          <h1 className="text-[var(--font-size-display)] font-display font-extrabold text-[var(--color-text-primary)] leading-[1.04] mb-6 tracking-tight">
            The tutor that <span className="text-[var(--color-accent-primary)]">diagnoses</span> why you missed, then teaches until you understand.
          </h1>

          <p className="text-[var(--font-size-body-lg)] text-[var(--color-text-secondary)] max-w-lg mb-8 leading-relaxed font-body">
            Not another static question bank. NexLearn adapts question by question, notices when you hesitate, and steps in with whiteboard proofs before misconceptions solidify.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/onboarding')}
              className="group"
            >
              <span>Start Learning Free</span>
              <Icon
                icon={ArrowRight}
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See How It Works
            </Button>
          </div>

          {/* Social proof metric badges */}
          <div className="mt-12 pt-8 border-t border-[var(--color-border)]/60 flex items-center gap-8 text-xs text-[var(--color-text-secondary)] font-mono">
            <div>
              <span className="block text-lg font-display font-bold text-white">Grades 9–11</span>
              <span>Targeted syllabi</span>
            </div>
            <div className="h-8 w-px bg-[var(--color-border)]" />
            <div>
              <span className="block text-lg font-display font-bold text-[var(--color-success)]">±2%</span>
              <span>Numerical tolerance</span>
            </div>
            <div className="h-8 w-px bg-[var(--color-border)]" />
            <div>
              <span className="block text-lg font-display font-bold text-[var(--color-accent-secondary)]">100%</span>
              <span>Adaptive DAG council</span>
            </div>
          </div>
        </motion.div>

        {/* Right 40% Column: Mascot Placeholder Stage */}
        <motion.div
          className="lg:col-span-5 flex items-center justify-center relative"
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Card container for mascot */}
          <div className="relative w-full max-w-md aspect-square rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex flex-col items-center justify-center p-8 overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase">Nex AI Active</span>
            </div>

            <NexPlaceholder size={240} />

            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                &ldquo;Ready when you are. Let&apos;s conquer today&apos;s target.&rdquo;
              </p>
              <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                Listening &bull; Ready to teach
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
