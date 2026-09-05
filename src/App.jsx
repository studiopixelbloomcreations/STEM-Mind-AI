import React, { Suspense, lazy, useEffect, useState } from 'react';
import './design/tokens.css';
import './design/base.css';
import './design/components.css';
import { AppProvider, useApp } from './context/AppContext';
import { setAuthTokenProvider } from './council/orchestrator';
import { Splash } from './components/ui/index.jsx';

/* ==========================================================================
   App root — hash routing (#/ landing · #/app application), auth gate,
   lazy-loaded views. No router library: the shell owns a tiny route state
   driven by hashchange, so the 3D/council code never blocks first paint.
   ========================================================================== */

const LandingPage = lazy(() => import('./marketing/LandingPage.jsx'));
const LoginGate = lazy(() => import('./components/LoginGate.jsx'));
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard.jsx'));
const StudentHub = lazy(() => import('./components/student/StudentHub.jsx'));
const QuizView = lazy(() => import('./components/student/QuizView.jsx'));
const LiveTutorMode = lazy(() => import('./components/student/LiveTutorMode.jsx'));

const readRoute = () => (window.location.hash === '#app' ? 'app' : 'landing');

function Shell() {
  const { user, loading, activeStudent, currentQuiz, liveModeActive } = useApp();
  const [route, setRoute] = useState(readRoute);

  /* Route state — hashchange only; both routes stay history-clean. */
  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /* Firebase token provider — every council proxy call carries a live JWT. */
  useEffect(() => {
    setAuthTokenProvider(() => user?.getIdToken?.());
  }, [user]);

  if (loading) return <Splash label="Resolving session" />;

  if (route === 'landing') {
    return (
      <Suspense fallback={<Splash label="Loading landing" />}>
        <LandingPage />
      </Suspense>
    );
  }

  /* #app — auth first, then the app's priority chain (contract §7). */
  if (!user) {
    return (
      <Suspense fallback={<Splash label="Opening sign-in" />}>
        <LoginGate />
      </Suspense>
    );
  }

  let view;
  if (currentQuiz) view = <QuizView />;
  else if (liveModeActive) view = <LiveTutorMode />;
  else if (activeStudent) view = <StudentHub />;
  else view = <TeacherDashboard />;

  return <Suspense fallback={<Splash label="Loading workspace" />}>{view}</Suspense>;
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
