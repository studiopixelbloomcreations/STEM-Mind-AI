import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Calculator, Atom, FlaskConical, Dna, Compass, Binary, ArrowRight, Sparkles } from '../icons';
import { useNavigate } from 'react-router-dom';

export const SubjectsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="subjects" className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)] border-t border-[var(--color-border)] relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
              <Icon icon={Sparkles} size={12} className="text-[var(--color-accent)]" />
              <span>National Syllabus Breadth</span>
            </div>
            <h2 className="text-[var(--font-size-h1)] font-display font-black text-[var(--color-text-primary)] mb-3 tracking-tight">
              Engineered for Sri Lankan STEM syllabi
            </h2>
            <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Every formula, unit definition, and diagram calibrated to the official Grade 9–11 specifications.
            </p>
          </div>
        </div>

        {/* Asymmetric Bento-Grid Layout (Section 2) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Large Hero Feature Tile (Spans 8 cols) */}
          <div
            onClick={() => navigate('/login')}
            className="md:col-span-8 cursor-pointer group"
          >
            <Card
              interactive
              className="h-full p-8 flex flex-col justify-between bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-xl relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-lg bg-[var(--color-bg-surface-alt)] text-[var(--color-accent)] border border-[var(--color-border)]">
                    <Icon icon={Atom} size={26} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--color-text-tertiary)]">24 Modules</span>
                    <Badge variant="accent">Flagship Syllabus</Badge>
                  </div>
                </div>

                <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-accent)] block mb-1 font-semibold">
                  Grades 9–11 &bull; Core Science
                </span>
                <h3 className="text-3xl font-display font-black text-[var(--color-text-primary)] mb-3 tracking-tight">
                  Physics: Mechanics, Kinematics &amp; Energy Dynamics
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xl mb-6">
                  From velocity-time vectors to Newton's second law and optical wave refractions. NexLearn tracks individual step derivations, diagnosing mathematical misconceptions before they turn into chronic exam errors.
                </p>

                {/* Inline technical preview */}
                <div className="p-4 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] font-mono text-xs text-[var(--color-text-secondary)] space-y-1.5">
                  <div className="flex justify-between text-[11px] text-[var(--color-text-tertiary)] uppercase pb-1 border-b border-[var(--color-border)]">
                    <span>Target Concept</span>
                    <span>Adaptive Calibration</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-[var(--color-text-primary)]">v² = u² + 2as Uniform Acceleration</span>
                    <span className="text-[var(--color-accent)] font-semibold">96.4% Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-primary)]">Kirchhoff's Current Law Node Proofs</span>
                    <span className="text-[var(--color-text-tertiary)]">Calibrated</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-primary)]">
                <span className="group-hover:text-[var(--color-accent)] transition-colors">Enter Physics Laboratory</span>
                <Icon icon={ArrowRight} size={15} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>

          {/* Supporting Tile 1: Mathematics (Spans 4 cols) */}
          <div
            onClick={() => navigate('/login')}
            className="md:col-span-4 cursor-pointer group"
          >
            <Card
              interactive
              className="h-full p-8 flex flex-col justify-between bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-xl relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-lg bg-[var(--color-bg-surface-alt)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] border border-[var(--color-border)] transition-colors">
                    <Icon icon={Calculator} size={24} />
                  </div>
                  <Badge variant="default">Compulsory</Badge>
                </div>

                <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-1 font-semibold">
                  Grades 9–11 &bull; 32 Units
                </span>
                <h3 className="text-2xl font-display font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">
                  Mathematics
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                  Algebraic factorizations, quadratic roots, logarithms, cyclic quadrilateral theorems, and planar geometry proofs.
                </p>

                <div className="p-3 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] font-mono text-xs">
                  <span className="text-[11px] text-[var(--color-text-tertiary)] block mb-1">Diagnostic Frontier</span>
                  <span className="text-[var(--color-text-primary)] font-bold text-lg">ax² + bx + c = 0</span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-primary)]">
                <span className="group-hover:text-[var(--color-accent)] transition-colors">Inspect Curriculum</span>
                <Icon icon={ArrowRight} size={15} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>

          {/* Supporting Tile 2: Chemistry (Spans 4 cols) */}
          <div
            onClick={() => navigate('/login')}
            className="md:col-span-4 cursor-pointer group"
          >
            <Card
              interactive
              className="h-full p-6 flex flex-col justify-between bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface-alt)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] border border-[var(--color-border)] transition-colors">
                    <Icon icon={FlaskConical} size={20} />
                  </div>
                  <span className="text-xs font-mono text-[var(--color-text-tertiary)]">18 Units</span>
                </div>
                <h4 className="text-lg font-display font-bold text-[var(--color-text-primary)] mb-1">Chemistry</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Atomic structure, mole stoichiometry, ionic configurations, and acid-base titrations.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                <span>View Units</span>
                <Icon icon={ArrowRight} size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>

          {/* Supporting Tile 3: Biology (Spans 4 cols) */}
          <div
            onClick={() => navigate('/login')}
            className="md:col-span-4 cursor-pointer group"
          >
            <Card
              interactive
              className="h-full p-6 flex flex-col justify-between bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface-alt)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] border border-[var(--color-border)] transition-colors">
                    <Icon icon={Dna} size={20} />
                  </div>
                  <span className="text-xs font-mono text-[var(--color-text-tertiary)]">20 Units</span>
                </div>
                <h4 className="text-lg font-display font-bold text-[var(--color-text-primary)] mb-1">Biology</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Cell division, genetic inheritance, circulatory pathways, and photosynthetic light reactions.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                <span>View Units</span>
                <Icon icon={ArrowRight} size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>

          {/* Supporting Tile 4: ICT & Technology (Spans 4 cols) */}
          <div
            onClick={() => navigate('/login')}
            className="md:col-span-4 cursor-pointer group"
          >
            <Card
              interactive
              className="h-full p-6 flex flex-col justify-between bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface-alt)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] border border-[var(--color-border)] transition-colors">
                    <Icon icon={Binary} size={20} />
                  </div>
                  <span className="text-xs font-mono text-[var(--color-text-tertiary)]">16 Units</span>
                </div>
                <h4 className="text-lg font-display font-bold text-[var(--color-text-primary)] mb-1">ICT &amp; Algorithms</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Boolean logic gates, flowchart sequencing, pseudocode structures, and database keys.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                <span>View Units</span>
                <Icon icon={ArrowRight} size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
export default SubjectsSection;

