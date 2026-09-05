import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from '../icons';
import { Icon } from '../ui/Icon';
import { NexLogo } from '../mascot/NexLogo';

export const Footer: React.FC = () => {
  const [showDedication, setShowDedication] = useState(false);

  return (
    <footer className="w-full bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-t border-[var(--color-border)] py-16 px-6 lg:px-16 font-body">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-3">
              <NexLogo size={30} />
              <span className="text-3xl font-display font-extrabold text-[var(--color-text-primary)] tracking-tight">
                NexLearn<span className="text-[var(--color-accent)]">.</span>
              </span>
            </div>
            <p className="text-sm max-w-sm leading-relaxed mb-6">
              The operating system for personal AI STEM education. Built with quiet confidence for Grades 9–11 students and educators.
            </p>
            <div className="relative inline-block text-xs font-mono text-[var(--color-text-tertiary)]">
              &copy;{' '}
              <span
                onMouseEnter={() => setShowDedication(true)}
                onMouseLeave={() => setShowDedication(false)}
                onClick={() => setShowDedication((prev) => !prev)}
                className="cursor-pointer underline decoration-dotted decoration-[var(--color-border-hover)] hover:text-[var(--color-accent)] transition-colors"
                title="System Dedication"
              >
                {new Date().getFullYear()}
              </span>{' '}
              NexLearn Technologies. All rights reserved.

              {/* Discreet Dedication Bubble */}
              <AnimatePresence>
                {showDedication && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: -4, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
                    className="absolute left-0 bottom-full mb-2 p-3 w-72 rounded-xl liquid-glass specular-highlight border border-[var(--color-border)] shadow-xl z-20 pointer-events-none text-left"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--color-accent)] uppercase font-bold mb-1">
                      <Icon icon={Sparkles} size={11} />
                      <span>Dedicated to Excellence</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-primary)] font-normal leading-relaxed">
                      Crafted with precision &amp; care for Sri Lankan STEM scholars and educators. In quiet pursuit of mastery.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Links Column 1: Curriculum */}
          <div className="md:col-span-2 md:col-start-7">
            <h5 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-primary)] font-semibold mb-4">
              Curriculum
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/login" className="hover:text-[var(--color-text-primary)] transition-colors">Physics O/L</Link></li>
              <li><Link to="/login" className="hover:text-[var(--color-text-primary)] transition-colors">Mathematics O/L</Link></li>
              <li><Link to="/login" className="hover:text-[var(--color-text-primary)] transition-colors">Chemistry O/L</Link></li>
              <li><Link to="/login" className="hover:text-[var(--color-text-primary)] transition-colors">Combined Maths</Link></li>
              <li><Link to="/login" className="hover:text-[var(--color-text-primary)] transition-colors">Senior ICT</Link></li>
            </ul>
          </div>

          {/* Links Column 2: Platform */}
          <div className="md:col-span-2">
            <h5 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-primary)] font-semibold mb-4">
              Platform
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/hub" className="hover:text-[var(--color-text-primary)] transition-colors">Student Hub</Link></li>
              <li><Link to="/quiz" className="hover:text-[var(--color-text-primary)] transition-colors">Adaptive Quiz Engine</Link></li>
              <li><Link to="/teacher" className="hover:text-[var(--color-text-primary)] transition-colors">Teacher Control Room</Link></li>
              <li><Link to="/settings" className="hover:text-[var(--color-text-primary)] transition-colors">Preferences</Link></li>
            </ul>
          </div>

          {/* Links Column 3: Philosophy */}
          <div className="md:col-span-2">
            <h5 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-primary)] font-semibold mb-4">
              Pedagogy
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#how-it-works" className="hover:text-[var(--color-text-primary)] transition-colors">The 4-Beat Loop</a></li>
              <li><span className="text-xs font-mono text-[var(--color-accent)] block pt-2">Sri Lankan GCE Standards</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
          <span>Engineered with precision for Grades 9–11</span>
        </div>
      </div>
    </footer>
  );
};
