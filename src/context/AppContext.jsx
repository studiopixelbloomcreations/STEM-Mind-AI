import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, loginWithGoogle, logoutUser } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../config/supabase';
import { runAnalyticsAgent } from '../harmony/harmonyEngine';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Active Firebase Auth teacher
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [activeSubject, setActiveSubject] = useState('');
  const [activeTopic, setActiveTopic] = useState('');
  const [activeGrade, setActiveGrade] = useState(10);
  const [activeDifficulty, setActiveDifficulty] = useState('medium');
  const [themeSetting, setThemeSetting] = useState(() => localStorage.getItem('theme-setting') || 'system');
  const [resolvedTheme, setResolvedTheme] = useState('dark');

  // Track system theme preferences and theme updates
  useEffect(() => {
    const handleSystemThemeChange = (e) => {
      if (themeSetting === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Resolve theme initial state
    if (themeSetting === 'system') {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(themeSetting);
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [themeSetting]);

  // Apply theme class to HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  }, [resolvedTheme]);

  const handleThemeChange = (newSetting) => {
    setThemeSetting(newSetting);
    localStorage.setItem('theme-setting', newSetting);
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Ensure teacher is registered in Supabase
        await syncTeacherRecord(firebaseUser);
        // Fetch student profiles for teacher
        await fetchStudents(firebaseUser.uid);
      } else {
        setUser(null);
        setStudents([]);
        setActiveStudent(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync teacher details to Supabase database
  const syncTeacherRecord = async (firebaseUser) => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .upsert({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          created_at: new Date()
        }, { onConflict: 'id' });
        
      if (error) throw error;
    } catch (err) {
      console.error('Failed to sync teacher record to Supabase:', err);
    }
  };

  // Fetch student listings
  const fetchStudents = async (teacherId) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  // Create student profile under teacher
  const registerStudent = async (name, grade, age, subjects) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          teacher_id: user.uid,
          name,
          grade: parseInt(grade),
          age: parseInt(age),
          subjects
        })
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        setStudents(prev => [...prev, data[0]]);
        return data[0];
      }
    } catch (err) {
      console.error('Failed to register student:', err);
      throw err;
    }
  };

  // Record completed quiz results and update student mastery / analytics
  const recordQuizResult = async (studentId, subject, topic, difficulty, questions, score, timeSpent) => {
    try {
      // 1. Save quiz records
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          student_id: studentId,
          subject,
          topic,
          difficulty,
          questions,
          score,
          time_spent: timeSpent,
          completed_at: new Date()
        })
        .select();

      if (quizError) throw quizError;

      // 2. Fetch past quizzes for analytics
      const { data: allQuizzes, error: fetchError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('student_id', studentId);

      if (fetchError) throw fetchError;

      // 3. Process analytics using Harmony Analytics AI
      const analyticsPayload = allQuizzes.map(q => ({
        topic: q.topic,
        subject: q.subject,
        score: q.score,
        difficulty: q.difficulty
      }));

      const analysis = await runAnalyticsAgent(analyticsPayload);

      // 4. Update or Insert analytics in Supabase
      const { error: analyticsError } = await supabase
        .from('analytics')
        .upsert({
          student_id: studentId,
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || [],
          topic_mastery: calculateTopicMastery(allQuizzes),
          last_updated: new Date()
        }, { onConflict: 'student_id' });

      if (analyticsError) throw analyticsError;

      // Reload students to update values
      if (user) {
        await fetchStudents(user.uid);
      }
    } catch (err) {
      console.error('Failed to record quiz results and analytics:', err);
    }
  };

  // Helper calculation for topic mastery
  const calculateTopicMastery = (quizzes) => {
    const mastery = {};
    quizzes.forEach(q => {
      if (!mastery[q.topic]) {
        mastery[q.topic] = { totalScore: 0, count: 0 };
      }
      mastery[q.topic].totalScore += q.score;
      mastery[q.topic].count += 1;
    });

    const results = {};
    Object.keys(mastery).forEach(topic => {
      const avg = Math.round(mastery[topic].totalScore / mastery[topic].count);
      results[topic] = avg >= 80 ? 'Master' : avg >= 50 ? 'Proficient' : 'Beginning';
    });
    return results;
  };

  // Fetch student performance history details
  const getStudentHistoryAndAnalytics = async (studentId) => {
    try {
      const { data: quizzes, error: qError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false });

      if (qError) throw qError;

      const { data: analytics, error: aError } = await supabase
        .from('analytics')
        .select('*')
        .eq('student_id', studentId)
        .single();

      // Ignore single row errors if no record exists yet
      return {
        quizzes: quizzes || [],
        analytics: analytics || { strengths: [], weaknesses: [], topic_mastery: {} }
      };
    } catch (err) {
      console.error('Failed to get student history:', err);
      return { quizzes: [], analytics: { strengths: [], weaknesses: [], topic_mastery: {} } };
    }
  };

  const handleLogin = async () => {
    return await loginWithGoogle();
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        students,
        activeStudent,
        setActiveStudent,
        currentQuiz,
        setCurrentQuiz,
        activeSubject,
        setActiveSubject,
        activeTopic,
        setActiveTopic,
        activeGrade,
        setActiveGrade,
        activeDifficulty,
        setActiveDifficulty,
        themeSetting,
        resolvedTheme,
        handleThemeChange,
        registerStudent,
        recordQuizResult,
        getStudentHistoryAndAnalytics,
        handleLogin,
        handleLogout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
