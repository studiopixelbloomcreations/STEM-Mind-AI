import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Lightbulb, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { TeachingStep } from '../../lib/api/harmony';

export interface FeedbackBannerProps {
  status: 'correct' | 'incorrect' | 'teaching';
  correctAnswer: string;
  explanationSteps?: TeachingStep[];
  examTips?: string;
  onContinue: () => void;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  status,
  correctAnswer,
  explanationSteps = [],
  examTips,
  onContinue,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const isSuccess = status === 'correct';

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full mt-6"
    >
      <Card
        className={`p-6 border ${
          isSuccess
            ? 'bg-[#3dd9a40a] border-[var(--color-success)]'
            : 'bg-[#ffc15e0a] border-[var(--color-warning)]'
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                isSuccess ? 'bg-[#3dd9a422] text-[var(--color-success)]' : 'bg-[#ffc15e22] text-[var(--color-warning)]'
              }`}
            >
              <Icon icon={isSuccess ? CheckCircle2 : AlertCircle} size={20} />
            </div>
            <div>
              <h4 className="text-base font-display font-bold text-white">
                {isSuccess
                  ? 'Excellent reasoning! That is correct.'
                  : status === 'teaching'
                  ? 'Tutor Mode: Let&apos;s break down the solution'
                  : 'Not quite, but you are very close!'}
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] font-mono mt-0.5">
                Target value: <span className="text-white font-bold">{correctAnswer}</span>
              </p>
            </div>
          </div>

          <Badge variant={isSuccess ? 'success' : 'warning'}>
            {isSuccess ? 'Verified' : 'Review'}
          </Badge>
        </div>

        {/* Step-by-step whiteboard explanation */}
        {explanationSteps.length > 0 && (
          <div className="space-y-3 my-4">
            {explanationSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs text-[#F5F6F8] space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-[var(--color-accent-primary)] font-mono font-bold">
                  <Icon icon={Lightbulb} size={14} />
                  <span>{step.caption || `Step ${idx + 1}`}</span>
                </div>
                {step.visual && (
                  <div
                    className="font-mono text-xs text-[var(--color-text-primary)]"
                    dangerouslySetInnerHTML={{ __html: step.visual }}
                  />
                )}
                {step.speech && (
                  <p className="text-[var(--color-text-secondary)] italic">
                    &ldquo;{step.speech}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {examTips && (
          <div className="p-3 rounded-md bg-[#1C202B] border border-[#2D3547] text-xs text-[var(--color-text-secondary)] my-3 flex items-start gap-2">
            <span className="font-mono font-bold text-[var(--color-accent-secondary)] uppercase">
              Exam Coach:
            </span>
            <span>{examTips}</span>
          </div>
        )}

        <div className="flex justify-end mt-5 pt-3 border-t border-[var(--color-border)]">
          <Button variant="primary" size="md" onClick={onContinue} className="group">
            <span>Next Challenge</span>
            <Icon
              icon={ArrowRight}
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
