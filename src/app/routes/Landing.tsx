import React from 'react';
import { HeroSection } from '../../components/landing/HeroSection';
import { HowItWorksSection } from '../../components/landing/HowItWorksSection';
import { SyllabusSection } from '../../components/landing/SyllabusSection';
import { LiveShowcaseSection } from '../../components/landing/LiveShowcaseSection';
import { ForTeachersSection } from '../../components/landing/ForTeachersSection';
import { StudentHubPreviewSection } from '../../components/landing/StudentHubPreviewSection';
import { CouncilMethodologySection } from '../../components/landing/CouncilMethodologySection';
import { FaqSection } from '../../components/landing/FaqSection';
import { FinalCtaSection } from '../../components/landing/FinalCtaSection';
import { Footer } from '../../components/landing/Footer';
import { FloatingHeader } from '../../components/navigation/FloatingHeader';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col pt-16 sm:pt-20">
      {/* Floating Auto-Hiding Liquid Glass Header */}
      <FloatingHeader />

      {/* Landing Sections (Phase 8 Exact 10-Section Architecture) */}
      <main className="flex-1">
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. How It Works */}
        <HowItWorksSection />

        {/* 3. Syllabus */}
        <SyllabusSection />

        {/* 4. Live NexLearn Showcase */}
        <LiveShowcaseSection />

        {/* 5. Educators */}
        <ForTeachersSection />

        {/* 6. Student Hub */}
        <StudentHubPreviewSection />

        {/* 7. Methodology / AI Council */}
        <CouncilMethodologySection />

        {/* 8. FAQ */}
        <FaqSection />

        {/* 9. Final CTA */}
        <FinalCtaSection />
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  );
};
