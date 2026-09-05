import React from 'react';
import { HeroSection } from '../../components/landing/HeroSection';
import { HowItWorksSection } from '../../components/landing/HowItWorksSection';
import { SubjectsSection } from '../../components/landing/SubjectsSection';
import { TutorTeaserSection } from '../../components/landing/TutorTeaserSection';
import { ForTeachersSection } from '../../components/landing/ForTeachersSection';
import { FinalCtaSection } from '../../components/landing/FinalCtaSection';
import { Footer } from '../../components/landing/Footer';
import { FloatingHeader } from '../../components/navigation/FloatingHeader';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col pt-16 sm:pt-20">
      {/* Floating Auto-Hiding Liquid Glass Header */}
      <FloatingHeader />


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
