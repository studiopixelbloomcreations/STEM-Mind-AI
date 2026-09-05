import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ArrowRight, CheckCircle2 } from '../icons';
import { useNavigate } from 'react-router-dom';
import { RevealOnScroll } from '../ui/RevealOnScroll';

export const ForTeachersSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)] text-[var(--color-text-primary)] border-t border-[var(--color-border)]">
      <RevealOnScroll className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Control-Room Value Proposition */}
          <div className="lg:col-span-5 text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-bg-surface-alt)] text-xs font-mono font-bold tracking-wider uppercase text-[var(--color-text-secondary)] border border-[var(--color-border)] mb-4">
              Institutional Telemetry
            </span>
            <h2 className="text-[var(--font-size-h1)] font-display font-extrabold text-[var(--color-text-primary)] mb-6 leading-tight">
              Classroom insight without grading marathons
            </h2>
            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed mb-6 font-body">
              NexLearn provisions teacher accounts to monitor entire classes in real time. Track individual topic frontiers, detect syllabus-wide hesitation trends, and export diagnostic mastery reports in seconds.
            </p>

            <ul className="space-y-3 mb-8 text-sm font-medium text-[var(--color-text-primary)]">
              <li className="flex items-center gap-2.5">
                <Icon icon={CheckCircle2} size={18} className="text-[var(--color-success)]" />
                <span>Zero homework piles — instant objective diagnostics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon icon={CheckCircle2} size={18} className="text-[var(--color-success)]" />
                <span>Classroom hesitation heatmaps pinpointing confusing syllabus areas</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon icon={CheckCircle2} size={18} className="text-[var(--color-success)]" />
                <span>Single-click student login provisioning without email friction</span>
              </li>
            </ul>

            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/teacher')}
              className="gap-2"
            >
              <span>Open Teacher Control Room</span>
              <Icon icon={ArrowRight} size={16} />
            </Button>
          </div>

          {/* Right Column: High-Density Control Room Mockup Preview */}
          <div className="lg:col-span-7">
            <div className="rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm p-6 overflow-hidden">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center justify-center font-bold text-xs">
                    NL
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Grade 10 — Physics Batch A</h4>
                    <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">34 Active Students &bull; Unit 4 Mechanics</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-success)] text-xs font-mono font-semibold">
                  Live Sync
                </span>
              </div>

              {/* Mockup Metric Cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)]">
                  <span className="text-[11px] font-mono text-[var(--color-text-secondary)] block mb-1">Mean Mastery</span>
                  <span className="text-xl font-display font-bold text-[var(--color-text-primary)]">84.2%</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)]">
                  <span className="text-[11px] font-mono text-[var(--color-text-secondary)] block mb-1">Stuck Interventions</span>
                  <span className="text-xl font-display font-bold text-[var(--color-accent)]">12</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)]">
                  <span className="text-[11px] font-mono text-[var(--color-text-secondary)] block mb-1">Target Accuracy</span>
                  <span className="text-xl font-display font-bold text-[var(--color-success)]">91%</span>
                </div>
              </div>

              {/* Mockup Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                      <th className="pb-2 font-medium">STUDENT</th>
                      <th className="pb-2 font-medium">RECENT TOPIC</th>
                      <th className="pb-2 font-medium">MASTERY</th>
                      <th className="pb-2 font-medium">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-secondary)]">
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-[var(--color-text-primary)]">Kavindu S.</td>
                      <td className="py-2.5">Kinematics v²=u²+2as</td>
                      <td className="py-2.5 text-[var(--color-success)] font-bold">92%</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-success)] text-[10px]">Mastered</span></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-[var(--color-text-primary)]">Tharushi F.</td>
                      <td className="py-2.5">Ohm&apos;s Law Series</td>
                      <td className="py-2.5 text-[var(--color-warning)] font-bold">68%</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-warning)] text-[10px]">In Progress</span></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-[var(--color-text-primary)]">Dulitha P.</td>
                      <td className="py-2.5">Mole Calculations</td>
                      <td className="py-2.5 text-[var(--color-success)] font-bold">88%</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-success)] text-[10px]">Mastered</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
};
