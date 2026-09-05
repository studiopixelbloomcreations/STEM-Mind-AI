import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ArrowRight, Sparkles } from '../icons';
import { useNavigate } from 'react-router-dom';

export const FinalCtaSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full py-28 px-6 lg:px-16 bg-[var(--color-bg-base)] relative overflow-hidden border-t border-[var(--color-border)]">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent)] mb-6">
          <Icon icon={Sparkles} size={14} />
          <span>Zero installation &bull; Web native</span>
        </div>

        <h2 className="text-[var(--font-size-display)] font-display font-extrabold text-[var(--color-text-primary)] mb-6 leading-tight tracking-tight">
          Ready to experience an AI tutor that genuinely teaches?
        </h2>

        <p className="text-[var(--font-size-body-lg)] text-[var(--color-text-secondary)] max-w-xl mx-auto mb-10 leading-relaxed font-body">
          Join students across Sri Lanka mastering STEM subjects through adaptive questions, zero judgment, and crystal-clear whiteboard proofs.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8"
          >
            <span>Launch Student Session</span>
            <Icon icon={ArrowRight} size={18} />
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/teacher')}
            className="w-full sm:w-auto px-8"
          >
            <span>Teacher Portal</span>
          </Button>
        </div>
      </div>
    </section>
  );
};
