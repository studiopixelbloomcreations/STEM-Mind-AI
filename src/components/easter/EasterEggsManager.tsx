import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Icon } from '../ui/Icon';
import { Sparkles, Terminal, X } from '../icons';

export const EasterEggsManager: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Buffer for Konami code: Up Up Down Down Left Right Left Right B A
  const konamiSequence = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];
  const konamiIndex = useRef(0);

  // Buffer for typing "nex"
  const nexSequence = ['n', 'e', 'x'];
  const nexIndex = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // RULE 1: NEVER fire mid-quiz under any circumstances
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/quiz')) {
        konamiIndex.current = 0;
        nexIndex.current = 0;
        return;
      }

      // RULE 2: Ignore typing inside form inputs, textareas, or contentEditable elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key;

      // --- Egg 1: Konami Code Check ---
      const expectedKonamiKey = konamiSequence[konamiIndex.current];
      if (key.toLowerCase() === expectedKonamiKey.toLowerCase()) {
        konamiIndex.current += 1;
        if (konamiIndex.current === konamiSequence.length) {
          konamiIndex.current = 0;
          // Trigger Konami Egg
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#FF6B4A', '#FAFAFA', '#3DD9A4'],
            });
          } catch (err) {
            // fallback
          }

          setToastMessage('Protocol 1986 unlocked: Diagnostic frontier expanded.');
          window.dispatchEvent(new CustomEvent('nex-easter-egg', { detail: 'celebrate' }));
        }
      } else {
        konamiIndex.current = 0;
      }

      // --- Egg 5: Typing "nex" Check ---
      const expectedNexKey = nexSequence[nexIndex.current];
      if (key.toLowerCase() === expectedNexKey.toLowerCase()) {
        nexIndex.current += 1;
        if (nexIndex.current === nexSequence.length) {
          nexIndex.current = 0;
          // Trigger Nex Wave Egg
          window.dispatchEvent(new CustomEvent('nex-easter-egg', { detail: 'wave' }));
          setToastMessage('Nex: "Diagnostic core online. Ready when you are."');
        }
      } else {
        nexIndex.current = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.aside
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.65, 0, 0.35, 1] }}
          className="fixed bottom-6 right-6 z-50 max-w-sm liquid-glass specular-highlight rounded-xl p-4 shadow-2xl border border-[var(--color-border)]"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-accent)] shrink-0">
              <Icon icon={Terminal} size={16} />
            </div>
            <div className="flex-1 pr-2">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)] font-bold mb-0.5">
                System Telemetry
              </span>
              <p className="text-xs font-mono text-[var(--color-text-primary)] leading-relaxed">
                {toastMessage}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
              aria-label="Dismiss message"
            >
              <Icon icon={X} size={14} />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
