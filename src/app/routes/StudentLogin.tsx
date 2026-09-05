import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
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
} from 'lucide-react';

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
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-primary)] flex items-center justify-center font-display font-bold text-white shadow-lg shadow-indigo-500/25">
            N
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">NexLearn</span>
        </div>

        <div className="flex items-center gap-3">
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
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Icon icon={KeyRound} size={28} />
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
              Student Access
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Enter the unique Access Token assigned by your teacher.
            </p>
          </div>

          <Card className="p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl backdrop-blur-xl">
            {successStudent ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <Icon icon={CheckCircle2} size={28} />
                </div>
                <h3 className="text-lg font-display font-bold text-white">Welcome back, {successStudent}!</h3>
                <p className="text-xs font-mono text-[var(--color-text-secondary)]">
                  Loading your personalized Sri Lankan curriculum syllabus...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
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
                      className="w-full bg-[var(--color-bg-base)] text-white text-center font-mono font-bold text-xl tracking-widest border border-[var(--color-border)] focus:border-indigo-500 rounded-xl py-3.5 px-4 outline-none placeholder:text-slate-600 transition-colors uppercase"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] font-mono mt-2 text-center">
                    Format: Initial + Grade + 4 digits (e.g. <span className="text-indigo-400">KG100001</span>)
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={loading || !token.trim()}
                  className="w-full justify-center shadow-lg shadow-indigo-500/25"
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
              Don't have a token? Ask your school STEM teacher to enroll you in their cohort.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
