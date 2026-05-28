import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentPortal from './components/StudentPortal';
import QuizView from './components/QuizView';

function RootNavigation() {
  const { user, loading, activeStudent, currentQuiz } = useApp();

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

  // 2. Quiz View Portal (Active adaptive quiz running)
  if (currentQuiz) {
    return <QuizView />;
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
