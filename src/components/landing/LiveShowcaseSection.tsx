import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import {
  Mic,
  Video,
  ScreenShare,
  Radio,
  Sparkles,
  Play,
  Volume2,
  CheckCircle2,
} from '../icons';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import { LiveNexLearnModal } from '../live/LiveNexLearnModal';

export const LiveShowcaseSection: React.FC = () => {
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  return (
    <section id="live-showcase" className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)] border-t border-[var(--color-border)] relative overflow-hidden">
      <RevealOnScroll className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value proposition */}
          <div className="lg:col-span-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent)] mb-4">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]"></span>
              </span>
              <span>Sub-Second Multimodal Tutoring</span>
            </div>

            <h2 className="text-[var(--font-size-h1)] font-display font-extrabold text-[var(--color-text-primary)] mb-6 tracking-tight leading-tight">
              Talk, share your screen, and solve problems out loud
            </h2>

            <p className="text-[var(--font-size-body-lg)] text-[var(--color-text-secondary)] mb-8 leading-relaxed font-body">
              Nex isn&apos;t a delayed text box. Launch a live spoken session, aim your webcam at handwritten homework, or share a difficult past paper. Nex listens, watches your pencil strokes, and talks you through misconceptions in real time.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-accent)] shrink-0">
                  <Icon icon={Mic} size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Low-Latency Spoken Dialogue
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                    Natural conversational rhythm without rigid turn buttons. Interrupt Nex anytime you have a follow-up question.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-accent)] shrink-0">
                  <Icon icon={Video} size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Real-Time Desk Vision
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                    Computer vision analyzes freehand geometry proofs, circuit sketches, and mathematical steps as you write.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-accent)] shrink-0">
                  <Icon icon={ScreenShare} size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Direct Screen Tutoring
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                    Share a digital past paper, simulation, or textbook PDF to get guided line-by-line breakdown.
                  </p>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              variant="primary"
              onClick={() => setIsLiveOpen(true)}
              className="gap-2.5 px-6"
            >
              <Icon icon={Radio} size={18} />
              <span>Launch Live NexLearn Demo</span>
            </Button>
          </div>

          {/* Right Column: Live Interface Mockup Stage */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg rounded-2xl liquid-glass specular-highlight p-6 border border-[var(--color-border)] shadow-2xl relative overflow-hidden">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] text-white font-bold flex items-center justify-center text-xs">
                    N
                  </div>
                  <div>
                    <span className="text-xs font-display font-bold text-[var(--color-text-primary)] block">
                      Live NexLearn Session
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-success)] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                      Listening to Student
                    </span>
                  </div>
                </div>

                <Badge variant="accent">WebRTC + Vision</Badge>
              </div>

              {/* Central Orb & Waveform Simulation */}
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center mb-6 relative">
                  <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-[var(--color-accent)]/20" />
                  <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-display font-black text-lg shadow-lg">
                    NEX
                  </div>
                </div>

                {/* Simulated Audio Waveform */}
                <div className="flex items-center gap-1.5 h-10 px-6 py-2 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] mb-4">
                  {[30, 65, 45, 85, 95, 60, 40, 75, 50, 90, 70, 45, 60, 35].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1.5 rounded-full bg-[var(--color-accent)] opacity-80"
                    />
                  ))}
                </div>

                <p className="text-xs font-mono text-[var(--color-text-secondary)] max-w-xs">
                  &ldquo;Notice how in the second step, dividing both sides by x eliminated the zero root? Let&apos;s factor out 2x instead.&rdquo;
                </p>
              </div>

              {/* Floating Dock Preview */}
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center shadow-sm">
                  <Icon icon={Mic} size={18} />
                </div>
                <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center justify-center">
                  <Icon icon={Video} size={18} />
                </div>
                <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center justify-center">
                  <Icon icon={ScreenShare} size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* Live Modal Trigger */}
      <LiveNexLearnModal
        isOpen={isLiveOpen}
        onClose={() => setIsLiveOpen(false)}
        subject="Physics"
        grade={10}
      />
    </section>
  );
};
export default LiveShowcaseSection;
