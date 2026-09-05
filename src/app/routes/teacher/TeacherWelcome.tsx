import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTeacherAuth } from '../../../lib/context/TeacherAuthContext';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Icon } from '../../../components/ui/Icon';
import {
  ShieldCheck,
  Users,
  BarChart3,
  KeyRound,
  ArrowRight,
  LogOut,
  Sparkles,
  Layers,
} from 'lucide-react';

export const TeacherWelcome: React.FC = () => {
  const navigate = useNavigate();
  const { teacher, profile, loading, signIn, signOut } = useTeacherAuth();

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-[var(--color-border)] relative z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-primary)] flex items-center justify-center font-display font-bold text-white shadow-lg shadow-indigo-500/20">
            N
          </div>
          <div>
            <span className="font-display font-bold text-lg text-white tracking-tight">NexLearn</span>
            <span className="text-xs text-[var(--color-text-secondary)] font-mono ml-2">Teacher Control Room</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Back to Home
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
            Student Login
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto px-6 py-16 flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent-primary)] mb-6 shadow-sm">
            <Icon icon={ShieldCheck} size={14} />
            <span>Strict Educator Gateway &bull; National Syllabus Verification</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight mb-4">
            Command Center for <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Adaptive STEM</span> Education
          </h1>

          <p className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8">
            Manage your Grade 9–11 student cohorts, issue curriculum-accurate access tokens, and analyze real-time cognitive hesitation hotspots across Sri Lankan national exam syllabi.
          </p>

          {/* Action Center / Sign-in */}
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-12 max-w-md mx-auto">
            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-[var(--color-text-secondary)]">Authenticating educator session...</span>
              </div>
            ) : teacher ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
                  {teacher.photoURL ? (
                    <img
                      src={teacher.photoURL}
                      alt={teacher.displayName || 'Teacher'}
                      className="w-12 h-12 rounded-full border border-[var(--color-border)]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[var(--color-accent-primary)] text-white font-bold flex items-center justify-center">
                      {(teacher.displayName || teacher.email || 'T')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{profile?.name || teacher.displayName || 'Educator'}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] font-mono truncate">{teacher.email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-lg shadow-indigo-500/25"
                    onClick={() => navigate('/teacher/dashboard')}
                  >
                    <span>Launch Control Room</span>
                    <Icon icon={ArrowRight} size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs text-red-400 hover:text-red-300"
                    onClick={signOut}
                  >
                    <Icon icon={LogOut} size={14} />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-mono text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Educator Single Sign-On
                </p>
                <button
                  type="button"
                  onClick={signIn}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-medium text-sm transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
                <p className="text-[11px] text-[var(--color-text-secondary)] font-mono leading-tight">
                  Teachers only. Students must use their issued Access Token at the Student Portal.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-indigo-500/50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Icon icon={KeyRound} size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5">Deterministic Access Tokens</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Generate student credentials in format <code className="text-indigo-300 font-mono">TG100001</code> with one click. Eliminates password resets.
            </p>
          </Card>

          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-indigo-500/50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Icon icon={Layers} size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5">Sri Lankan Curriculum Enforced</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Full national syllabus conformance: 13 subjects for Grade 9, 6 core + 3 basket electives for O/L Grade 10 &amp; 11.
            </p>
          </Card>

          <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-indigo-500/50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Icon icon={BarChart3} size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5">Hesitation Telemetry</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Detect students struggling with specific formulas before exam day. View topic mastery, streaks, and quiz records.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};
