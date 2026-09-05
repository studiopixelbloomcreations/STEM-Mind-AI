import React from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Users, BarChart3, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ForTeachersSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full py-24 px-6 lg:px-16 bg-[#FAFAF7] text-[#0B0D12]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Control-Room Value Proposition */}
          <div className="lg:col-span-5 text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-[#E5E5DC] text-xs font-mono font-bold tracking-wider uppercase text-[#525D78] mb-4">
              Institutional Telemetry
            </span>
            <h2 className="text-[var(--font-size-h1)] font-display font-extrabold text-[#0B0D12] mb-6 leading-tight">
              Classroom insight without grading marathons
            </h2>
            <p className="text-base text-[#4D5464] leading-relaxed mb-6 font-body">
              NexLearn provisions teacher accounts to monitor entire classes in real time. Track individual topic frontiers, detect syllabus-wide hesitation trends, and export diagnostic mastery reports in seconds.
            </p>

            <ul className="space-y-3 mb-8 text-sm font-medium text-[#2C313E]">
              <li className="flex items-center gap-2.5">
                <Icon icon={CheckCircle2} size={18} className="text-[#32be8f]" />
                <span>Zero homework piles — instant objective diagnostics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon icon={CheckCircle2} size={18} className="text-[#32be8f]" />
                <span>Classroom hesitation heatmaps pinpointing confusing syllabus areas</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon icon={CheckCircle2} size={18} className="text-[#32be8f]" />
                <span>Single-click student login provisioning without email friction</span>
              </li>
            </ul>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/teacher')}
              className="bg-[#0B0D12] text-white hover:bg-[#232836] shadow-none"
            >
              <span>Open Teacher Control Room</span>
              <Icon icon={ArrowRight} size={16} />
            </Button>
          </div>

          {/* Right Column: High-Density Control Room Mockup Preview */}
          <div className="lg:col-span-7">
            <div className="rounded-xl bg-[#FFFFFF] border border-[#E2E2D8] shadow-xl p-6 overflow-hidden">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EBEBE2] mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#0B0D12] text-white flex items-center justify-center font-bold text-xs">
                    NL
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0B0D12]">Grade 10 — Physics Batch A</h4>
                    <span className="text-[11px] font-mono text-[#7A8294]">34 Active Students &bull; Unit 4 Mechanics</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EBF9F3] text-[#1FA674] text-xs font-mono font-semibold">
                  Live Sync
                </span>
              </div>

              {/* Mockup Metric Cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 rounded-lg bg-[#F7F7F2] border border-[#EBEBE2]">
                  <span className="text-[11px] font-mono text-[#7A8294] block mb-1">Mean Mastery</span>
                  <span className="text-xl font-display font-bold text-[#0B0D12]">84.2%</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#F7F7F2] border border-[#EBEBE2]">
                  <span className="text-[11px] font-mono text-[#7A8294] block mb-1">Stuck Interventions</span>
                  <span className="text-xl font-display font-bold text-[#FF6B4A]">12</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#F7F7F2] border border-[#EBEBE2]">
                  <span className="text-[11px] font-mono text-[#7A8294] block mb-1">Target Accuracy</span>
                  <span className="text-xl font-display font-bold text-[#32be8f]">91%</span>
                </div>
              </div>

              {/* Mockup Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-[#7A8294] border-b border-[#EBEBE2]">
                      <th className="pb-2 font-medium">STUDENT</th>
                      <th className="pb-2 font-medium">RECENT TOPIC</th>
                      <th className="pb-2 font-medium">MASTERY</th>
                      <th className="pb-2 font-medium">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F2EC] text-[#2C313E]">
                    <tr>
                      <td className="py-2.5 font-sans font-medium">Kavindu S.</td>
                      <td className="py-2.5">Kinematics v²=u²+2as</td>
                      <td className="py-2.5 text-[#32be8f] font-bold">92%</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-[#EBF9F3] text-[#1FA674] text-[10px]">Mastered</span></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium">Tharushi F.</td>
                      <td className="py-2.5">Ohm&apos;s Law Series</td>
                      <td className="py-2.5 text-[#FFC15E] font-bold">68%</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-[#FFF7E8] text-[#C2820C] text-[10px]">In Progress</span></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium">Dulitha P.</td>
                      <td className="py-2.5">Mole Calculations</td>
                      <td className="py-2.5 text-[#32be8f] font-bold">88%</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-[#EBF9F3] text-[#1FA674] text-[10px]">Mastered</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
