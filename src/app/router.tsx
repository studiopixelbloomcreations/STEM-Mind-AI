import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './routes/Landing';
import { Onboarding } from './routes/Onboarding';
import { LearningHub } from './routes/LearningHub';
import { Quiz } from './routes/Quiz';
import { Results } from './routes/Results';
import { TeacherDashboard } from './routes/TeacherDashboard';
import { Settings } from './routes/Settings';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/hub" element={<LearningHub />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
