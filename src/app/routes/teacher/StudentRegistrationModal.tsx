import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Icon } from '../../../components/ui/Icon';
import {
  X,
  UserCheck,
  Sparkles,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from '../../../components/icons';
import {
  CurriculumSubject,
  RELIGION_OPTIONS,
  GRADE_9_AESTHETIC_OPTIONS,
  BASKET_1_OPTIONS,
  BASKET_2_OPTIONS,
  BASKET_3_OPTIONS,
  getDefaultGrade9Subjects,
  getDefaultGrade10or11Subjects,
} from '../../../lib/curriculum';
import { generateStudentAccessToken } from '../../../lib/token';
import { registerNewStudent, StudentRecord } from '../../../lib/api/database';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  onStudentCreated: (student: StudentRecord) => void;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  onStudentCreated,
}) => {
  // Form State
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<9 | 10 | 11>(10);
  const [age, setAge] = useState<number>(15);

  // Curriculum dropdown selections
  const [religion, setReligion] = useState(RELIGION_OPTIONS[0]);
  const [firstLang, setFirstLang] = useState<'Sinhala' | 'Tamil'>('Sinhala');
  const [aestheticG9, setAestheticG9] = useState(GRADE_9_AESTHETIC_OPTIONS[0]);
  const [basket1, setBasket1] = useState(BASKET_1_OPTIONS[0]);
  const [basket2, setBasket2] = useState(BASKET_2_OPTIONS[0]);
  const [basket3, setBasket3] = useState(BASKET_3_OPTIONS[0]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<StudentRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adjust default age on grade change
  useEffect(() => {
    if (grade === 9) setAge(14);
    else if (grade === 10) setAge(15);
    else if (grade === 11) setAge(16);
  }, [grade]);

  if (!isOpen) return null;

  const handleCopyToken = () => {
    if (createdStudent?.access_token) {
      navigator.clipboard.writeText(createdStudent.access_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Build curriculum subjects based on national rules
      let subjects: CurriculumSubject[] = [];
      if (grade === 9) {
        subjects = getDefaultGrade9Subjects(religion, firstLang, aestheticG9);
      } else {
        subjects = getDefaultGrade10or11Subjects(religion, firstLang, basket1, basket2, basket3);
      }

      // 2. Generate deterministic access token
      const token = await generateStudentAccessToken(name, grade);

      // 3. Register student into Supabase database
      const student = await registerNewStudent(
        teacherId,
        name.trim(),
        grade,
        age,
        token,
        subjects
      );

      setCreatedStudent(student);
      onStudentCreated(student);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err?.message || 'Failed to register student. Please check database connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setName('');
    setCreatedStudent(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 relative"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Icon icon={UserCheck} size={20} />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">
                {createdStudent ? 'Student Enrolled Successfully' : 'Register New Student'}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                Sri Lankan National Curriculum Alignment &bull; Deterministic Access Token
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-[var(--color-text-secondary)] hover:text-white p-1 rounded-lg hover:bg-[var(--color-bg-surface-alt)] transition-colors"
          >
            <Icon icon={X} size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {createdStudent ? (
              // ----------------------------------------------------
              // SUCCESS / TOKEN REVEAL SCREEN
              // ----------------------------------------------------
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Icon icon={Sparkles} size={32} />
                </div>

                <div>
                  <h4 className="text-xl font-display font-bold text-white mb-1">
                    {createdStudent.name} is Enrolled!
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Enrolled in <span className="text-indigo-400 font-semibold">Grade {createdStudent.grade}</span> with {createdStudent.subjects.length} Sri Lankan curriculum subjects.
                  </p>
                </div>

                {/* Token Display Card */}
                <div className="bg-[var(--color-bg-base)] border-2 border-indigo-500/50 rounded-2xl p-6 max-w-md mx-auto shadow-inner text-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-secondary)]">
                    Official Student Access Token
                  </span>
                  <div className="my-3 font-mono font-extrabold text-3xl sm:text-4xl text-indigo-400 tracking-wider select-all">
                    {createdStudent.access_token}
                  </div>
                  <p className="text-xs text-slate-400 mb-4 font-sans">
                    Hand this code to your student. They enter this token at <span className="text-white font-mono">/login</span> to immediately enter their personalized learning hub.
                  </p>
                  <Button
                    variant={copied ? 'success' : 'primary'}
                    size="md"
                    className="w-full justify-center gap-2"
                    onClick={handleCopyToken}
                  >
                    <Icon icon={copied ? Check : Copy} size={16} />
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Access Token'}</span>
                  </Button>
                </div>

                {/* Subject Summary Pills */}
                <div className="pt-2 text-left bg-[var(--color-bg-surface-alt)] p-4 rounded-xl border border-[var(--color-border)]">
                  <span className="text-xs font-mono text-[var(--color-text-secondary)] block mb-2 font-semibold">
                    Enrolled Subjects ({createdStudent.subjects.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {createdStudent.subjects.map((sub, idx) => (
                      <Badge key={idx} variant={sub.category === 'compulsory' ? 'indigo' : 'accent'} size="sm">
                        {sub.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button variant="secondary" size="md" onClick={handleResetAndClose}>
                    Return to Student Roster
                  </Button>
                </div>
              </motion.div>
            ) : (
              // ----------------------------------------------------
              // REGISTRATION FORM
              // ----------------------------------------------------
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                    {error}
                  </div>
                )}

                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <Input
                      label="Student Full Name"
                      placeholder="e.g. Kasun Perera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1.5 font-mono">
                      Grade Level
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(Number(e.target.value) as 9 | 10 | 11)}
                      className="w-full bg-[var(--color-bg-base)] text-white border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value={9}>Grade 9 (13 Subjects)</option>
                      <option value={10}>Grade 10 (O/L 6+3)</option>
                      <option value={11}>Grade 11 (O/L 6+3)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1.5 font-mono">
                      Age
                    </label>
                    <input
                      type="number"
                      min={12}
                      max={20}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-[var(--color-bg-base)] text-white border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* National Curriculum Selectors */}
                <div className="border-t border-[var(--color-border)] pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                      <Icon icon={BookOpen} size={14} />
                      <span>Curriculum Subjects ({grade === 9 ? 'Grade 9 Standard' : 'G.C.E. O/L Baskets'})</span>
                    </h4>
                    <span className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                      {grade === 9 ? '13 Compulsory Subjects' : '6 Core + 3 Basket Electives'}
                    </span>
                  </div>

                  {/* Common Language & Religion for All Grades */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                        Religion Subject
                      </label>
                      <select
                        value={religion}
                        onChange={(e) => setReligion(e.target.value)}
                        className="w-full bg-[var(--color-bg-base)] text-white border border-[var(--color-border)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        {RELIGION_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                        First Language
                      </label>
                      <select
                        value={firstLang}
                        onChange={(e) => setFirstLang(e.target.value as 'Sinhala' | 'Tamil')}
                        className="w-full bg-[var(--color-bg-base)] text-white border border-[var(--color-border)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Sinhala">Sinhala Language &amp; Literature</option>
                        <option value="Tamil">Tamil Language &amp; Literature</option>
                      </select>
                    </div>
                  </div>

                  {/* Grade 9 Specific Aesthetic */}
                  {grade === 9 && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                        Aesthetic Subject (Grade 9 Requirement)
                      </label>
                      <select
                        value={aestheticG9}
                        onChange={(e) => setAestheticG9(e.target.value)}
                        className="w-full bg-[var(--color-bg-base)] text-white border border-[var(--color-border)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        {GRADE_9_AESTHETIC_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Grade 10 & 11 Baskets */}
                  {(grade === 10 || grade === 11) && (
                    <div className="space-y-3 pt-2 bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border)]">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-white">
                            Basket 1: Social Sciences &amp; Languages
                          </label>
                          <Badge variant="indigo" size="sm">Elective 1</Badge>
                        </div>
                        <select
                          value={basket1}
                          onChange={(e) => setBasket1(e.target.value)}
                          className="w-full bg-[var(--color-bg-surface)] text-white border border-[var(--color-border)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          {BASKET_1_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-white">
                            Basket 2: Aesthetic Studies &amp; Literature
                          </label>
                          <Badge variant="indigo" size="sm">Elective 2</Badge>
                        </div>
                        <select
                          value={basket2}
                          onChange={(e) => setBasket2(e.target.value)}
                          className="w-full bg-[var(--color-bg-surface)] text-white border border-[var(--color-border)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          {BASKET_2_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-white">
                            Basket 3: Technical &amp; Practical Studies
                          </label>
                          <Badge variant="indigo" size="sm">Elective 3</Badge>
                        </div>
                        <select
                          value={basket3}
                          onChange={(e) => setBasket3(e.target.value)}
                          className="w-full bg-[var(--color-bg-surface)] text-white border border-[var(--color-border)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          {BASKET_3_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="ghost" size="md" onClick={handleResetAndClose} type="button">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    className="shadow-lg shadow-indigo-500/20"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating Token...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Enroll &amp; Issue Token</span>
                        <Icon icon={ArrowRight} size={16} />
                      </span>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
