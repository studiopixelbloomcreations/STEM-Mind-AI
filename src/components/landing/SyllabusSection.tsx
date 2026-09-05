import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import {
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  BookOpen,
  Binary,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from '../icons';
import { useNavigate } from 'react-router-dom';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import {
  BASKET_1_OPTIONS,
  BASKET_2_OPTIONS,
  BASKET_3_OPTIONS,
  RELIGION_OPTIONS,
  GRADE_9_AESTHETIC_OPTIONS,
} from '../../lib/curriculum';

export const SyllabusSection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGradeTab, setSelectedGradeTab] = useState<'grade9' | 'ol'>('ol');

  const grade9Compulsory = [
    { name: 'Science', desc: 'Integrated Physics, Chemistry & Biology modules', icon: Atom },
    { name: 'Mathematics', desc: 'Algebra, Geometry, Arithmetic & Sets', icon: Calculator },
    { name: 'English Language', desc: 'Syntax, Comprehension & Technical Vocabulary', icon: BookOpen },
    { name: 'History', desc: 'Chronology, Ancient Irrigation & Heritage', icon: BookOpen },
    { name: 'Religion', desc: 'Ethics, Philosophy (Buddhism, Hinduism, Islam, Christianity)', icon: Sparkles },
    { name: 'First Language', desc: 'Sinhala / Tamil Language and Literature', icon: BookOpen },
    { name: 'Second National Language', desc: 'Conversational & Written Competency', icon: BookOpen },
    { name: 'Geography', desc: 'Physical Topography & Sri Lankan Meteorology', icon: FlaskConical },
    { name: 'Civic Education', desc: 'Constitutional Governance & Rights', icon: CheckCircle2 },
    { name: 'Health & Physical Education', desc: 'Physiology, Nutrition & Sports Science', icon: Dna },
    { name: 'Practical & Technical Skills', desc: 'Mechanisms, Electrical circuits & Woodcraft', icon: Binary },
    { name: 'Information & Comm. Technology', desc: 'Algorithms, Block Logic & System Basics', icon: Binary },
    { name: 'Aesthetic Studies', desc: 'Art, Music (Western/Eastern/Carnatic), Dancing, Literature', icon: Sparkles },
  ];

  const olCore = [
    { name: 'Science (O/L)', units: 'Physics: Mechanics & Waves; Chem: Reactions & Mole; Bio: Genetics', icon: Atom, tag: 'High-Demand' },
    { name: 'Mathematics (O/L)', units: 'Quadratic equations, Trigonometry, Matrices, Statistics & Riders', icon: Calculator, tag: 'High-Demand' },
    { name: 'English Language (O/L)', units: 'Structured essay composition, Reading fluency & Applied grammar', icon: BookOpen, tag: 'Core' },
    { name: 'History of Sri Lanka', units: 'Kingdom periods, Colonial administrative shifts & Modern constitution', icon: BookOpen, tag: 'Core' },
    { name: 'First Language & Literature', units: 'Classical Sinhala / Tamil prose, poetic meters & literary appraisal', icon: BookOpen, tag: 'Core' },
    { name: 'Religious Studies', units: 'Doctrinal ethics & history: Buddhism, Hinduism, Islam, Catholicism/Christianity', icon: Sparkles, tag: 'Core' },
  ];

  return (
    <section id="syllabus" className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)] border-t border-[var(--color-border)] relative">
      <div id="subjects" className="absolute -top-20" />
      <RevealOnScroll className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
              <Icon icon={Sparkles} size={12} className="text-[var(--color-accent)]" />
              <span>National Syllabus Specification</span>
            </div>
            <h2 className="text-[var(--font-size-h1)] font-display font-black text-[var(--color-text-primary)] mb-3 tracking-tight">
              Curriculum depth calibrated to Sri Lankan standards
            </h2>
            <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Every formula, unit definition, and diagram adheres strictly to the official Ministry of Education syllabi for Grades 9, 10, and 11.
            </p>
          </div>

          {/* Grade Level Selector Switch */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] self-start md:self-auto shrink-0">
            <button
              onClick={() => setSelectedGradeTab('ol')}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase font-bold transition-all ${
                selectedGradeTab === 'ol'
                  ? 'bg-[var(--color-bg-surface)] text-[var(--color-accent)] shadow-sm border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Grades 10–11 (O/L)
            </button>
            <button
              onClick={() => setSelectedGradeTab('grade9')}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase font-bold transition-all ${
                selectedGradeTab === 'grade9'
                  ? 'bg-[var(--color-bg-surface)] text-[var(--color-accent)] shadow-sm border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Grade 9 (Junior Secondary)
            </button>
          </div>
        </div>

        {/* Tab 1: Grades 10–11 GCE O/L View */}
        {selectedGradeTab === 'ol' && (
          <div className="space-y-8">
            {/* 6 Compulsory Core Subjects */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--color-text-primary)]">
                  The 6 Core Compulsory Subjects (G.C.E. O/L)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {olCore.map((subj) => (
                  <Card
                    key={subj.name}
                    interactive
                    onClick={() => navigate('/login')}
                    className="p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-xl flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-[var(--color-bg-surface-alt)] text-[var(--color-accent)] border border-[var(--color-border)]">
                          <Icon icon={subj.icon} size={20} />
                        </div>
                        <Badge variant={subj.tag === 'High-Demand' ? 'accent' : 'default'}>
                          {subj.tag}
                        </Badge>
                      </div>
                      <h4 className="text-base font-display font-bold text-[var(--color-text-primary)] mb-1">
                        {subj.name}
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        {subj.units}
                      </p>
                    </div>
                    <div className="pt-3 mt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                      <span>Launch Question Set</span>
                      <Icon icon={ArrowRight} size={13} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* 3 Elective Baskets Preview */}
            <div className="pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--color-text-primary)]">
                  The 3 Elective Baskets (Strictly 1 Selected Per Basket)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Basket 1 */}
                <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase">Basket 1</span>
                    <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">Social &amp; Languages</span>
                  </div>
                  <h5 className="text-sm font-display font-bold text-[var(--color-text-primary)] mb-2">
                    Commercial &amp; Humanities
                  </h5>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {BASKET_1_OPTIONS.slice(0, 7).map((opt) => (
                      <span
                        key={opt}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      >
                        {opt}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[var(--color-accent)]">+ 4 more</span>
                  </div>
                </div>

                {/* Basket 2 */}
                <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-[var(--color-warning)] uppercase">Basket 2</span>
                    <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">Aesthetic Studies</span>
                  </div>
                  <h5 className="text-sm font-display font-bold text-[var(--color-text-primary)] mb-2">
                    Fine Arts &amp; Literature
                  </h5>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {BASKET_2_OPTIONS.slice(0, 7).map((opt) => (
                      <span
                        key={opt}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      >
                        {opt}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[var(--color-accent)]">+ 4 more</span>
                  </div>
                </div>

                {/* Basket 3 */}
                <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-[var(--color-success)] uppercase">Basket 3</span>
                    <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">Technical &amp; Practical</span>
                  </div>
                  <h5 className="text-sm font-display font-bold text-[var(--color-text-primary)] mb-2">
                    Technology &amp; Applied STEM
                  </h5>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {BASKET_3_OPTIONS.slice(0, 7).map((opt) => (
                      <span
                        key={opt}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      >
                        {opt}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[var(--color-accent)]">+ 3 more</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Grade 9 (13 Compulsory Subjects) View */}
        {selectedGradeTab === 'grade9' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
              <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--color-text-primary)]">
                The 13 Compulsory National Subjects (Grade 9 Cohort)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {grade9Compulsory.map((subj, idx) => (
                <div
                  key={subj.name}
                  onClick={() => navigate('/login')}
                  className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[var(--color-bg-surface-alt)] text-[var(--color-accent)] border border-[var(--color-border)]">
                      <Icon icon={subj.icon} size={16} />
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] font-mono text-[var(--color-text-secondary)] block">
                        Subject {idx + 1}
                      </span>
                      <h4 className="text-sm font-display font-bold text-[var(--color-text-primary)] truncate">
                        {subj.name}
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                    {subj.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </RevealOnScroll>
    </section>
  );
};
export default SyllabusSection;
