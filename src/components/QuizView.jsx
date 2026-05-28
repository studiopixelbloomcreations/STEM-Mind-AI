import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { runHarmonyCouncil, runExplanationAgent } from '../harmony/harmonyEngine';
import voiceSynthesizer from '../utils/voiceSynthesizer';
import { 
  Volume2, VolumeX, Sparkles, HelpCircle, Check, X, 
  ChevronRight, Brain, Lightbulb, GraduationCap, Clock 
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function QuizView() {
  const { 
    activeStudent, activeSubject, activeTopic, activeGrade,
    currentQuiz, setCurrentQuiz, recordQuizResult 
  } = useApp();

  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Explanation state
  const [explanation, setExplanation] = useState('');
  const [eli10, setEli10] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  
  // Quiz tracking
  const [quizScore, setQuizScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Timer effect
  useEffect(() => {
    if (currentQuiz && !currentQuiz.loading && !currentQuiz.error) {
      const timer = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentQuiz]);

  // Voice narration triggers
  const handleSpeak = (text) => {
    if (isSpeaking) {
      voiceSynthesizer.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      voiceSynthesizer.speak(text, () => setIsSpeaking(false));
    }
  };

  useEffect(() => {
    return () => voiceSynthesizer.stop();
  }, []);

  if (currentQuiz?.loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="shimmer card-glass" style={styles.loadingCard}>
          <Brain size={48} className="glow-pulse" style={{ color: '#8b5cf6', marginBottom: '24px' }} />
          <h2 style={{ marginBottom: '8px' }}>Harmony AI Council is Thinking...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Teacher AI, Difficulty AI, and Exam Coach AI are collaborating to generate your next adaptive question.
          </p>
        </div>
      </div>
    );
  }

  if (currentQuiz?.error) {
    return (
      <div style={styles.loadingContainer}>
        <div className="card-glass" style={styles.loadingCard}>
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>Harmony Orchestration Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {currentQuiz.error}
          </p>
          <button onClick={() => setCurrentQuiz(null)} className="btn-primary">
            Back to Selectors
          </button>
        </div>
      </div>
    );
  }

  const { 
    question, questionType, choices, correctAnswer, 
    hints, examTips, motivatorQuote, difficulty, confidenceScore 
  } = currentQuiz;

  const handleSubmit = async () => {
    if (submitted) return;
    const studentAnswer = questionType === 'MCQ' || questionType === 'True/False' ? selectedAnswer : typedAnswer;
    if (!studentAnswer.trim()) return;

    setSubmitted(true);
    voiceSynthesizer.stop();
    setIsSpeaking(false);

    // Simple comparison
    const correct = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);
    
    if (correct) {
      setQuizScore(prev => prev + 1);
    }

    // Generate Explanation
    setLoadingExplanation(true);
    try {
      const explContent = await runExplanationAgent(question, correctAnswer, studentAnswer, eli10);
      setExplanation(explContent);
    } catch (e) {
      setExplanation('Could not fetch explanation details.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Reload explanation on ELI10 toggle
  const toggleEli10 = async () => {
    const studentAnswer = questionType === 'MCQ' || questionType === 'True/False' ? selectedAnswer : typedAnswer;
    const nextEli = !eli10;
    setEli10(nextEli);
    setLoadingExplanation(true);
    try {
      const explContent = await runExplanationAgent(question, correctAnswer, studentAnswer, nextEli);
      setExplanation(explContent);
    } catch (e) {
      setExplanation('Could not fetch explanation details.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleNext = async () => {
    // If we completed 5 questions, save results
    if (questionCount >= 5) {
      const finalScorePercentage = Math.round(((quizScore + (isCorrect ? 1 : 0)) / 5) * 100);
      setCurrentQuiz({ loading: true });
      await recordQuizResult(
        activeStudent.id,
        activeSubject,
        activeTopic,
        difficulty,
        [], // Empty array for standard metadata schema
        finalScorePercentage,
        seconds
      );
      setCurrentQuiz(null);
      return;
    }

    // Otherwise load next adaptive question
    setSubmitted(false);
    setSelectedAnswer('');
    setTypedAnswer('');
    setShowHint(false);
    setExplanation('');
    setEli10(false);
    setQuestionCount(prev => prev + 1);

    setCurrentQuiz({ loading: true });
    try {
      const nextQuizPayload = await runHarmonyCouncil(
        activeSubject,
        activeTopic,
        activeGrade,
        difficulty,
        { streak: quizScore, history: [] }
      );
      setCurrentQuiz({
        ...nextQuizPayload,
        loading: false,
        questionsAttempted: [],
        currentQuestionIndex: questionCount,
        score: quizScore,
        startTime: Date.now()
      });
    } catch (err) {
      setCurrentQuiz({ error: 'Failed to generate next question from the council.' });
    }
  };

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <header className="navbar" style={{ padding: '0 40px', justifyContent: 'space-between' }}>
        <div style={styles.navProgress}>
          <span>Question {questionCount} of 5</span>
          <span style={styles.difficultyBadge}>{difficulty.toUpperCase()}</span>
        </div>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logoImg} alt="STEMMind AI Logo" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>STEMMind AI</span>
        </div>
        <div style={styles.timer}>
          <Clock size={16} />
          <span>{seconds}s</span>
        </div>
      </header>

      {/* Main quiz interface */}
      <main style={styles.main}>
        <div style={styles.layoutGrid}>
          {/* Main Question Card */}
          <div style={styles.leftCol} className="card-glass">
            <div style={styles.cardHeader}>
              <div style={styles.confidenceWrap}>
                <Sparkles size={14} style={{ color: '#06b6d4' }} />
                <span>Confidence Score: {confidenceScore}%</span>
              </div>
              <button 
                onClick={() => handleSpeak(question)} 
                className="btn-secondary" 
                style={styles.voiceBtn}
              >
                {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                <span>Narration</span>
              </button>
            </div>

            <h2 style={styles.questionText}>{question}</h2>

            {/* Answer Input controls */}
            <div style={styles.inputsWrapper}>
              {(questionType === 'MCQ' || questionType === 'True/False') && choices ? (
                <div style={styles.choicesGrid}>
                  {choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => !submitted && setSelectedAnswer(choice)}
                      disabled={submitted}
                      style={{
                        ...styles.choiceCard,
                        borderColor: selectedAnswer === choice ? '#8b5cf6' : 'rgba(255, 255, 255, 0.05)',
                        backgroundColor: selectedAnswer === choice ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: submitted ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Type your response here..."
                  value={typedAnswer}
                  onChange={e => setTypedAnswer(e.target.value)}
                  disabled={submitted}
                  className="input-field"
                  style={styles.textInput}
                />
              )}
            </div>

            {/* Footer triggers */}
            <div style={styles.cardFooter}>
              <button 
                onClick={() => setShowHint(!showHint)} 
                className="btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                <Lightbulb size={16} />
                <span>{showHint ? 'Hide Hint' : 'Get Hint'}</span>
              </button>

              {!submitted ? (
                <button onClick={handleSubmit} className="btn-primary" style={styles.submitBtn}>
                  Submit Answer
                </button>
              ) : (
                <button onClick={handleNext} className="btn-primary" style={styles.submitBtn}>
                  <span>{questionCount >= 5 ? 'Finish & Save' : 'Next Question'}</span>
                  <ChevronRight size={18} />
                </button>
              )}
            </div>

            {showHint && hints && (
              <div style={styles.hintBox}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                  <Lightbulb size={16} />
                  <span>Teacher AI Hint</span>
                </h4>
                <p>{hints[0]}</p>
              </div>
            )}
          </div>

          {/* Right Column: Feedback, Explanations, Coach, Motivation */}
          <div style={styles.rightCol}>
            {submitted && (
              <div 
                style={{
                  ...styles.feedbackCard,
                  borderColor: isCorrect ? '#10b981' : '#ef4444',
                  backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                }}
                className="card-glass"
              >
                <div style={styles.feedbackTitleRow}>
                  {isCorrect ? (
                    <>
                      <Check size={20} style={{ color: '#10b981' }} />
                      <h3 style={{ color: '#10b981' }}>Correct Answer</h3>
                    </>
                  ) : (
                    <>
                      <X size={20} style={{ color: '#ef4444' }} />
                      <h3 style={{ color: '#ef4444' }}>Incorrect Answer</h3>
                    </>
                  )}
                </div>

                <p style={styles.correctInfo}>Correct value: <strong>{correctAnswer}</strong></p>

                <div style={styles.explanationSection}>
                  <div style={styles.explanationHeader}>
                    <h4>Explanation AI</h4>
                    <button 
                      onClick={toggleEli10}
                      style={{
                        ...styles.eliBtn,
                        backgroundColor: eli10 ? '#8b5cf6' : 'transparent',
                        borderColor: eli10 ? '#8b5cf6' : 'rgba(255, 255, 255, 0.15)'
                      }}
                    >
                      Explain Like I'm 10
                    </button>
                  </div>

                  {loadingExplanation ? (
                    <div className="shimmer" style={styles.explanationShimmer}></div>
                  ) : (
                    <>
                      <p style={styles.explanationBody}>{explanation}</p>
                      <button 
                        onClick={() => handleSpeak(explanation)}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.8rem', marginTop: '8px' }}
                      >
                        Listen to Explanation
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Exam Coach tips */}
            <div style={styles.infoCard} className="card-glass">
              <div style={styles.sectionTitleRow}>
                <GraduationCap size={18} style={{ color: '#06b6d4' }} />
                <h3>Exam Coach AI Strategy</h3>
              </div>
              <p style={styles.infoBody}>{examTips}</p>
            </div>

            {/* Motivator support */}
            <div style={styles.infoCard} className="card-glass">
              <div style={styles.sectionTitleRow}>
                <Brain size={18} style={{ color: '#8b5cf6' }} />
                <h3>Motivator AI</h3>
              </div>
              <p style={styles.infoBody}>{motivatorQuote}</p>
            </div>
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
  navProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  difficultyBadge: {
    fontSize: '0.75rem',
    padding: '4px 8px',
    borderRadius: '4px',
    background: 'rgba(139, 92, 246, 0.2)',
    color: '#8b5cf6',
  },
  timer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.95rem',
  },
  main: {
    flex: 1,
    padding: '40px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '32px',
    '@media (max-width: 968px)': {
      gridTemplateColumns: '1fr',
    }
  },
  leftCol: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  confidenceWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    color: '#06b6d4',
  },
  voiceBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    gap: '6px',
    fontSize: '0.85rem',
  },
  questionText: {
    fontSize: '1.6rem',
    fontWeight: '600',
    lineHeight: '1.4',
    marginBottom: '32px',
  },
  inputsWrapper: {
    marginBottom: '32px',
  },
  choicesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  choiceCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '16px 20px',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-sans)',
  },
  textInput: {
    padding: '16px',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  submitBtn: {
    padding: '12px 28px',
  },
  hintBox: {
    marginTop: '20px',
    padding: '16px',
    borderLeft: '4px solid #f59e0b',
    background: 'rgba(245, 158, 11, 0.05)',
    borderRadius: '4px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  feedbackCard: {
    padding: '24px',
  },
  feedbackTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  correctInfo: {
    fontSize: '0.95rem',
    marginBottom: '20px',
  },
  explanationSection: {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '20px',
  },
  explanationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  eliBtn: {
    border: '1px solid',
    borderRadius: '100px',
    padding: '4px 12px',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  explanationBody: {
    fontSize: '0.92rem',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
  },
  explanationShimmer: {
    height: '60px',
    borderRadius: '8px',
  },
  infoCard: {
    padding: '20px',
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  infoBody: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  loadingCard: {
    maxWidth: '480px',
    width: '100%',
    padding: '40px',
    textAlign: 'center',
  }
};
