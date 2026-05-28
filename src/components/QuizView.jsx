import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  runHarmonyCouncil, 
  runExplanationAgent, 
  runVisualTeacherAgent, 
  runStepByStepExplanationAgent 
} from '../harmony/harmonyEngine';
import voiceSynthesizer from '../utils/voiceSynthesizer';
import { 
  Volume2, VolumeX, Sparkles, HelpCircle, Check, X, 
  ChevronRight, Brain, Lightbulb, GraduationCap, Clock,
  Sun, Moon, Laptop, RotateCcw, Play, ArrowRight, BookOpen
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function QuizView() {
  const { 
    activeStudent, activeSubject, activeTopic, activeGrade,
    currentQuiz, setCurrentQuiz, recordQuizResult,
    themeSetting, handleThemeChange
  } = useApp();

  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Explanation state
  const [explanation, setExplanation] = useState('');
  const [eli10, setEli10] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Step-by-Step explanation state for wrong answers
  const [wrongSteps, setWrongSteps] = useState([]);
  const [currentWrongStep, setCurrentWrongStep] = useState(0);
  const [loadingWrongSteps, setLoadingWrongSteps] = useState(false);
  const [explanationExpandedMode, setExplanationExpandedMode] = useState(false);

  // Interactive teaching mode state ("I don't know how to solve this")
  const [teachingMode, setTeachingMode] = useState(false);
  const [teachingSteps, setTeachingSteps] = useState([]);
  const [currentTeachingStep, setCurrentTeachingStep] = useState(0);
  const [loadingTeaching, setLoadingTeaching] = useState(false);
  const [teachingSimplerMode, setTeachingSimplerMode] = useState(false);
  const [speakingStep, setSpeakingStep] = useState(false);
  const [autoPlayTeaching, setAutoPlayTeaching] = useState(false);
  
  const autoPlayTeachingRef = useRef(false);
  const teachingModeRef = useRef(false);
  const teachingStepsRef = useRef([]);

  useEffect(() => {
    autoPlayTeachingRef.current = autoPlayTeaching;
  }, [autoPlayTeaching]);

  useEffect(() => {
    teachingModeRef.current = teachingMode;
  }, [teachingMode]);

  useEffect(() => {
    teachingStepsRef.current = teachingSteps;
  }, [teachingSteps]);

  
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

  const loadExplanationContent = async (studentAnswer, explanationMode = eli10) => {
    setLoadingExplanation(true);
    try {
      const explContent = await runExplanationAgent(question, correctAnswer, studentAnswer, explanationMode);
      setExplanation(explContent);
    } catch (e) {
      setExplanation('Could not fetch explanation details.');
    } finally {
      setLoadingExplanation(false);
    }
  };

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
      setExplanationExpandedMode(false);
      await loadExplanationContent(studentAnswer);
    } else {
      // Wrong Answer Step-by-Step Full-screen Mode
      await startWrongAnswerExplanation(studentAnswer);
    }
  };

  // Trigger step-by-step wrong answer explanation loading
  const startWrongAnswerExplanation = async (studentAnswer, currentEli10 = eli10) => {
    setLoadingWrongSteps(true);
    setExplanationExpandedMode(true);
    try {
      const steps = await runStepByStepExplanationAgent(question, correctAnswer, studentAnswer, currentEli10);
      setWrongSteps(steps);
      setCurrentWrongStep(0);
      if (steps && steps.length > 0) {
        setSpeakingStep(true);
        voiceSynthesizer.speakPuter(steps[0].speech, () => setSpeakingStep(false));
      }
    } catch (err) {
      console.error(err);
      setWrongSteps([{ caption: "Failed to generate steps.", speech: "Sorry, I could not generate the explanation steps." }]);
    } finally {
      setLoadingWrongSteps(false);
    }
  };

  const handleWrongStepNext = () => {
    if (currentWrongStep < wrongSteps.length - 1) {
      const nextIdx = currentWrongStep + 1;
      setCurrentWrongStep(nextIdx);
      setSpeakingStep(true);
      voiceSynthesizer.speakPuter(wrongSteps[nextIdx].speech, () => setSpeakingStep(false));
    }
  };

  const handleWrongStepPrev = () => {
    if (currentWrongStep > 0) {
      const prevIdx = currentWrongStep - 1;
      setCurrentWrongStep(prevIdx);
      setSpeakingStep(true);
      voiceSynthesizer.speakPuter(wrongSteps[prevIdx].speech, () => setSpeakingStep(false));
    }
  };

  const playTeachingStep = (idx, stepsList = teachingSteps) => {
    if (!stepsList[idx]) return;
    setCurrentTeachingStep(idx);
    setSpeakingStep(true);
    voiceSynthesizer.speakPuter(stepsList[idx].speech, () => {
      setSpeakingStep(false);
      // Automatically advance to the next step if Auto Play is toggled and we are still in teaching mode
      if (autoPlayTeachingRef.current && teachingModeRef.current && idx < stepsList.length - 1) {
        setTimeout(() => {
          if (autoPlayTeachingRef.current && teachingModeRef.current) {
            playTeachingStep(idx + 1, stepsList);
          }
        }, 1500); // 1.5s pause before advancing automatically
      }
    });
  };

  // Trigger interactive visual teaching mode
  const startInteractiveTeaching = async (simpler = false) => {
    setTeachingMode(true);
    setLoadingTeaching(true);
    setTeachingSimplerMode(simpler);
    try {
      const steps = await runVisualTeacherAgent(question, correctAnswer, simpler);
      setTeachingSteps(steps);
      setCurrentTeachingStep(0);
      if (steps && steps.length > 0) {
        playTeachingStep(0, steps);
      }
    } catch (err) {
      console.error(err);
      const fallback = [{ visual: "<div style='color:red;'>Failed to load.</div>", speech: "Could not load teaching steps." }];
      setTeachingSteps(fallback);
      playTeachingStep(0, fallback);
    } finally {
      setLoadingTeaching(false);
    }
  };

  const handleTeachingStepNext = () => {
    if (currentTeachingStep < teachingSteps.length - 1) {
      playTeachingStep(currentTeachingStep + 1);
    }
  };

  const handleTeachingStepPrev = () => {
    if (currentTeachingStep > 0) {
      playTeachingStep(currentTeachingStep - 1);
    }
  };


  // Reload explanation on ELI10 toggle
  const toggleEli10 = async () => {
    const studentAnswer = questionType === 'MCQ' || questionType === 'True/False' ? selectedAnswer : typedAnswer;
    const nextEli = !eli10;
    setEli10(nextEli);

    if (isCorrect) {
      setExplanationExpandedMode(false);
      await loadExplanationContent(studentAnswer, nextEli);
    } else {
      await startWrongAnswerExplanation(studentAnswer, nextEli);
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
    setExplanationExpandedMode(false);
    setWrongSteps([]);
    setCurrentWrongStep(0);
    setTeachingMode(false);
    setTeachingSteps([]);
    setCurrentTeachingStep(0);
    setTeachingSimplerMode(false);
    voiceSynthesizer.stop();

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

          <div style={styles.timer}>
            <Clock size={16} />
            <span>{seconds}s</span>
          </div>
        </div>
      </header>

      {/* Main quiz interface */}
      <main style={styles.main}>
        {teachingMode ? (
          /* Live visual teaching mode takes full width */
          <div className="card-glass" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)' }}>
                <BookOpen size={24} />
                <span>Interactive Visual Masterclass</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Auto Play Option */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'var(--glass-bg)', padding: '6px 12px', borderRadius: '100px', border: '1px solid var(--border-color)', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={autoPlayTeaching} 
                    onChange={(e) => {
                      setAutoPlayTeaching(e.target.checked);
                      // If toggled on while narration is not playing, kickstart it from the current step
                      if (e.target.checked && !speakingStep) {
                        playTeachingStep(currentTeachingStep);
                      }
                    }} 
                    style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  <span>Autoplay Steps</span>
                </label>

                <button 
                  onClick={() => {
                    voiceSynthesizer.stop();
                    setTeachingMode(false);
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  Exit Teaching
                </button>
              </div>
            </div>

            {loadingTeaching ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
                <Brain size={48} className="glow-pulse" style={{ color: '#06b6d4', marginBottom: '16px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Visual Teacher AI is preparing steps...</p>
              </div>
            ) : (
              <div>
                {/* Live Visual Section */}
                <div className="visual-canvas">
                  {teachingSteps[currentTeachingStep] ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: teachingSteps[currentTeachingStep].visual }} 
                      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No visuals for this step</p>
                  )}
                </div>

                {/* Navigation controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <button 
                    onClick={handleTeachingStepPrev} 
                    disabled={currentTeachingStep === 0} 
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                  <span style={{ fontWeight: '600' }}>Step {currentTeachingStep + 1} of {teachingSteps.length}</span>
                  <button 
                    onClick={currentTeachingStep === teachingSteps.length - 1 ? undefined : handleTeachingStepNext} 
                    disabled={currentTeachingStep === teachingSteps.length - 1} 
                    className="btn-primary"
                    style={{ visibility: currentTeachingStep === teachingSteps.length - 1 ? 'hidden' : 'visible' }}
                  >
                    Next Step
                  </button>
                </div>

                {/* Voice replay button */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                  <button
                    onClick={() => {
                      if (teachingSteps[currentTeachingStep]) {
                        voiceSynthesizer.speakPuter(teachingSteps[currentTeachingStep].speech);
                      }
                    }}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', fontSize: '0.85rem' }}
                  >
                    <Volume2 size={16} />
                    <span>Repeat Narration</span>
                  </button>
                </div>

                {/* Options at the end of teaching */}
                {currentTeachingStep === teachingSteps.length - 1 && (
                  <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <button 
                      onClick={() => startInteractiveTeaching(true)} 
                      className="btn-secondary"
                      style={{ borderColor: 'var(--color-warning)' }}
                    >
                      <RotateCcw size={16} />
                      <span>I still didn't get it</span>
                    </button>
                    <button 
                      onClick={() => {
                        voiceSynthesizer.stop();
                        setTeachingMode(false);
                      }} 
                      className="btn-primary"
                    >
                      <span>I got it, let's try!</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={styles.layoutGrid}>
            {/* Main Question Card */}
            <div style={styles.leftCol} className={`card-glass ${explanationExpandedMode ? 'fade-out-out' : ''}`}>
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setShowHint(!showHint)} 
                    className="btn-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    <Lightbulb size={16} />
                    <span>{showHint ? 'Hide Hint' : 'Get Hint'}</span>
                  </button>

                  <button 
                    onClick={() => startInteractiveTeaching(false)} 
                    className="btn-secondary"
                    style={{ padding: '8px 16px', borderColor: 'var(--accent-secondary)' }}
                  >
                    <HelpCircle size={16} />
                    <span>I don't know how to solve this</span>
                  </button>
                </div>

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
            <div style={explanationExpandedMode ? { width: '100%', gridColumn: '1 / -1' } : styles.rightCol}>
              {/* Step by step Wrong explanation expands to full width */}
              {submitted && !isCorrect && explanationExpandedMode && (
                <div className="card-glass explanation-full-screen" style={{ borderColor: '#ef4444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
                      <X size={20} />
                      <span>Incorrect Answer Breakdown</span>
                    </h3>
                    <button 
                      onClick={toggleEli10}
                      className="eli-btn"
                      style={styles.eliBtn}
                    >
                      {eli10 ? 'Explain Standard' : "Explain Like I'm 10"}
                    </button>
                  </div>

                  {loadingWrongSteps ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                      <Brain size={36} className="glow-pulse" style={{ color: '#ef4444', marginBottom: '16px' }} />
                      <p style={{ color: 'var(--text-secondary)' }}>Explanation AI is breaking it down...</p>
                    </div>
                  ) : (
                    <div>
                      {/* Live Visual for this step */}
                      {wrongSteps[currentWrongStep] && wrongSteps[currentWrongStep].visual && (
                        <div className="visual-canvas" style={{ marginBottom: '20px' }}>
                          <div 
                            dangerouslySetInnerHTML={{ __html: wrongSteps[currentWrongStep].visual }} 
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          />
                        </div>
                      )}

                      {/* Caption stays on screen */}
                      {wrongSteps[currentWrongStep] && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '24px', minHeight: '80px', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
                          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', width: '100%', color: 'var(--text-primary)', textAlign: 'center' }}>
                            {wrongSteps[currentWrongStep].caption}
                          </p>
                        </div>
                      )}

                      {/* Step controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                        <button 
                          onClick={handleWrongStepPrev} 
                          disabled={currentWrongStep === 0} 
                          className="btn-secondary"
                        >
                          Previous Step
                        </button>
                        <span style={{ fontWeight: '600' }}>Step {currentWrongStep + 1} of {wrongSteps.length}</span>
                        
                        {currentWrongStep < wrongSteps.length - 1 ? (
                          <button 
                            onClick={handleWrongStepNext} 
                            className="btn-primary"
                          >
                            <span>Next Step</span>
                            <ArrowRight size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={handleNext} 
                            className="btn-primary"
                          >
                            <span>{questionCount >= 5 ? 'Finish & Save' : 'Next Question'}</span>
                            <ChevronRight size={18} />
                          </button>
                        )}
                      </div>

                      {/* Voice replay button */}
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                        <button
                          onClick={() => {
                            if (wrongSteps[currentWrongStep]) {
                              voiceSynthesizer.speakPuter(wrongSteps[currentWrongStep].speech);
                            }
                          }}
                          className="btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', fontSize: '0.85rem' }}
                        >
                          <Volume2 size={16} />
                          <span>Repeat Explanation</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Standard Correct feedback card */}
              {submitted && isCorrect && !explanationExpandedMode && (
                <div 
                  style={{
                    ...styles.feedbackCard,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)'
                  }}
                  className="card-glass"
                >
                  <div style={styles.feedbackTitleRow}>
                    <Check size={20} style={{ color: '#10b981' }} />
                    <h3 style={{ color: '#10b981' }}>Correct Answer</h3>
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
              <div style={styles.infoCard} className={`card-glass ${explanationExpandedMode ? 'fade-out-out' : ''}`}>
                <div style={styles.sectionTitleRow}>
                  <GraduationCap size={18} style={{ color: '#06b6d4' }} />
                  <h3>Exam Coach AI Strategy</h3>
                </div>
                <p style={styles.infoBody}>{examTips}</p>
              </div>

              {/* Motivator support */}
              <div style={styles.infoCard} className={`card-glass ${explanationExpandedMode ? 'fade-out-out' : ''}`}>
                <div style={styles.sectionTitleRow}>
                  <Brain size={18} style={{ color: '#8b5cf6' }} />
                  <h3>Motivator AI</h3>
                </div>
                <p style={styles.infoBody}>{motivatorQuote}</p>
              </div>
            </div>
          </div>
        )}
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

