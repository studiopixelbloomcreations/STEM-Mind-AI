import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentPortal from './components/StudentPortal';
import QuizView from './components/QuizView';
import STEMLiveMode from './components/STEMLiveMode';

function RootNavigation() {
  const { user, loading, activeStudent, currentQuiz, liveModeActive } = useApp();
  const [desktopOnly, setDesktopOnly] = useState(() => window.innerWidth >= 1100);

  useEffect(() => {
    const onResize = () => setDesktopOnly(window.innerWidth >= 1100);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} className="glow-pulse"></div>
        <h2 style={{ marginTop: '24px', fontFamily: 'var(--font-heading)' }}>
          STEMMind AI Loading...
        </h2>
      </div>
    );
  }

  // 1. Authenticate Teacher (Google Auth setup)
  if (!user) {
    return <Login />;
  }

  if (!desktopOnly) {
    return (
      <div style={styles.loadingScreen}>
        <h2 style={{ marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>Desktop Required</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', textAlign: 'center' }}>
          STEM Mind AI now supports desktop layouts only. Please expand your browser window or switch to a desktop/laptop display.
        </p>
      </div>
    );
  }

  // 2. Quiz View Portal (Active adaptive quiz running)
  if (currentQuiz) {
    return <QuizView />;
  }

  if (liveModeActive) {
    return <STEMLiveMode />;
  }

  // 3. Student Selection Portal (A student profile has been launched)
  if (activeStudent) {
    return <StudentPortal />;
  }

  // 4. Fallback default: Teacher Dashboard
  return <TeacherDashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <RootNavigation />
    </AppProvider>
  );
}

const styles = {
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid rgba(139, 92, 246, 0.2)',
    borderTopColor: '#8b5cf6',
    borderRadius: '50%',
  }
};
