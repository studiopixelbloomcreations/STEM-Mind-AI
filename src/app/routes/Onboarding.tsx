import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Icon } from '../../components/ui/Icon';
import { ArrowRight, Check, Sparkles } from '../../components/icons';
import { NexPlaceholder } from '../../components/mascot/NexPlaceholder';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number>(10);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Physics', 'Mathematics']);

  const subjectsList = ['Physics', 'Mathematics', 'Chemistry', 'Biology', 'Combined Maths', 'ICT'];

  const toggleSubject = (s: string) => {
    if (selectedSubjects.includes(s)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((item) => item !== s));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, s]);
    }
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Complete onboarding and store local student profile
      const studentProfile = {
        name: name.trim() || 'Student',
        grade,
        preferred_subjects: selectedSubjects,
      };
      localStorage.setItem('nexlearn_active_student', JSON.stringify(studentProfile));
      navigate('/hub');
    }
  };

  const stepProgress = ((step + 1) / 3) * 100;

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col justify-between p-6 lg:p-12">
      {/* Top Header & Progress */}
      <div className="max-w-xl w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-display font-black text-[var(--color-text-primary)]">
            NexLearn<span className="text-[var(--color-accent)]">.</span>
          </span>
          <span className="text-xs font-mono text-[var(--color-text-secondary)]">
            STEP {step + 1} OF 3
          </span>
        </div>
        <ProgressBar value={stepProgress} variant="accent" size="sm" />
      </div>

      {/* Center Interactive Step */}
      <div className="max-w-xl w-full mx-auto my-auto py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
            >
              <Card className="p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-[var(--color-accent)]">
                  <Icon icon={Sparkles} size={20} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Welcome to NexLearn</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-[var(--color-text-primary)] mb-2">
                  What should Nex call you?
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  Your name will be used to calibrate your personal progress telemetry.
                </p>

                <Input
                  label="Your Name or Nickname"
                  placeholder="e.g. Sahan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />

                <div className="mt-8 flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    disabled={!name.trim()}
                    className="group"
                  >
                    <span>Continue</span>
                    <Icon icon={ArrowRight} size={16} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
            >
              <Card className="p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent)] mb-2 block">
                  Curriculum Alignment
                </span>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-[var(--color-text-primary)] mb-2">
                  Which grade are you preparing for?
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  Nex maps questions directly to the national exam specifications for your grade.
                </p>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[9, 10, 11].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrade(g)}
                      className={`p-5 rounded-lg border text-center font-display font-bold text-lg transition-colors cursor-pointer ${
                        grade === g
                          ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent)] text-[var(--color-accent)] shadow-sm'
                          : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      Grade {g}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button variant="primary" size="md" onClick={handleNext}>
                    <span>Continue</span>
                    <Icon icon={ArrowRight} size={16} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
            >
              <Card className="p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-success)] mb-2 block">
                  Subject Focus
                </span>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-[var(--color-text-primary)] mb-2">
                  Choose your STEM focus
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  Select the subjects you are studying this term. You can change this at any time.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {subjectsList.map((s) => {
                    const isSelected = selectedSubjects.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSubject(s)}
                        className={`p-4 rounded-lg border text-left font-body text-sm font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent)] text-[var(--color-text-primary)] shadow-sm'
                            : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                        }`}
                      >
                        <span>{s}</span>
                        {isSelected && (
                          <motion.svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[var(--color-accent)]"
                          >
                            <motion.path
                              d="M20 6L9 17L4 12"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.16, ease: 'easeOut' }}
                            />
                          </motion.svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" size="md" onClick={handleNext}>
                    <span>Complete &bull; Launch Hub</span>
                    <Icon icon={ArrowRight} size={16} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="text-center text-xs font-mono text-[var(--color-text-tertiary)]">
        NexLearn &bull; Quiet confidence in STEM education
      </div>
    </div>
  );
};
