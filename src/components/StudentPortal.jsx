import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateQuizTopic, runHarmonyCouncil } from '../harmony/harmonyEngine';
import { 
  ChevronLeft, Award, Play, 
  Sparkles,
  Sun, Moon, Laptop
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function StudentPortal() {
  const { 
    activeStudent, setActiveStudent,
    activeSubject, setActiveSubject,
    activeTopic, setActiveTopic,
    activeGrade, setActiveGrade,
    activeDifficulty, setActiveDifficulty,
    setCurrentQuiz,
    themeSetting, handleThemeChange
  } = useApp();

  const [topicLoading, setTopicLoading] = useState(false);
  const [topicGenerationError, setTopicGenerationError] = useState('');

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology'
  ];

  const refreshGeneratedTopic = async (subjectOverride = activeSubject, gradeOverride = activeGrade) => {
    if (!subjectOverride) {
      setActiveTopic('');
      setTopicGenerationError('');
      return;
    }

    setTopicLoading(true);
    setTopicGenerationError('');

    try {
      const generated = await generateQuizTopic(subjectOverride, gradeOverride);
      setActiveTopic(generated.topic);
      setTopicGenerationError('');
    } catch (err) {
      console.error(err);
      setActiveTopic(`${subjectOverride} Fundamentals`);
      setTopicGenerationError('Generated fallback topic due to AI topic generation error.');
    } finally {
      setTopicLoading(false);
    }
  };

  const handleGradeChange = async (grade) => {
    setActiveGrade(grade);
    if (!activeSubject) {
      setActiveTopic('');
      setTopicGenerationError('');
      return;
    }

    await refreshGeneratedTopic(activeSubject, grade);
  };

  const handleSubjectChange = async (subject) => {
    setActiveSubject(subject);
    setActiveTopic('');
    setTopicGenerationError('');
    await refreshGeneratedTopic(subject, activeGrade);
  };

  const startQuiz = async () => {
    if (!activeSubject) return;

    setCurrentQuiz({ loading: true });

    try {
      const generated = await generateQuizTopic(activeSubject, activeGrade);
      const freshTopic = generated.topic;
      setActiveTopic(freshTopic);

      const quizPayload = await runHarmonyCouncil(
        activeSubject,
        freshTopic,
        activeGrade,
        activeDifficulty,
        { streak: 0, history: [] } // Empty stats for new quiz initiation
      );

      setCurrentQuiz({
        ...quizPayload,
        loading: false,
        questionsAttempted: [],
        currentQuestionIndex: 0,
        score: 0,
        startTime: Date.now()
      });
    } catch (err) {
      console.error(err);
      setCurrentQuiz({ error: 'Failed to launch the Harmony Council. Please check API keys.' });
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header className="navbar" style={{ padding: '0 40px', justifyContent: 'space-between' }}>
        <button onClick={() => setActiveStudent(null)} className="btn-secondary" style={styles.backBtn}>
          <ChevronLeft size={16} />
          <span>Exit Learning Hub</span>
        </button>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logoImg} alt="STEMMind AI Logo" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>STEM Mind AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Theme Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--glass-bg)', padding: '4px 8px', borderRadius: '100px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => handleThemeChange('light')} 
              style={{ border: 'none', background: themeSetting === 'light' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', color: themeSetting === 'light' ? '#8b5cf6' : 'var(--text-muted)', padding: '4px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Light Mode"
            >
              <Sun size={14} />
            </button>
            <button 
              onClick={() => handleThemeChange('dark')} 
              style={{ border: 'none', background: themeSetting === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', color: themeSetting === 'dark' ? '#8b5cf6' : 'var(--text-muted)', padding: '4px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Dark Mode"
            >
              <Moon size={14} />
            </button>
            <button 
              onClick={() => handleThemeChange('system')} 
              style={{ border: 'none', background: themeSetting === 'system' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', color: themeSetting === 'system' ? '#8b5cf6' : 'var(--text-muted)', padding: '4px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="System Theme"
            >
              <Laptop size={14} />
            </button>
          </div>

          <div style={styles.studentBadge}>
            <Award size={16} style={{ color: '#06b6d4' }} />
            <span>Student Portal: {activeStudent?.name}</span>
          </div>
        </div>
      </header>

      {/* Selector Container */}
      <main style={styles.main}>
        <div style={styles.card} className="card-glass">
          <div style={styles.introHeader}>
            <Sparkles size={36} style={{ color: '#8b5cf6', marginBottom: '12px' }} />
            <h1 style={styles.title}>Harmony Adaptive Learning</h1>
            <p style={styles.subtitle}>
              Configure your focus area. The Harmony Council will adapt the curriculum, difficulty, and hints in real time.
            </p>
          </div>

          <div style={styles.selectorsGrid}>
            {/* Grade selection */}
            <div style={styles.selectBlock}>
              <label style={styles.label}>Select Grade</label>
              <div style={styles.optionGroup}>
                {[9, 10, 11].map(g => (
                  <button
                    key={g}
                    onClick={() => handleGradeChange(g)}
                    style={{
                      ...styles.optionBtn,
                      backgroundColor: activeGrade === g ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      borderColor: activeGrade === g ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject selection */}
            <div style={styles.selectBlock}>
              <label style={styles.label}>Choose Subject</label>
              <div style={styles.optionGroup}>
                {subjects.map(sub => (
                  <button
                    key={sub}
                    onClick={() => handleSubjectChange(sub)}
                    style={{
                      ...styles.optionBtn,
                      backgroundColor: activeSubject === sub ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      borderColor: activeSubject === sub ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* AI-generated topic */}
            <div style={styles.selectBlock}>
              <label style={styles.label}>AI-Generated Topic</label>
              <div style={{
                ...styles.optionGroup,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '10px'
              }}>
                <div style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} style={{ color: '#06b6d4' }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#06b6d4' }}>Syllabus-Aligned Topic</span>
                    </div>
                    <button
                      onClick={() => refreshGeneratedTopic()}
                      disabled={!activeSubject || topicLoading}
                      style={{
                        ...styles.optionBtn,
                        padding: '6px 10px',
                        fontSize: '0.72rem',
                        minWidth: 'auto',
                        opacity: (!activeSubject || topicLoading) ? 0.5 : 1,
                        cursor: (!activeSubject || topicLoading) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {topicLoading ? 'Generating...' : 'Regenerate'}
                    </button>
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    minHeight: '24px'
                  }}>
                    {topicLoading ? 'Generating a fresh Sri Lankan syllabus-aligned topic...' : (activeTopic || 'Select a subject to generate a topic')}
                  </div>
                  <div style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.4'
                  }}>
                    {topicGenerationError || `Generated for Grade ${activeGrade} ${activeSubject || 'subject'} using Sri Lankan government syllabus alignment.`}
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty selection */}
            <div style={styles.selectBlock}>
              <label style={styles.label}>Initial Difficulty</label>
              <div style={styles.optionGroup}>
                {['easy', 'medium', 'hard'].map(d => (
                  <button
                    key={d}
                    onClick={() => setActiveDifficulty(d)}
                    style={{
                      ...styles.optionBtn,
                      textTransform: 'capitalize',
                      backgroundColor: activeDifficulty === d ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      borderColor: activeDifficulty === d ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={startQuiz}
            disabled={!activeSubject || !activeTopic}
            className="btn-primary"
            style={{
              ...styles.startBtn,
              opacity: (!activeSubject || !activeTopic) ? 0.5 : 1,
              cursor: (!activeSubject || !activeTopic) ? 'not-allowed' : 'pointer'
            }}
          >
            <Play size={18} />
            <span>Generate Adaptive Study Unit</span>
          </button>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-primary)',
  },
  backBtn: {
    padding: '8px 16px',
  },
  studentBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    padding: '6px 14px',
    borderRadius: '100px',
    fontSize: '0.9rem',
    color: '#06b6d4',
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
  },
  card: {
    width: '100%',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  introHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: '800',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    maxWidth: '540px',
    margin: '0 auto',
  },
  selectorsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    marginBottom: '40px',
  },
  selectBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  optionGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    width: '100%',
  },
  optionBtn: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '10px 18px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-sans)',
    transition: 'all 0.2s ease',
  },
  startBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '14px',
    fontSize: '1.05rem',
  }
};
