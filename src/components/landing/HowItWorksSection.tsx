import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { CheckCircle2, HelpCircle, ArrowRight, Lightbulb, TrendingUp } from '../icons';
import { RevealOnScroll } from '../ui/RevealOnScroll';

interface Beat {
  step: string;
  title: string;
  subtitle: string;
  mockup: React.ReactNode;
}

export const HowItWorksSection: React.FC = () => {
  const [activeBeat, setActiveBeat] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const beats: Beat[] = [
    {
      step: '01',
      title: 'Targeted Assessment',
      subtitle: 'The Council generates a syllabus-aligned question tailored to your current performance frontier.',
      mockup: (
        <Card className="w-full max-w-lg mx-auto bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="default">Physics &bull; Grade 10</Badge>
            <span className="text-xs font-mono text-[var(--color-text-secondary)]">Difficulty: Medium</span>
          </div>
          <p className="text-base font-medium text-[var(--color-text-primary)] mb-6">
            A stone is dropped from a cliff 45m high. Taking g = 10 m/s², calculate the speed of the stone just before striking the ground.
          </p>
          <div className="space-y-2">
            {['15 m/s', '25 m/s', '30 m/s', '45 m/s'].map((opt, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] flex items-center justify-between hover:border-[var(--color-border-hover)] transition-colors"
              >
                <span>{opt}</span>
                <span className="w-4 h-4 rounded-full border border-[var(--color-border)]" />
              </div>
            ))}
          </div>
        </Card>
      ),
    },
    {
      step: '02',
      title: 'Real-time Hesitation & Trap Detection',
      subtitle: 'If you choose an answer containing a common exam misconception, Nex catches it immediately without shaming.',
      mockup: (
        <Card className="w-full max-w-lg mx-auto bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="warning">Misconception Caught</Badge>
            <span className="text-xs font-mono text-[var(--color-warning)]">Gentle Intervention</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-xs text-[var(--color-warning)] mb-4 flex items-center gap-2">
            <Icon icon={HelpCircle} size={16} />
            <span>Common trap: multiplying height by time instead of using v² = u² + 2as.</span>
          </div>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-warning)] text-sm text-[var(--color-text-primary)] flex items-center justify-between">
              <span>25 m/s (Selected)</span>
              <span className="text-xs text-[var(--color-warning)] font-mono">Revising...</span>
            </div>
          </div>
        </Card>
      ),
    },
    {
      step: '03',
      title: 'Interactive Whiteboard Explanation',
      subtitle: 'The tutor steps in with step-by-step mathematical proofs and friendly narration to dissolve the blocker.',
      mockup: (
        <Card className="w-full max-w-lg mx-auto bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-3">
            <Icon icon={Lightbulb} size={16} className="text-[var(--color-accent)]" />
            <span className="text-xs font-mono text-[var(--color-accent)] uppercase">Step 2 of 3 &bull; Proof</span>
          </div>
          <div className="bg-[var(--color-bg-surface-alt)] p-4 rounded-lg border border-[var(--color-border)] mb-4 font-mono text-xs space-y-2 text-[var(--color-text-primary)]">
            <p className="text-[var(--color-text-secondary)]">// Equation of motion under gravity:</p>
            <p className="text-[var(--color-accent)]">v² = u² + 2as</p>
            <p className="text-[var(--color-text-secondary)]">// Substitute: u = 0, a = 10 m/s², s = 45m:</p>
            <p className="text-[var(--color-success)] font-bold">v² = 0 + 2(10)(45) = 900  =&gt;  v = 30 m/s</p>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            &ldquo;Since initial velocity is zero, all potential energy transforms directly into kinetic energy.&rdquo;
          </p>
        </Card>
      ),
    },
    {
      step: '04',
      title: 'Mastery & Confidence Updated',
      subtitle: 'Your personal knowledge tree updates its weights, locking in mastery and adjusting tomorrow&apos;s recall curve.',
      mockup: (
        <Card className="w-full max-w-lg mx-auto bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-[var(--color-success)] flex items-center gap-1">
              <Icon icon={CheckCircle2} size={14} /> Concept Mastered
            </span>
            <span className="text-xs font-mono text-[var(--color-accent)]">+15 Elo</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-[var(--color-text-secondary)]">
                <span>Motion Under Gravity</span>
                <span className="text-[var(--color-success)] font-bold">92%</span>
              </div>
              <div className="w-full h-2 bg-[var(--color-bg-surface-alt)] rounded-full overflow-hidden border border-[var(--color-border)]">
                <div className="h-full bg-[var(--color-success)] rounded-full w-[92%]" />
              </div>
            </div>
            <div className="p-3 bg-[var(--color-bg-surface-alt)] rounded-lg border border-[var(--color-border)] flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)]">Next Recommended Topic</span>
              <span className="text-[var(--color-text-primary)] font-semibold flex items-center gap-1">
                Conservation of Momentum <Icon icon={TrendingUp} size={14} className="text-[var(--color-accent)]" />
              </span>
            </div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)] border-y border-[var(--color-border)]">
      <RevealOnScroll className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="accent" className="mb-4">The Guided Loop</Badge>
          <h2 className="text-[var(--font-size-h1)] font-display font-bold text-[var(--color-text-primary)] mb-4">
            How Nex turns confusion into mastery
          </h2>
          <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)]">
            A choreographed 4-beat loop designed to ensure no student ever hits a permanent dead end.
          </p>
        </div>

        {/* 4-Step Interactive Beat Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {beats.map((beat, index) => {
            const isActive = activeBeat === index;
            return (
              <button
                key={index}
                onClick={() => setActiveBeat(index)}
                className={`p-4 rounded-lg text-left transition-all border ${
                  isActive
                    ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent)] shadow-sm'
                    : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-bold ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`}>
                    {beat.step}
                  </span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />}
                </div>
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{beat.title}</h4>
              </button>
            );
          })}
        </div>

        {/* Active Beat Presentation Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center min-h-[380px]">
          <div className="lg:col-span-5 text-left">
            <span className="text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider mb-2 block">
              Phase {beats[activeBeat].step} &bull; Directed Feedback
            </span>
            <h3 className="text-2xl lg:text-3xl font-display font-bold text-[var(--color-text-primary)] mb-4">
              {beats[activeBeat].title}
            </h3>
            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed mb-6">
              {beats[activeBeat].subtitle}
            </p>

            {/* Bespoke Animated SVG Adaptive Branching Visual */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] mb-6 overflow-hidden relative">
              <span className="text-[10px] font-mono text-[var(--color-text-secondary)] uppercase tracking-wider block mb-2 font-bold">
                Adaptive Council Graph Pathing
              </span>
              <svg viewBox="0 0 320 70" className="w-full h-16 text-[var(--color-text-primary)]">
                {/* Connecting paths with animated dash/length */}
                <motion.path
                  d="M 30 35 L 100 35 Q 120 35 135 20 L 175 20 Q 190 20 205 35 L 290 35"
                  fill="none"
                  stroke="var(--color-border-hover)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  animate={{ strokeDashoffset: [0, -16] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
                <motion.path
                  d="M 100 35 Q 120 35 135 50 L 175 50 Q 190 50 205 35"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="2"
                  initial={{ pathLength: 0.2 }}
                  animate={{ pathLength: activeBeat >= 1 ? 1 : 0.2 }}
                  transition={{ duration: 0.3, ease: [0.65, 0, 0.35, 1] }}
                />

                {/* Nodes */}
                <circle cx="30" cy="35" r="7" fill={activeBeat >= 0 ? "var(--color-accent)" : "var(--color-border)"} />
                <text x="30" y="55" fontSize="8" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="monospace">Start</text>

                <circle cx="100" cy="35" r="7" fill={activeBeat >= 1 ? "var(--color-warning)" : "var(--color-border)"} />
                <text x="100" y="55" fontSize="8" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="monospace">Trap Caught</text>

                <circle cx="175" cy={activeBeat === 2 ? 50 : 20} r="7" fill={activeBeat >= 2 ? "var(--color-accent)" : "var(--color-border)"} />
                <text x="175" y="65" fontSize="8" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="monospace">Proof Fix</text>

                <circle cx="290" cy="35" r="8" fill={activeBeat >= 3 ? "var(--color-success)" : "var(--color-border)"} />
                <text x="290" y="55" fontSize="8" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="monospace">Mastery</text>
              </svg>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveBeat((prev) => (prev + 1) % beats.length)}
            >
              <span>Next Beat</span>
              <Icon icon={ArrowRight} size={14} />
            </Button>
          </div>

          <div className="lg:col-span-7 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBeat}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.99 }}
                transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
                className="w-full flex justify-center"
              >
                {beats[activeBeat].mockup}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
};
