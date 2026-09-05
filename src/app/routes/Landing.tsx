import React from 'react';
import { HeroSection } from '../../components/landing/HeroSection';
import { HowItWorksSection } from '../../components/landing/HowItWorksSection';
import { SubjectsSection } from '../../components/landing/SubjectsSection';
import { TutorTeaserSection } from '../../components/landing/TutorTeaserSection';
import { ForTeachersSection } from '../../components/landing/ForTeachersSection';
import { FinalCtaSection } from '../../components/landing/FinalCtaSection';
import { Footer } from '../../components/landing/Footer';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0B0D12]/85 border-b border-[var(--color-border)] px-6 lg:px-16 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={() => navigate('/')}
            className="cursor-pointer flex items-center gap-2"
          >
            <span className="text-2xl font-display font-black tracking-tight text-white">
              NexLearn<span className="text-[var(--color-accent-primary)]">.</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-text-secondary)]">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <button onClick={() => navigate('/hub')} className="hover:text-white transition-colors">Learning Hub</button>
            <button onClick={() => navigate('/teacher')} className="hover:text-white transition-colors">Teachers</button>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/teacher')}
              className="hidden sm:inline-flex"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/onboarding')}
            >
              Start Free
            </Button>
          </div>
        </div>
      </header>

      {/* Landing Sections in Exact Sequence (section 2.4) */}
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
