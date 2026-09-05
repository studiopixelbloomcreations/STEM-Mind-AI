import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ThemeToggle } from '../ui/ThemeToggle';
import { KeyRound, ShieldCheck, Menu, X } from '../icons';

interface NavItem {
  label: string;
  href?: string;
  action: () => void;
}

export const FloatingHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // minimum scroll distance before triggering hide/show

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine condensed state (past 50px)
      setIsScrolled(currentScrollY > 50);

      // Top of page: always visible and relaxed
      if (currentScrollY <= 20) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      // On sustained scroll down: hide
      if (diff > scrollThreshold && currentScrollY > 80) {
        setIsVisible(false);
        setMobileMenuOpen(false);
      }
      // On ANY scroll up: immediately show
      else if (diff < -scrollThreshold) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/#' + id);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems: NavItem[] = [
    {
      label: 'How It Works',
      action: () => scrollToSection('how-it-works'),
    },
    {
      label: 'Syllabus',
      action: () => scrollToSection('syllabus'),
    },
    {
      label: 'Live Nex',
      action: () => scrollToSection('live-showcase'),
    },
    {
      label: 'Educators',
      action: () => {
        if (location.pathname === '/') {
          scrollToSection('educators');
        } else {
          setMobileMenuOpen(false);
          navigate('/teacher');
        }
      },
    },
    {
      label: 'Student Hub',
      action: () => {
        if (location.pathname === '/') {
          scrollToSection('student-hub');
        } else {
          setMobileMenuOpen(false);
          navigate('/hub');
        }
      },
    },
  ];

  return (
    <header className="fixed top-3 sm:top-4 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none">
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{
          y: isVisible ? 0 : -80,
          opacity: isVisible ? 1 : 0,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0.05 }
            : {
                duration: 0.24,
                ease: [0.65, 0, 0.35, 1], // Precise easing token
              }
        }
        className={`pointer-events-auto w-full max-w-5xl liquid-glass specular-highlight rounded-full transition-all duration-200 ${
          isScrolled
            ? 'py-2 px-4 sm:px-6 shadow-2xl'
            : 'py-2.5 sm:py-3 px-5 sm:px-8 shadow-xl'
        }`}
        style={{
          borderRadius: '9999px',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Brand Mark */}
          <div
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/');
            }}
            className="cursor-pointer flex items-center gap-2.5 select-none group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center font-display font-bold text-white shadow-sm transition-transform duration-180 group-hover:scale-105">
              N
            </div>
            <span className="text-lg sm:text-xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
              NexLearn<span className="text-[var(--color-accent)]">.</span>
            </span>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative py-1 cursor-pointer select-none"
                onMouseEnter={() => setHoveredNav(item.label)}
                onMouseLeave={() => setHoveredNav(null)}
                onClick={item.action}
              >
                <span
                  className={`transition-colors duration-140 ${
                    hoveredNav === item.label
                      ? 'text-[var(--color-text-primary)]'
                      : 'hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {item.label}
                </span>
                {hoveredNav === item.label && (
                  <motion.div
                    layoutId="floating-nav-underline"
                    className="absolute left-0 right-0 -bottom-1 h-0.5 bg-[var(--color-accent)] rounded-full"
                    transition={{ duration: 0.16, ease: [0.65, 0, 0.35, 1] }}
                  />
                )}
              </div>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex gap-1.5 text-xs font-mono h-8 px-3"
            >
              <Icon icon={KeyRound} size={13} className="text-[var(--color-accent)]" />
              <span>Token</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/teacher')}
              className="hidden lg:inline-flex gap-1.5 text-xs h-8 px-3"
            >
              <Icon icon={ShieldCheck} size={13} className="text-[var(--color-text-secondary)]" />
              <span>Teacher</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/login')}
              className="h-8 px-3.5 text-xs font-medium"
            >
              Get Started
            </Button>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-alt)] transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Icon icon={mobileMenuOpen ? X : Menu} size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
              className="md:hidden overflow-hidden pt-3 border-t border-[var(--color-border)]"
            >
              <div className="flex flex-col gap-2 pb-2">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-alt)] transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="pt-2 flex flex-col gap-2 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2"
                  >
                    <Icon icon={KeyRound} size={14} className="text-[var(--color-accent)]" />
                    Student Token Login
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/teacher');
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2"
                  >
                    <Icon icon={ShieldCheck} size={14} />
                    Teacher Portal
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
};
