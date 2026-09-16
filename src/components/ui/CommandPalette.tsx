import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  Brain,
  Users,
  Settings as SettingsIcon,
  SunMoon,
  ArrowRight,
  Search,
  Zap,
} from '../icons';
import { useTheme } from '../../lib/context/ThemeContext';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Preferences';
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toggleTheme, theme } = useTheme();

  // Listen for Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: 'session-setup',
      title: 'Start AI Learning Session',
      category: 'Navigation',
      shortcut: 'S',
      icon: <Zap className="w-4 h-4 text-[var(--color-accent)]" />,
      action: () => {
        navigate('/session/setup');
        setIsOpen(false);
      },
    },
    {
      id: 'hub',
      title: 'Learning Hub & Syllabus',
      category: 'Navigation',
      shortcut: 'H',
      icon: <Brain className="w-4 h-4 text-[var(--color-text-secondary)]" />,
      action: () => {
        navigate('/hub');
        setIsOpen(false);
      },
    },
    {
      id: 'teacher-portal',
      title: 'Teacher Portal & Roster Analytics',
      category: 'Navigation',
      shortcut: 'T',
      icon: <Users className="w-4 h-4 text-[var(--color-text-secondary)]" />,
      action: () => {
        navigate('/teacher');
        setIsOpen(false);
      },
    },
    {
      id: 'quiz',
      title: 'Quick Diagnostic Assessment',
      category: 'Navigation',
      shortcut: 'Q',
      icon: <BookOpen className="w-4 h-4 text-[var(--color-text-secondary)]" />,
      action: () => {
        navigate('/quiz');
        setIsOpen(false);
      },
    },
    {
      id: 'onboarding',
      title: 'Student Diagnostic Onboarding',
      category: 'Navigation',
      icon: <Sparkles className="w-4 h-4 text-[var(--color-text-secondary)]" />,
      action: () => {
        navigate('/onboarding');
        setIsOpen(false);
      },
    },
    {
      id: 'theme-toggle',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      shortcut: 'M',
      icon: <SunMoon className="w-4 h-4 text-[var(--color-text-primary)]" />,
      action: () => {
        toggleTheme();
        setIsOpen(false);
      },
    },
    {
      id: 'settings',
      title: 'System & Audio Settings',
      category: 'Preferences',
      icon: <SettingsIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />,
      action: () => {
        navigate('/settings');
        setIsOpen(false);
      },
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          {/* Liquid Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Liquid Glass Palette Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-neutral-900/85 backdrop-blur-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10"
          >
            {/* Search Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or jump to screen..."
                className="w-full bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
              />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-neutral-400">
                ESC
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No commands matching "{query}"
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/15'
                          : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-neutral-800/80 border border-white/10">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-neutral-200">{item.title}</p>
                          <p className="text-[10px] text-neutral-500">{item.category}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.shortcut && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-neutral-400">
                            {item.shortcut}
                          </span>
                        )}
                        <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0.5 text-white' : 'text-neutral-600'}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-black/30 text-[11px] text-neutral-500 font-mono">
              <div className="flex items-center gap-3">
                <span>↑↓ to navigate</span>
                <span>↵ to select</span>
              </div>
              <span>NexLearn ⌘K</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
