import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NexLogo } from '../../components/mascot/NexLogo';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Brain, Sparkles } from '../../components/icons';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Liquid Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-md w-full p-8 rounded-3xl border border-white/10 bg-neutral-900/60 dark:bg-black/60 backdrop-blur-2xl shadow-2xl text-center space-y-6"
      >
        {/* Nex Mascot Avatar */}
        <div className="relative inline-flex items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 ring-1 ring-white/5">
          <NexLogo className="w-12 h-12 text-[var(--color-accent)]" />
          <motion.span
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]"
          />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono tracking-widest uppercase text-[var(--color-accent)] font-medium">
            Error 404 — Coordinate Undefined
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Knowledge Boundary Reached
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The concept or screen you navigated to hasn't been charted in this syllabus quadrant yet. Let's return to your active learning pathway.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center gap-2"
            onClick={() => navigate('/hub')}
          >
            <Brain className="w-4 h-4" />
            <span>Return to Learning Hub</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            className="w-full justify-center gap-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Landing Page</span>
          </Button>
        </div>

        <p className="text-[10px] font-mono text-neutral-500">
          Tip: Press <kbd className="px-1 py-0.5 rounded border border-white/10 bg-white/5 text-neutral-400">⌘K</kbd> to open Command Palette
        </p>
      </motion.div>
    </div>
  );
};
