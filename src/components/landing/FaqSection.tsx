import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { HelpCircle, ChevronRight, KeyRound, ShieldCheck, BookOpen, Brain, Users } from '../icons';
import { RevealOnScroll } from '../ui/RevealOnScroll';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: any;
}

const FAQS: FaqItem[] = [
  {
    id: 'tokens',
    question: 'How do students log in without email addresses or passwords?',
    answer:
      'Students log in using a unique 8-character Access Token (for example, TG100024) issued directly by their school or teacher. No personal email account, phone number, or password is required. This eliminates password-reset friction in the classroom and keeps student identity strictly private.',
    category: 'Authentication & Access',
    icon: KeyRound,
  },
  {
    id: 'curriculum',
    question: 'How strictly does NexLearn follow the Sri Lankan National Curriculum?',
    answer:
      'NexLearn is purpose-built for the Sri Lankan syllabus issued by the National Institute of Education (NIE). For Grade 9, it covers all 13 compulsory subjects (including practical skills, religion, languages, and aesthetic electives). For Grades 10 and 11, it strictly supports the 6 core G.C.E. O/L subjects plus 1 chosen elective from each of the 3 official subject baskets.',
    category: 'Curriculum & Syllabi',
    icon: BookOpen,
  },
  {
    id: 'hesitation',
    question: 'How does Nex know when a student is hesitating or stuck on a question?',
    answer:
      'Our client-side telemetry engine continuously monitors problem dwell time and rapid option-switching acceleration during quizzes. When a student spends prolonged time on a step or oscillates between options, Nex unobtrusively steps in with a gentle nudge, offering a progressive hint or a whiteboard breakdown before frustration sets in.',
    category: 'Pedagogy & AI Engine',
    icon: Brain,
  },
  {
    id: 'teachers',
    question: 'How do teachers monitor classroom progress?',
    answer:
      'Educators sign in with their Google account to access the institutional Teacher Control Room. From there, teachers can generate deterministic student tokens, monitor syllabus mastery in real time, and view aggregate hesitation heatmaps to identify which specific topics require classroom revision before term exams.',
    category: 'Educator Tools',
    icon: Users,
  },
  {
    id: 'hardware',
    question: 'What devices are supported and how does Live NexLearn work?',
    answer:
      'NexLearn runs in any modern browser on laptops, tablets, or smartphones without installing any apps. The Live NexLearn mode utilizes WebSockets and AudioWorklets to enable natural spoken dialogue, with optional webcam and screen-sharing so students can point their camera at handwritten derivations or diagrams.',
    category: 'Technical Requirements',
    icon: ShieldCheck,
  },
];

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('tokens');

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section
      id="faq"
      className="w-full py-24 px-6 lg:px-16 bg-[var(--color-bg-base)] border-t border-[var(--color-border)] relative"
    >
      <RevealOnScroll className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-bg-surface-alt)] text-xs font-mono font-bold tracking-wider uppercase text-[var(--color-text-secondary)] border border-[var(--color-border)] mb-4">
            Answers & Clarity
          </span>
          <h2 className="text-[var(--font-size-h1)] font-display font-extrabold text-[var(--color-text-primary)] mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)] leading-relaxed">
            Direct, factual answers about how NexLearn operates, student security, and national syllabus alignment.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            const ItemIcon = faq.icon;
            return (
              <div
                key={faq.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[var(--color-bg-surface)] border-[var(--color-accent)] shadow-sm'
                    : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`p-2 rounded-lg border shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-accent)] text-[var(--color-accent)]'
                          : 'bg-[var(--color-bg-surface-alt)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      <Icon icon={ItemIcon} size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-[var(--color-text-secondary)] block mb-0.5">
                        {faq.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-display font-bold text-[var(--color-text-primary)]">
                        {faq.question}
                      </h3>
                    </div>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center shrink-0 text-[var(--color-text-secondary)] transition-transform duration-200 ${
                      isOpen ? 'rotate-90 text-[var(--color-accent)] border-[var(--color-accent)]' : ''
                    }`}
                  >
                    <Icon icon={ChevronRight} size={14} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-0 border-t border-[var(--color-border)] mt-1">
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-body pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </RevealOnScroll>
    </section>
  );
};
