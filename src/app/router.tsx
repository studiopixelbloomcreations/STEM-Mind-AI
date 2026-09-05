import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TeacherAuthProvider } from '../lib/context/TeacherAuthContext';
import { Landing } from './routes/Landing';
import { Onboarding } from './routes/Onboarding';
import { LearningHub } from './routes/LearningHub';
import { Quiz } from './routes/Quiz';
import { Results } from './routes/Results';
import { TeacherWelcome } from './routes/teacher/TeacherWelcome';
import { TeacherDashboard } from './routes/TeacherDashboard';
import { TeacherGuard } from './routes/teacher/TeacherGuard';
import { StudentLogin } from './routes/StudentLogin';
import { Settings } from './routes/Settings';

// Code-split Phase 9 dedicated screens to keep initial bundle lean (Section 6)
const SessionSetup = React.lazy(() =>
  import('./routes/SessionSetup').then((m) => ({ default: m.SessionSetup }))
);
const SessionLoading = React.lazy(() =>
  import('./routes/SessionLoading').then((m) => ({ default: m.SessionLoading }))
);
const DedicatedTeachingScreen = React.lazy(() =>
  import('./routes/DedicatedTeachingScreen').then((m) => ({ default: m.DedicatedTeachingScreen }))
);
const DedicatedCorrectionScreen = React.lazy(() =>
  import('./routes/DedicatedCorrectionScreen').then((m) => ({ default: m.DedicatedCorrectionScreen }))
);

import { ToastProvider } from '../components/ui/Toast';
import { ThemeProvider } from '../lib/context/ThemeContext';
import { EasterEggsManager } from '../components/easter/EasterEggsManager';

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen w-full bg-[var(--color-bg-base)] flex items-center justify-center">
    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] animate-pulse">
      <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
      <span>Loading NexLearn Experience...</span>
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <ThemeProvider>
      <TeacherAuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <EasterEggsManager />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<StudentLogin />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/hub" element={<LearningHub />} />

                {/* Phase 9 Learning Session Lifecycle Routes */}
                <Route path="/session/setup" element={<SessionSetup />} />
                <Route path="/session/loading" element={<SessionLoading />} />
                <Route path="/session/teach" element={<DedicatedTeachingScreen />} />
                <Route path="/session/correct" element={<DedicatedCorrectionScreen />} />

                <Route path="/quiz" element={<Quiz />} />
                <Route path="/results" element={<Results />} />

                {/* Teacher Portal Routes */}
                <Route path="/teacher" element={<TeacherWelcome />} />
                <Route element={<TeacherGuard />}>
                  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                </Route>

                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </TeacherAuthProvider>
    </ThemeProvider>
  );
};
