import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { authenticateStudentByToken } from '../../lib/api/database';
import { normalizeToken } from '../../lib/token';
import {
  KeyRound,
  ArrowRight,
  Sparkles,
  AlertCircle,
  GraduationCap,
  CheckCircle2,
  Layers,
} from '../../components/icons';

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successStudent, setSuccessStudent] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = normalizeToken(token);
    if (!cleanToken) return;

    setLoading(true);
    setError(null);

    try {
      const student = await authenticateStudentByToken(cleanToken);
      if (!student) {
        setError('Token not recognized. Please check your spelling or contact your teacher for your active access token.');
        return;
      }

      // Save student session locally
      localStorage.setItem('nexlearn_student_session', JSON.stringify(student));
      setSuccessStudent(student.name);

      setTimeout(() => {
        navigate('/hub');
      }, 900);
    } catch (err: any) {
      console.error('Student login error:', err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between relative z-10 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center font-display font-bold text-white shadow-sm">
            N
          </div>
          <span className="font-display font-bold text-lg text-[var(--color-text-primary)] tracking-tight">NexLearn</span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Back
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/teacher')}>
            Teacher Portal
          </Button>
        </div>
      </header>

      {/* Main Card */}
      <main className="max-w-md w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-surface-alt)] text-[var(--color-accent)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Icon icon={KeyRound} size={24} />
            </div>
            <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] tracking-tight mb-2">
              Student Access
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Enter the unique Access Token assigned by your teacher.
            </p>
          </div>

          <Card className="p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
            {successStudent ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-success)] flex items-center justify-center mx-auto">
                  <Icon icon={CheckCircle2} size={28} />
                </div>
                <h3 className="text-lg font-display font-bold text-[var(--color-text-primary)]">Welcome back, {successStudent}!</h3>
                <p className="text-xs font-mono text-[var(--color-text-secondary)]">
                  Loading your personalized Sri Lankan curriculum syllabus...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3.5 rounded-lg bg-[var(--color-bg-surface-alt)] border border-[var(--color-danger)] text-[var(--color-danger)] text-xs flex items-start gap-2.5">
                    <Icon icon={AlertCircle} size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-2 font-mono tracking-wider">
                    Student Access Token
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. TG100001"
                      value={token}
                      onChange={(e) => setToken(e.target.value.toUpperCase())}
                      className="w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] text-center font-mono font-bold text-xl tracking-widest border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-lg py-3.5 px-4 outline-none placeholder:text-[var(--color-text-tertiary)] transition-colors uppercase"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] font-mono mt-2 text-center">
                    Format: Initial + Grade + 4 digits (e.g. <span className="text-[var(--color-accent)]">KG100001</span>)
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={loading || !token.trim()}
                  className="w-full justify-center"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Token...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Enter Learning Hub</span>
                      <Icon icon={ArrowRight} size={18} />
                    </span>
                  )}
                </Button>
              </form>
            )}
          </Card>

          <div className="text-center mt-6">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Don&apos;t have a token? Ask your school STEM teacher to enroll you in their cohort.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
