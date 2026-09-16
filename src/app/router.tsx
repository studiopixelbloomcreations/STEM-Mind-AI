import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TeacherAuthProvider } from '../lib/context/TeacherAuthContext';
import { TeacherGuard } from './routes/teacher/TeacherGuard';

const Landing = React.lazy(() => import('./routes/Landing').then((m) => ({ default: m.Landing })));
const StudentLogin = React.lazy(() => import('./routes/StudentLogin').then((m) => ({ default: m.StudentLogin })));
const Onboarding = React.lazy(() => import('./routes/Onboarding').then((m) => ({ default: m.Onboarding })));
const LearningHub = React.lazy(() => import('./routes/LearningHub').then((m) => ({ default: m.LearningHub })));
const Quiz = React.lazy(() => import('./routes/Quiz').then((m) => ({ default: m.Quiz })));
const Results = React.lazy(() => import('./routes/Results').then((m) => ({ default: m.Results })));
const TeacherWelcome = React.lazy(() => import('./routes/teacher/TeacherWelcome').then((m) => ({ default: m.TeacherWelcome })));
const TeacherDashboard = React.lazy(() => import('./routes/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard })));
const Settings = React.lazy(() => import('./routes/Settings').then((m) => ({ default: m.Settings })));

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

const NotFound = React.lazy(() => import('./routes/NotFound').then((m) => ({ default: m.NotFound })));

import { ToastProvider } from '../components/ui/Toast';
import { ThemeProvider } from '../lib/context/ThemeContext';
import { EasterEggsManager } from '../components/easter/EasterEggsManager';
import { CommandPalette } from '../components/ui/CommandPalette';
import { CustomCursor } from '../components/ui/CustomCursor';
import { OfflineBanner } from '../components/ui/OfflineBanner';

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
            <CustomCursor />
            <OfflineBanner />
            <CommandPalette />
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
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </TeacherAuthProvider>
    </ThemeProvider>
  );
};
