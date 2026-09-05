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
          let borderState = 'border-[var(--color-border)] hover:border-[#424A60]';
          let bgState = 'bg-[var(--color-bg-surface)]';

          if (isSelected) {
            bgState = 'bg-[#1C202B]';
            borderState = 'border-[var(--color-accent-primary)] shadow-md';
          }

          if (isSelected && status === 'correct') {
            bgState = 'bg-[#3dd9a41c]';
            borderState = 'border-[var(--color-success)] text-[var(--color-success)]';
          } else if (isSelected && status === 'incorrect') {
            bgState = 'bg-[#ffc15e1c]';
            borderState = 'border-[var(--color-warning)] text-[var(--color-warning)]';
          }

          return (
            <motion.button
              key={index}
              disabled={disabled}
              onClick={() => onChange(choice)}
              whileHover={shouldReduceMotion || disabled ? {} : { scale: 1.015 }}
              whileTap={shouldReduceMotion || disabled ? {} : { scale: 0.985 }}
              animate={
                !shouldReduceMotion && isSelected && status === 'incorrect'
                  ? { x: [-4, 4, -3, 3, 0] }
                  : !shouldReduceMotion && isSelected && status === 'correct'
                  ? { scale: [1, 1.04, 1] }
                  : {}
              }
              transition={{ duration: 0.25, ease: [0.34, 1.4, 0.44, 1] }}
              className={`p-4 rounded-md border text-left font-body text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${bgState} ${borderState}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#0B0D12] border border-[#2D3345] flex items-center justify-center text-xs font-mono text-[var(--color-text-secondary)]">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-white">{choice}</span>
              </div>
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected
                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]'
                    : 'border-gray-600'
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
    let borderState = 'border-[var(--color-border)] focus:border-[var(--color-accent-primary)]';
    if (status === 'correct') borderState = 'border-[var(--color-success)] bg-[#3dd9a40f]';
    if (status === 'incorrect') borderState = 'border-[var(--color-warning)] bg-[#ffc15e0f]';

    return (
      <motion.div
        animate={
          !shouldReduceMotion && status === 'incorrect'
            ? { x: [-4, 4, -3, 3, 0] }
            : !shouldReduceMotion && status === 'correct'
            ? { scale: [1, 1.04, 1] }
            : {}
        }
        transition={{ duration: 0.25 }}
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
          className={`w-full p-4 text-2xl font-mono font-bold text-white bg-[var(--color-bg-surface)] rounded-md border ${borderState} focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)] transition-all`}
        />
      </motion.div>
    );
  }

  // SHORT_ANSWER rendering: expanding clean textarea
  let borderState = 'border-[var(--color-border)] focus:border-[var(--color-accent-primary)]';
  if (status === 'correct') borderState = 'border-[var(--color-success)] bg-[#3dd9a40f]';
  if (status === 'incorrect') borderState = 'border-[var(--color-warning)] bg-[#ffc15e0f]';

  return (
    <motion.div
      animate={
        !shouldReduceMotion && status === 'incorrect'
          ? { x: [-4, 4, -3, 3, 0] }
          : !shouldReduceMotion && status === 'correct'
          ? { scale: [1, 1.04, 1] }
          : {}
      }
      transition={{ duration: 0.25 }}
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
        className={`w-full p-3.5 text-sm font-body text-white bg-[var(--color-bg-surface)] rounded-md border ${borderState} focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)] transition-all resize-y`}
      />
    </motion.div>
  );
};
