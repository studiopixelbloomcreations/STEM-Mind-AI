import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface AnswerInputProps {
  questionType: 'MCQ' | 'NUMERICAL' | 'SHORT_ANSWER';
  choices?: string[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  status?: 'idle' | 'correct' | 'incorrect';
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  questionType,
  choices = [],
  value,
  onChange,
  disabled = false,
  status = 'idle',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // MCQ rendering
  if (questionType === 'MCQ' && choices.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {choices.map((choice, index) => {
          const isSelected = value === choice;
          let borderState = 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]';
          let bgState = 'bg-[var(--color-bg-surface)]';

          if (isSelected) {
            bgState = 'bg-[var(--color-bg-surface-alt)]';
            borderState = 'border-[var(--color-accent)] shadow-sm';
          }

          if (isSelected && status === 'correct') {
            bgState = 'bg-[var(--color-bg-surface-alt)]';
            borderState = 'border-[var(--color-success)] text-[var(--color-success)]';
          } else if (isSelected && status === 'incorrect') {
            bgState = 'bg-[var(--color-bg-surface-alt)]';
            borderState = 'border-[var(--color-warning)] text-[var(--color-warning)]';
          }

          return (
            <motion.button
              key={index}
              disabled={disabled}
              onClick={() => onChange(choice)}
              whileHover={shouldReduceMotion || disabled ? {} : { y: -1 }}
              whileTap={shouldReduceMotion || disabled ? {} : { scale: 0.99 }}
              animate={
                !shouldReduceMotion && isSelected && status === 'correct'
                  ? { scale: [1, 1.03, 1] }
                  : {}
              }
              transition={
                status === 'correct'
                  ? { type: 'spring', stiffness: 400, damping: 15 }
                  : { duration: 0.14, ease: [0.65, 0, 0.35, 1] }
              }
              className={`p-4 rounded-lg border text-left font-body text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${bgState} ${borderState}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] flex items-center justify-center text-xs font-mono text-[var(--color-text-secondary)]">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-[var(--color-text-primary)]">{choice}</span>
              </div>
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // NUMERICAL rendering: single large focused input
  if (questionType === 'NUMERICAL') {
    let borderState = 'border-[var(--color-border)] focus:border-[var(--color-accent)]';
    if (status === 'correct') borderState = 'border-[var(--color-success)]';
    if (status === 'incorrect') borderState = 'border-[var(--color-warning)]';

    return (
      <motion.div
        animate={
          !shouldReduceMotion && status === 'correct'
            ? { scale: [1, 1.02, 1] }
            : {}
        }
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="w-full max-w-md"
      >
        <label className="block text-xs font-mono text-[var(--color-text-secondary)] uppercase mb-2">
          Enter Numerical Value
        </label>
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 30"
          className={`w-full p-4 text-2xl font-mono font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-surface-alt)] rounded-lg border ${borderState} focus:outline-none transition-colors`}
        />
      </motion.div>
    );
  }

  // SHORT_ANSWER rendering: expanding clean textarea
  let borderState = 'border-[var(--color-border)] focus:border-[var(--color-accent)]';
  if (status === 'correct') borderState = 'border-[var(--color-success)]';
  if (status === 'incorrect') borderState = 'border-[var(--color-warning)]';

  return (
    <motion.div
      animate={
        !shouldReduceMotion && status === 'correct'
          ? { scale: [1, 1.02, 1] }
          : {}
      }
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className="w-full"
    >
      <label className="block text-xs font-mono text-[var(--color-text-secondary)] uppercase mb-2">
        Type Your Scientific Explanation
      </label>
      <textarea
        rows={3}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your reasoning here..."
        className={`w-full p-3.5 text-sm font-body text-[var(--color-text-primary)] bg-[var(--color-bg-surface-alt)] rounded-lg border ${borderState} focus:outline-none transition-colors resize-y`}
      />
    </motion.div>
  );
};
