import React, { useState } from 'react';
import { HeroSection } from '../../components/landing/HeroSection';
import { HowItWorksSection } from '../../components/landing/HowItWorksSection';
import { SubjectsSection } from '../../components/landing/SubjectsSection';
import { TutorTeaserSection } from '../../components/landing/TutorTeaserSection';
import { ForTeachersSection } from '../../components/landing/ForTeachersSection';
import { FinalCtaSection } from '../../components/landing/FinalCtaSection';
import { Footer } from '../../components/landing/Footer';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, ShieldCheck } from '../../components/icons';
import { Icon } from '../../components/ui/Icon';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const navItems = [
    { label: 'How It Works', href: '#how-it-works', action: () => {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    }},
    { label: 'Syllabus', href: '#subjects', action: () => {
      document.getElementById('subjects')?.scrollIntoView({ behavior: 'smooth' });
    }},
    { label: 'Educators', href: '#teachers', action: () => {
      navigate('/teacher');
    }},
    { label: 'Student Hub', href: '#hub', action: () => {
      navigate('/hub');
    }},
  ];

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0B0D12]/85 border-b border-[var(--color-border)] px-6 lg:px-16 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={() => navigate('/')}
            className="cursor-pointer flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-primary)] flex items-center justify-center font-display font-bold text-white shadow-md shadow-indigo-500/20">
              N
            </div>
            <span className="text-2xl font-display font-black tracking-tight text-white">
              NexLearn<span className="text-[var(--color-accent-primary)]">.</span>
            </span>
          </div>

          {/* Nav with Animated Underline */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-text-secondary)]">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative py-1 cursor-pointer"
                onMouseEnter={() => setHoveredNav(item.label)}
                onMouseLeave={() => setHoveredNav(null)}
                onClick={item.action}
              >
                <span className={`transition-colors ${hoveredNav === item.label ? 'text-white' : ''}`}>
                  {item.label}
                </span>
                {hoveredNav === item.label && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute left-0 right-0 -bottom-1 h-0.5 bg-[var(--color-accent-primary)] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="gap-1.5"
            >
              <Icon icon={KeyRound} size={14} className="text-indigo-400" />
              <span>Student Token</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/teacher')}
              className="hidden sm:inline-flex gap-1.5"
            >
              <Icon icon={ShieldCheck} size={14} className="text-indigo-400" />
              <span>Teacher Portal</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/onboarding')}
              className="shadow-sm shadow-indigo-500/20"
            >
              Start Free
            </Button>
          </div>
        </div>
      </header>

      {/* Landing Sections */}
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <SubjectsSection />
        <TutorTeaserSection />
        <ForTeachersSection />
        <FinalCtaSection />
      </main>

      <Footer />
    </div>
  );
};
