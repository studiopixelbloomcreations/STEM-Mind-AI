import React, { useRef } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Calculator, Atom, FlaskConical, Dna, Compass, Binary, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubjectItem {
  id: string;
  name: string;
  gradeSpan: string;
  topicsCount: number;
  description: string;
  icon: any;
  accentGlow: string;
}

export const SubjectsSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const subjects: SubjectItem[] = [
    {
      id: 'physics',
      name: 'Physics',
      gradeSpan: 'Grades 9–11',
      topicsCount: 24,
      description: 'Mechanics, electricity, light waves, and thermal physics aligned to national exams.',
      icon: Atom,
      accentGlow: 'hover:shadow-[0_0_30px_rgba(255,107,74,0.3)] hover:border-[#FF6B4A]',
    },
    {
      id: 'mathematics',
      name: 'Mathematics',
      gradeSpan: 'Grades 9–11',
      topicsCount: 32,
      description: 'Algebra, geometry, quadratic equations, matrices, and logarithms.',
      icon: Calculator,
      accentGlow: 'hover:shadow-[0_0_30px_rgba(91,124,250,0.3)] hover:border-[#5B7CFA]',
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      gradeSpan: 'Grades 10–11',
      topicsCount: 18,
      description: 'Atomic structure, mole calculations, acids & bases, and periodic trends.',
      icon: FlaskConical,
      accentGlow: 'hover:shadow-[0_0_30px_rgba(61,217,164,0.3)] hover:border-[#3DD9A4]',
    },
    {
      id: 'biology',
      name: 'Biology',
      gradeSpan: 'Grades 9–11',
      topicsCount: 20,
      description: 'Cell biology, human organ systems, genetics, and ecology.',
      icon: Dna,
      accentGlow: 'hover:shadow-[0_0_30px_rgba(255,193,94,0.3)] hover:border-[#FFC15E]',
    },
    {
      id: 'combined-maths',
      name: 'Combined Maths',
      gradeSpan: 'Senior Foundation',
      topicsCount: 28,
      description: 'Calculus fundamentals, trigonometry, vectors, and algebraic proofs.',
      icon: Compass,
      accentGlow: 'hover:shadow-[0_0_30px_rgba(91,124,250,0.3)] hover:border-[#5B7CFA]',
    },
    {
      id: 'ict',
      name: 'ICT',
      gradeSpan: 'Grades 10–11',
      topicsCount: 16,
      description: 'Logic gates, algorithm design, Python basics, and networking essentials.',
      icon: Binary,
      accentGlow: 'hover:shadow-[0_0_30px_rgba(255,107,74,0.3)] hover:border-[#FF6B4A]',
    },
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <Badge variant="indigo" className="mb-3">Syllabus Breadth</Badge>
            <h2 className="text-[var(--font-size-h1)] font-display font-bold text-white mb-2">
              Curated for Sri Lankan STEM
            </h2>
            <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)]">
              Scroll horizontally to explore subjects mapped directly to local Grade 9–11 specifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              className="p-3 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-white hover:bg-[var(--color-bg-surface-alt)] transition-colors"
              aria-label="Scroll left"
            >
              <Icon icon={ChevronLeft} size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-3 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-white hover:bg-[var(--color-bg-surface-alt)] transition-colors"
              aria-label="Scroll right"
            >
              <Icon icon={ChevronRight} size={20} />
            </button>
          </div>
        </div>

        {/* Scroll-snapping horizontal row */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-6 scroll-smooth snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {subjects.map((subj) => (
            <div
              key={subj.id}
              onClick={() => navigate('/onboarding')}
              className="min-w-[300px] md:min-w-[340px] snap-start cursor-pointer"
            >
              <Card
                interactive
                className={`h-full flex flex-col justify-between p-6 transition-all duration-300 ${subj.accentGlow}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 rounded-md bg-[#1C202B] text-white">
                      <Icon icon={subj.icon} size={24} />
                    </div>
                    <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                      {subj.topicsCount} Modules
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-bold text-white mb-1">
                    {subj.name}
                  </h3>
                  <span className="text-xs font-mono text-[var(--color-accent-primary)] mb-3 block">
                    {subj.gradeSpan}
                  </span>

                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {subj.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-white">
                  <span>Explore Syllabus</span>
                  <span>&rarr;</span>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
