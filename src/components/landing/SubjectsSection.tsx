import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Calculator, Atom, FlaskConical, Dna, Compass, Binary, ArrowRight } from '../icons';
import { useNavigate } from 'react-router-dom';

interface SubjectItem {
  id: string;
  name: string;
  gradeSpan: string;
  topicsCount: number;
  description: string;
  icon: any;
  featured?: boolean;
}

export const SubjectsSection: React.FC = () => {
  const navigate = useNavigate();

  const subjects: SubjectItem[] = [
    {
      id: 'physics',
      name: 'Physics',
      gradeSpan: 'Grades 9–11',
      topicsCount: 24,
      description: 'Mechanics, kinematics, optical wave phenomena, and current electricity calibrated to Sri Lankan national exams.',
      icon: Atom,
      featured: true,
    },
    {
      id: 'mathematics',
      name: 'Mathematics',
      gradeSpan: 'Grades 9–11',
      topicsCount: 32,
      description: 'Algebraic factorizations, quadratic roots, logarithms, trigonometry, and planar geometry proofs.',
      icon: Calculator,
      featured: true,
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      gradeSpan: 'Grades 10–11',
      topicsCount: 18,
      description: 'Atomic structure, mole calculations, redox reactions, and acid-base indicators.',
      icon: FlaskConical,
    },
    {
      id: 'biology',
      name: 'Biology',
      gradeSpan: 'Grades 9–11',
      topicsCount: 20,
      description: 'Cell division, genetics, human physiology, and circulatory thermodynamics.',
      icon: Dna,
    },
    {
      id: 'combined-maths',
      name: 'Combined Maths',
      gradeSpan: 'Senior Foundation',
      topicsCount: 28,
      description: 'Calculus derivatives, projectile vectors, complex indices, and mathematical induction.',
      icon: Compass,
    },
    {
      id: 'ict',
      name: 'ICT',
      gradeSpan: 'Grades 10–11',
      topicsCount: 16,
      description: 'Boolean logic gates, flowcharts, algorithmic sequencing, and relational data architecture.',
      icon: Binary,
    },
  ];

  return (
    <section id="subjects" className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)] relative overflow-hidden">
      {/* Background ambient noise */}
      <div className="absolute inset-0 bg-noise pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <Badge variant="indigo" className="mb-3">National Syllabus Breadth</Badge>
            <h2 className="text-[var(--font-size-h1)] font-display font-bold text-[var(--color-text-primary)] mb-2">
              Curated for Sri Lankan STEM
            </h2>
            <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)]">
              Modular, asymmetric syllabus coverage mapped directly to local Grade 9–11 specifications.
            </p>
          </div>
        </div>

        {/* Asymmetric Bento-Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Featured Bento 1: Physics (Spans 7 cols) */}
          <div
            onClick={() => navigate('/onboarding')}
            className="md:col-span-7 cursor-pointer group"
          >
            <Card
              interactive
              className="h-full p-8 flex flex-col justify-between bg-[var(--color-bg-surface)] border border-[var(--color-border)] group-hover:border-[var(--color-accent-primary)] transition-all duration-300 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent-primary)]/5 rounded-full blur-3xl pointer-events-none group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3.5 rounded-xl bg-[var(--color-bg-surface-alt)] text-[var(--color-accent-primary)] border border-[var(--color-border)]">
                    <Icon icon={Atom} size={28} />
                  </div>
                  <Badge variant="accent">Core Curriculum</Badge>
                </div>
                <h3 className="text-2xl font-display font-bold text-[var(--color-text-primary)] mb-2">
                  {subjects[0].name}
                </h3>
                <span className="text-xs font-mono text-[var(--color-accent-primary)] mb-4 block font-bold">
                  {subjects[0].gradeSpan} &bull; {subjects[0].topicsCount} Modules
                </span>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
                  {subjects[0].description}
                </p>
              </div>

              <div className="pt-6 mt-8 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-primary)]">
                <span className="group-hover:text-[var(--color-accent-primary)] transition-colors">Explore Physics Syllabus</span>
                <Icon icon={ArrowRight} size={16} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Card>
          </div>

          {/* Featured Bento 2: Mathematics (Spans 5 cols) */}
          <div
            onClick={() => navigate('/onboarding')}
            className="md:col-span-5 cursor-pointer group"
          >
            <Card
              interactive
              className="h-full p-8 flex flex-col justify-between bg-[var(--color-bg-surface)] border border-[var(--color-border)] group-hover:border-[var(--color-accent-secondary)] transition-all duration-300 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-accent-secondary)]/5 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3.5 rounded-xl bg-[var(--color-bg-surface-alt)] text-[var(--color-accent-secondary)] border border-[var(--color-border)]">
                    <Icon icon={Calculator} size={28} />
                  </div>
                  <Badge variant="indigo">High Weightage</Badge>
                </div>
                <h3 className="text-2xl font-display font-bold text-[var(--color-text-primary)] mb-2">
                  {subjects[1].name}
                </h3>
                <span className="text-xs font-mono text-[var(--color-accent-secondary)] mb-4 block font-bold">
                  {subjects[1].gradeSpan} &bull; {subjects[1].topicsCount} Modules
                </span>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {subjects[1].description}
                </p>
              </div>

              <div className="pt-6 mt-8 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-primary)]">
                <span className="group-hover:text-[var(--color-accent-secondary)] transition-colors">Explore Math Units</span>
                <Icon icon={ArrowRight} size={16} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Card>
          </div>

          {/* Supporting Bento Row: 4 Modular Cards (Col spans 3 each) */}
          {subjects.slice(2).map((subj) => (
            <div
              key={subj.id}
              onClick={() => navigate('/onboarding')}
              className="md:col-span-3 cursor-pointer group"
            >
              <Card
                interactive
                className="h-full p-6 flex flex-col justify-between bg-[var(--color-bg-surface)] border border-[var(--color-border)] group-hover:border-[var(--color-text-secondary)] transition-all duration-300 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
                      <Icon icon={subj.icon} size={20} />
                    </div>
                    <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
                      {subj.topicsCount} Mod
                    </span>
                  </div>

                  <h4 className="text-lg font-display font-bold text-[var(--color-text-primary)] mb-1">
                    {subj.name}
                  </h4>
                  <span className="text-[11px] font-mono text-[var(--color-accent-secondary)] mb-2.5 block">
                    {subj.gradeSpan}
                  </span>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                    {subj.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                  <span>View Topics</span>
                  <Icon icon={ArrowRight} size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
