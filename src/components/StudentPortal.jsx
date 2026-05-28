import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateQuizTopic, runHarmonyCouncil } from '../harmony/harmonyEngine';
import { 
  ChevronLeft, Award, Play, 
  Sparkles, ScanLine,
  Sun, Moon, Laptop
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import VisionCapturePanel from './VisionCapturePanel';

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
  const [generatedTopics, setGeneratedTopics] = useState([]);
  const [learningHubView, setLearningHubView] = useState('adaptive');

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology'
  ];

  const refreshGeneratedTopic = async (subjectOverride = activeSubject, gradeOverride = activeGrade) => {
    if (!subjectOverride) {
      setActiveTopic('');
      setGeneratedTopics([]);
      setTopicGenerationError('');
      return;
    }

    setTopicLoading(true);
    setTopicGenerationError('');
    setActiveTopic('');
    setGeneratedTopics([]);

    try {
      const generated = await generateQuizTopic(subjectOverride, gradeOverride);
      const options = Array.isArray(generated) && generated.length > 0 ? generated : [
        {
          topic: `${subjectOverride} Fundamentals`,
          syllabusReference: 'Sri Lankan government syllabus alignment',
          whyRelevant: 'AI-generated syllabus-aligned topic.'
        }
      ];
      setGeneratedTopics(options);
      setTopicGenerationError('');
    } catch (err) {
      console.error(err);
      const fallbackOptions = [
        {
          topic: `${subjectOverride} Fundamentals`,
          syllabusReference: 'Sri Lankan government syllabus alignment',
          whyRelevant: 'AI-generated syllabus-aligned topic.'
        }
      ];
      setGeneratedTopics(fallbackOptions);
      setActiveTopic(fallbackOptions[0].topic);
      setTopicGenerationError('Generated fallback topic due to AI topic generation error.');
    } finally {
      setTopicLoading(false);
    }
  };

  const pickTopicForMe = () => {
    if (generatedTopics.length === 0) return;
    const chosenTopic = generatedTopics[Math.floor(Math.random() * generatedTopics.length)];
    setActiveTopic(chosenTopic.topic);
    setTopicGenerationError(`AI selected: ${chosenTopic.topic}`);
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
    if (!activeSubject || !activeTopic) return;

    setCurrentQuiz({ loading: true });

    try {
      const quizPayload = await runHarmonyCouncil(
        activeSubject,
        activeTopic,
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
    <div style={styles.container} className="app-shell">
      {/* Header */}
      <header className="navbar app-navbar student-nav" style={{ justifyContent: 'space-between' }}>
        <button onClick={() => setActiveStudent(null)} className="btn-secondary" style={styles.backBtn}>
          <ChevronLeft size={16} />
          <span>Exit Learning Hub</span>
        </button>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logoImg} alt="STEMMind AI Logo" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>STEM Mind AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="student-nav-right">
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

          <div style={styles.studentBadge} className="student-badge">
            <Award size={16} style={{ color: '#06b6d4' }} />
            <span>Student Portal: {activeStudent?.name}</span>
          </div>
        </div>
      </header>

      {/* Selector Container */}
      <main style={styles.main} className="student-main">
        <div style={styles.card} className="card-glass student-card">
          <div style={styles.introHeader}>
            <Sparkles size={36} style={{ color: '#8b5cf6', marginBottom: '12px' }} />
            <h1 style={styles.title} className="student-title">Harmony Adaptive Learning</h1>
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

            {/* AI-generated topics */}
            <div style={styles.selectBlock}>
              <label style={styles.label}>AI-Generated Topics</label>
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
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} style={{ color: '#06b6d4' }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#06b6d4' }}>Syllabus-Aligned Topics</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={pickTopicForMe}
                        disabled={!generatedTopics.length || topicLoading}
                        style={{
                          ...styles.optionBtn,
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          minWidth: 'auto',
                          opacity: (!generatedTopics.length || topicLoading) ? 0.5 : 1,
                          cursor: (!generatedTopics.length || topicLoading) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Select me a topic
                      </button>
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
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {topicLoading ? (
                      <div style={{
                        fontSize: '0.92rem',
                        color: 'var(--text-muted)',
                        minHeight: '24px'
                      }}>
                        Generating 5 fresh Sri Lankan syllabus-aligned topics...
                      </div>
                    ) : generatedTopics.length > 0 ? (
                      generatedTopics.map((topicOption, index) => {
                        const isSelected = activeTopic === topicOption.topic;
                        return (
                          <button
                            key={`${topicOption.topic}-${index}`}
                            onClick={() => {
                              setActiveTopic(topicOption.topic);
                              setTopicGenerationError('');
                            }}
                            style={{
                              ...styles.optionBtn,
                              textAlign: 'left',
                              alignItems: 'flex-start',
                              minHeight: 'auto',
                              backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                              borderColor: isSelected ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)',
                              padding: '14px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              width: '100%'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{topicOption.topic}</div>
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                background: isSelected ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255,255,255,0.08)',
                                color: isSelected ? '#67e8f9' : 'var(--text-secondary)',
                                borderRadius: '999px',
                                padding: '4px 8px'
                              }}>
                                {isSelected ? 'Selected' : 'Choose'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>{topicOption.whyRelevant}</div>
                            <div style={{ fontSize: '0.72rem', color: '#67e8f9', lineHeight: '1.35' }}>{topicOption.syllabusReference}</div>
                          </button>
                        );
                      })
                    ) : (
                      <div style={{
                        fontSize: '0.92rem',
                        color: 'var(--text-muted)',
                        minHeight: '24px'
                      }}>
                        Select a subject to generate 5 syllabus-aligned topic options.
                      </div>
                    )}
                  </div>

                  <div style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.4'
                  }}>
                    {topicGenerationError || (activeTopic ? `Selected topic: ${activeTopic}` : `Choose a topic or let AI pick one for Grade ${activeGrade} ${activeSubject || 'subject'}.`)}
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

          <div className="student-start-bar">
            <div style={styles.hubModeRow}>
              <button
                className="btn-secondary"
                onClick={() => setLearningHubView('adaptive')}
                style={{
                  ...styles.modeBtn,
                  borderColor: learningHubView === 'adaptive' ? '#8b5cf6' : 'var(--border-color)',
                  background: learningHubView === 'adaptive' ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255,255,255,0.03)'
                }}
              >
                <Play size={16} />
                <span>Adaptive Study Unit</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => setLearningHubView('analyzer')}
                style={{
                  ...styles.modeBtn,
                  borderColor: learningHubView === 'analyzer' ? '#06b6d4' : 'var(--border-color)',
                  background: learningHubView === 'analyzer' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255,255,255,0.03)'
                }}
              >
                <ScanLine size={16} />
                <span>Photo Analyzer</span>
              </button>
            </div>
            {learningHubView === 'adaptive' ? (
              <div style={styles.startBarButtons}>
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
            ) : (
              <VisionCapturePanel />
            )}
          </div>
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
    flex: 1,
    justifyContent: 'center',
    padding: '14px',
    fontSize: '1.05rem',
  },
  startBarButtons: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  hubModeRow: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    marginBottom: '16px',
  },
  modeBtn: {
    flex: 1,
    justifyContent: 'center',
  },
};
