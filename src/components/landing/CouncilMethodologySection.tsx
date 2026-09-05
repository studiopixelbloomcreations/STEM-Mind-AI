import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import {
  Brain,
  Sparkles,
  BookOpen,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Award,
  ArrowRight,
  ShieldCheck,
} from '../icons';
import { RevealOnScroll } from '../ui/RevealOnScroll';

interface CouncilAgent {
  role: string;
  name: string;
  codename: string;
  icon: any;
  purpose: string;
  howItWorks: string;
  outputSignature: string;
}

const COUNCIL_AGENTS: CouncilAgent[] = [
  {
    role: 'Syllabus Boundary Control',
    name: 'Curriculum Advisor',
    codename: 'agent:curriculum',
    icon: BookOpen,
    purpose: 'Guarantees questions stay strictly within National Institute of Education (NIE) Sri Lanka guidelines.',
    howItWorks: 'Evaluates each topic against the Grade 9–11 national scope. Rejects out-of-syllabus tangents, foreign curricula terminology, or non-examinable trivia.',
    outputSignature: 'Validated subject unit & topic scope',
  },
  {
    role: 'Assessment Authoring',
    name: 'Teacher Agent',
    codename: 'agent:teacher',
    icon: Brain,
    purpose: 'Drafts high-discrimination STEM questions with plausible misconception distractors.',
    howItWorks: 'Synthesizes real G.C.E. O/L exam patterns into multi-step problems, generating 3 deliberate wrong answers that reflect specific cognitive slips.',
    outputSignature: '4-option question + tiered hint structure',
  },
  {
    role: 'Cognitive Calibration',
    name: 'Difficulty Modulator',
    codename: 'agent:difficulty',
    icon: TrendingUp,
    purpose: 'Dynamically shifts challenge up or down based on student speed and hesitation telemetry.',
    howItWorks: 'Monitors answer latency and option-switching acceleration. If hesitation is detected, scales scaffolding up before frustration causes drop-off.',
    outputSignature: 'Real-time difficulty delta (+/- 0.15)',
  },
  {
    role: 'Misconception Repair',
    name: 'Step Explainer',
    codename: 'agent:stepExplainer',
    icon: Sparkles,
    purpose: 'Breaks incorrect answers into conversational, single-concept repair steps.',
    howItWorks: 'Never simply reveals the correct answer. Identifies the exact step where calculation or reasoning derailed, and prompts the student to resolve it.',
    outputSignature: 'Deconstructed 3-step derivation',
  },
  {
    role: 'Examiner Strategy',
    name: 'Exam Coach',
    codename: 'agent:examCoach',
    icon: Award,
    purpose: 'Highlights marking scheme rubrics and classic O/L trapdoor errors.',
    howItWorks: 'Flags units where students routinely forfeit marks (e.g. omitting SI units, misidentifying independent variables, sign errors in quadratics).',
    outputSignature: 'Examiner caution note & mark allocation',
  },
  {
    role: 'Cohort Intelligence',
    name: 'Learning Analyst',
    codename: 'agent:analytics',
    icon: BarChart3,
    purpose: 'Transforms session telemetry into honest mastery maps for the student and teacher.',
    howItWorks: 'Aggregates topic attempts into genuine syllabus coverage percentages, pinpointing systemic hesitation zones across whole classrooms.',
    outputSignature: 'Telemetry vector to teacher control room',
  },
];

export const CouncilMethodologySection: React.FC = () => {
  return (
    <section
      id="methodology"
      className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)] border-t border-[var(--color-border)] relative"
    >
      <RevealOnScroll className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-bg-surface-alt)] text-xs font-mono font-bold tracking-wider uppercase text-[var(--color-text-secondary)] border border-[var(--color-border)] mb-4">
            Under the Hood
          </span>
          <h2 className="text-[var(--font-size-h1)] font-display font-extrabold text-[var(--color-text-primary)] mb-4 tracking-tight">
            Not a generic chatbot. A council of 6 specialized agents.
          </h2>
          <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)] leading-relaxed">
            Single-prompt AI systems hallucinate answers, drift out of syllabus, and spoil questions with premature hints. NexLearn uses an orchestrated Gemini Council where every agent has a single, verifiable responsibility.
          </p>
        </div>

        {/* 6-Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {COUNCIL_AGENTS.map((agent) => {
            const AgentIcon = agent.icon;
            return (
              <div
                key={agent.codename}
                className="p-6 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Meta Bar */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-accent)]">
                      <Icon icon={AgentIcon} size={20} />
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--color-bg-base)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                      {agent.codename}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                    {agent.role}
                  </span>
                  <h3 className="text-lg font-display font-bold text-[var(--color-text-primary)] mb-2">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4 font-body">
                    {agent.purpose}
                  </p>
                  <p className="text-xs text-[var(--color-text-primary)] font-medium leading-relaxed mb-4">
                    {agent.howItWorks}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--color-border)] mt-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-secondary)]">
                    <span>Artifact:</span>
                    <span className="text-[var(--color-accent)] font-semibold truncate ml-2">
                      {agent.outputSignature}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architectural Guarantee Card */}
        <div className="rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-success)] shrink-0">
              <Icon icon={ShieldCheck} size={24} />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-[var(--color-text-primary)] mb-1">
                Zero Fallback Compromise
              </h4>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed font-body">
                Powered natively by Google&apos;s latest high-speed Gemini model infrastructure with sub-second response times. No canned static mock questions or generic answer keys.
              </p>
            </div>
          </div>
          <div className="font-mono text-xs px-3 py-1.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] shrink-0">
            Runtime Engine: Gemini 3.6 Flash
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
};
