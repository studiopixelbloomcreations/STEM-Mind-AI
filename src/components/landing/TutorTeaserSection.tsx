import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { NexPlaceholder } from '../mascot/NexPlaceholder';
import { Sparkles, Brain, Clock, ShieldCheck } from '../icons';
import { Icon } from '../ui/Icon';

export const TutorTeaserSection: React.FC = () => {
  return (
    <section className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)] border-t border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Mascot Placeholder Display */}
        <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
          <div className="relative p-10 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm flex flex-col items-center">
            <div className="absolute top-4 right-4">
              <Badge variant="accent">AI Companion</Badge>
            </div>
            <NexPlaceholder size={220} />
            <div className="mt-6 text-center">
              <span className="text-xs font-mono text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">
                Evolving AI Persona
              </span>
              <h4 className="text-lg font-display font-bold text-[var(--color-text-primary)]">Nex</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs">
                Your quiet, patient study partner. Watches for hesitations, celebrates hard-earned breakthroughs.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Honest capabilities & companion design intent */}
        <div className="lg:col-span-7 text-left order-1 lg:order-2">
          <Badge variant="accent" className="mb-4">Evolving Companion</Badge>
          <h2 className="text-[var(--font-size-h1)] font-display font-bold text-[var(--color-text-primary)] mb-6">
            Meet Nex: The AI companion built for how teenagers actually learn
          </h2>
          <p className="text-[var(--font-size-body-lg)] text-[var(--color-text-secondary)] mb-8 leading-relaxed font-body">
            Nex isn&apos;t a cartoon mascot or a chatbot widget glued onto a quiz. He is an embodied presence that stays on your side of the desk — never condescending, never impatient, and grounded in rigorous STEM reasoning.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 bg-[var(--color-bg-surface)]">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-accent)]">
                  <Icon icon={Brain} size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Adaptive Council Backing</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Powered by multi-agent specialists that evaluate step-by-step reasoning rather than guessing.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-[var(--color-bg-surface)]">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-success)]">
                  <Icon icon={Clock} size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Unlimited Patience</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Stuck on the same physics proof three times? Nex restructures the analogy each round.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-[var(--color-bg-surface)]">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-accent)]">
                  <Icon icon={Sparkles} size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Empathetic Pacing</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Never throws a sudden fail screen. The &quot;I&apos;m Stuck&quot; protocol triggers gentle supportive proofs.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-[var(--color-bg-surface)]">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-warning)]">
                  <Icon icon={ShieldCheck} size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Zero Hallucinations</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Strict mathematical verification and syllabus checks ensure formulas and constants stay accurate.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
