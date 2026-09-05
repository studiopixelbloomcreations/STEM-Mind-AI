import React from 'react';
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

import { ToastProvider } from '../components/ui/Toast';

export const AppRouter: React.FC = () => {
  return (
    <TeacherAuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<StudentLogin />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/hub" element={<LearningHub />} />
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
        </BrowserRouter>
      </ToastProvider>
    </TeacherAuthProvider>
  );
};

