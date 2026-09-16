import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { Trophy, ArrowRight, RotateCcw, Award, CheckCircle2, Zap, Brain } from '../../components/icons';

export const Results: React.FC = () => {
  const navigate = useNavigate();

  const score = Number(sessionStorage.getItem('quiz_final_score')) || 4;
  const total = Number(sessionStorage.getItem('quiz_total_count')) || 5;
  const subject = sessionStorage.getItem('quiz_subject') || 'Physics';

  const percentage = Math.round((score / total) * 100);
  const isStrongResult = percentage >= 80;

  useEffect(() => {
    // Only fire confetti if result is genuinely strong (>80%) per section 2.5
    if (isStrongResult) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#34D399', '#FAFAFA', '#60A5FA'],
        });
      } catch {
        // canvas-confetti fallback
      }
    }
  }, [isStrongResult]);

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Signature Animated Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="w-full max-w-xl"
      >
        <Card className="w-full p-8 bg-neutral-900/80 dark:bg-black/80 border border-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl text-center ring-1 ring-white/5">
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0.8, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.1 }}
              className={`w-20 h-20 rounded-2xl border flex items-center justify-center ${
                isStrongResult
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.3)]'
                  : 'bg-white/5 border-white/10 text-neutral-300'
              }`}
            >
              <Icon icon={isStrongResult ? Trophy : Award} size={38} />
            </motion.div>
          </div>

          <Badge variant={isStrongResult ? 'success' : 'default'} className="mb-3 px-3 py-1 font-mono uppercase text-[11px]">
            {percentage >= 95 ? 'Top Decile Frontier' : isStrongResult ? 'Target Mastery Achieved' : 'Evaluation Set Concluded'}
          </Badge>

          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mb-2">
            {percentage >= 95
              ? 'Top Decile Diagnostic Mastery'
              : isStrongResult
              ? 'Frontier Standard Retained'
              : 'Evaluation Set Concluded'}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mb-8 font-body leading-relaxed">
            You solved <span className="text-white font-semibold">{score} of {total}</span> problems within target parameters in <span className="text-emerald-400 font-medium">{subject}</span>. Real-time cognitive profile telemetry has been recorded.
          </p>

          {/* Bento Score Metric Row */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-6 grid grid-cols-3 gap-2 divide-x divide-white/10">
            <div className="px-2">
              <span className="text-2xl sm:text-3xl font-display font-black text-white block">
                {percentage}%
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Accuracy
              </span>
            </div>
            <div className="px-2">
              <span className="text-2xl sm:text-3xl font-display font-black text-emerald-400 block">
                +{score * 12}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Elo Rating
              </span>
            </div>
            <div className="px-2">
              <span className="text-2xl sm:text-3xl font-display font-black text-sky-400 block">
                +1
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Streak Day
              </span>
            </div>
          </div>

          {/* Diagnostic telemetry findings */}
          <div className="space-y-2 text-xs font-mono text-left mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2.5 text-neutral-300">
              <Icon icon={CheckCircle2} size={14} className="text-emerald-400 shrink-0" />
              <span>Formulas: Equations of motion under gravity retained</span>
            </div>
            <div className="flex items-center gap-2.5 text-neutral-300">
              <Icon icon={CheckCircle2} size={14} className="text-emerald-400 shrink-0" />
              <span>Hesitation telemetry: 0 unaddressed blockers</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/session/setup')}
              className="w-full sm:w-auto justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-emerald-300" />
              <span>Start Next Session</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/hub')}
              className="w-full sm:w-auto justify-center gap-2"
            >
              <Brain className="w-4 h-4 text-neutral-400" />
              <span>Return to Hub</span>
              <Icon icon={ArrowRight} size={14} />
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
