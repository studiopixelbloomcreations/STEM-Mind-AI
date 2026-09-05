import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-t border-[var(--color-border)] py-16 px-6 lg:px-16 font-body">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <span className="text-3xl font-display font-extrabold text-[var(--color-text-primary)] tracking-tight block mb-3">
              NexLearn<span className="text-[var(--color-accent)]">.</span>
            </span>
            <p className="text-sm max-w-sm leading-relaxed mb-6">
              The operating system for personal AI STEM education. Built with quiet confidence for Grades 9–11 students and educators.
            </p>
            <div className="text-xs font-mono text-[var(--color-text-tertiary)]">
              &copy; {new Date().getFullYear()} NexLearn Technologies. All rights reserved.
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
