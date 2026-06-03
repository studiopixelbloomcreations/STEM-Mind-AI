import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Brain,
  Camera,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  Upload,
  Volume2,
  XCircle,
} from 'lucide-react';
import { analyzeVisionImage, fetchRecentVisionAttempts } from '../services/visionService';
import {
  extractVisionTeachingQuestions,
  runVisualTeacherAgent,
  visionTeachingAnswerFor,
} from '../harmony/geminiHarmonyEngine';
import { fileToBase64, formatBytes, MAX_IMAGE_SIZE_BYTES, validateImageFile } from '../utils/visionValidation';
import { useApp } from '../context/AppContext';
import voiceSynthesizer from '../utils/voiceSynthesizer';
import ModelLoadProgress from './ModelLoadProgress';
import { preloadVisionModels } from '../ml/transformersClient';

const CONSENT_SESSION_KEY = 'vision-camera-consent-v1';

export default function VisionCapturePanel() {
  const { activeStudent, activeSubject, activeTopic, activeGrade } = useApp();
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [showConsent, setShowConsent] = useState(false);
  const [pendingCameraStart, setPendingCameraStart] = useState(false);
  const [consentGiven, setConsentGiven] = useState(() => sessionStorage.getItem(CONSENT_SESSION_KEY) === 'true');

  const [teachingMode, setTeachingMode] = useState(false);
  const [teachingQuestions, setTeachingQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [teachingSteps, setTeachingSteps] = useState([]);
  const [currentTeachingStep, setCurrentTeachingStep] = useState(0);
  const [loadingTeaching, setLoadingTeaching] = useState(false);
  const [autoPlayTeaching, setAutoPlayTeaching] = useState(true);
  const [speakingStep, setSpeakingStep] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const autoPlayTeachingRef = useRef(true);
  const teachingModeRef = useRef(false);

  const studentId = activeStudent?.id || null;

  const contextLabel = useMemo(() => {
    if (!activeSubject && !activeTopic) return 'General worksheet analysis';
    return `${activeSubject || 'General'}${activeTopic ? ` - ${activeTopic}` : ''}`;
  }, [activeSubject, activeTopic]);

  useEffect(() => {
    autoPlayTeachingRef.current = autoPlayTeaching;
  }, [autoPlayTeaching]);

  useEffect(() => {
    teachingModeRef.current = teachingMode;
  }, [teachingMode]);

  useEffect(() => () => voiceSynthesizer.stop(), []);

  useEffect(() => {
    preloadVisionModels();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!cameraActive || !streamRef.current || !videoRef.current) return undefined;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch((playError) => {
        console.error(playError);
        setError('Could not start camera preview. Try again or upload an image.');
      });
    }
    return undefined;
  }, [cameraActive]);

  useEffect(() => {
    if (!studentId) return;
    const loadAttempts = async () => {
      setAttemptsLoading(true);
      try {
        const attempts = await fetchRecentVisionAttempts({ studentId, limit: 6 });
        setRecentAttempts(attempts);
      } catch (fetchError) {
        console.error(fetchError);
      } finally {
        setAttemptsLoading(false);
      }
    };
    loadAttempts();
  }, [studentId]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }
    const nextUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [selectedFile]);

  const resetTeaching = () => {
    voiceSynthesizer.stop();
    setTeachingMode(false);
    setTeachingQuestions([]);
    setCurrentQuestionIndex(0);
    setTeachingSteps([]);
    setCurrentTeachingStep(0);
    setSpeakingStep(false);
  };

  const playTeachingStep = (idx, stepsList = teachingSteps) => {
    if (!stepsList[idx]) return;
    setCurrentTeachingStep(idx);
    setSpeakingStep(true);
    voiceSynthesizer.speak(stepsList[idx].speech, () => {
      setSpeakingStep(false);
      if (autoPlayTeachingRef.current && teachingModeRef.current && idx < stepsList.length - 1) {
        window.setTimeout(() => {
          if (autoPlayTeachingRef.current && teachingModeRef.current) {
            playTeachingStep(idx + 1, stepsList);
          }
        }, 1500);
      }
    });
  };

  const loadTeachingForQuestion = async (question, answer, simpler = false) => {
    voiceSynthesizer.unlock();
    setLoadingTeaching(true);
    setTeachingSteps([]);
    setCurrentTeachingStep(0);
    try {
      const steps = await runVisualTeacherAgent(question, answer, simpler);
      setTeachingSteps(steps);
      voiceSynthesizer.prefetch(steps.map((step) => step.speech));
      if (steps?.length > 0) {
        playTeachingStep(0, steps);
      }
    } catch (teachError) {
      console.error(teachError);
      const fallback = [
        {
          visual: '<div style="color:#ef4444;text-align:center;">Could not load teaching steps.</div>',
          speech: 'Sorry, I could not prepare the step-by-step lesson right now.',
        },
      ];
      setTeachingSteps(fallback);
      playTeachingStep(0, fallback);
    } finally {
      setLoadingTeaching(false);
    }
  };

  const startVisionTeaching = async (analysis) => {
    const questions = extractVisionTeachingQuestions(analysis);
    const answer = visionTeachingAnswerFor(analysis);
    setTeachingQuestions(questions);
    setCurrentQuestionIndex(0);
    setTeachingMode(true);
    await loadTeachingForQuestion(questions[0], answer, false);
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

  const handleNextQuestion = async () => {
    if (currentQuestionIndex >= teachingQuestions.length - 1) {
      resetTeaching();
      return;
    }
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    const answer = visionTeachingAnswerFor({ summary: 'Follow the worksheet solution.' });
    await loadTeachingForQuestion(teachingQuestions[nextIndex], answer, false);
  };

  const ensureConsent = () => {
    if (consentGiven) return true;
    setShowConsent(true);
    return false;
  };

  const startCamera = async () => {
    setError('');
    if (!ensureConsent()) {
      setPendingCameraStart(true);
      return;
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser. Upload an image file instead.');
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setSelectedFile(null);
      resetTeaching();
      setCameraActive(true);
    } catch (cameraError) {
      console.error(cameraError);
      const name = cameraError?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Allow camera access in browser settings, or upload an image.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('No camera was found on this device. Upload an image instead.');
      } else {
        setError('Could not open the camera. Upload an image or try another browser.');
      }
    }
  };

  const captureFromCamera = async () => {
    setError('');
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera is not ready yet. Please try again.');
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Failed to capture image from camera.');
          return;
        }
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        resetTeaching();
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  const onPickFile = (event) => {
    setError('');
    const file = event.target.files?.[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setSelectedFile(null);
      resetTeaching();
      setError(validation.message);
      return;
    }
    setSelectedFile(file);
    resetTeaching();
  };

  const retake = () => {
    stopCamera();
    setSelectedFile(null);
    resetTeaching();
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analyze = async () => {
    setError('');
    if (!studentId) {
      setError('Select a student profile before analysis.');
      return;
    }
    const validation = validateImageFile(selectedFile);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    try {
      setAnalyzing(true);
      resetTeaching();
      const base64Image = await fileToBase64(selectedFile);
      const response = await analyzeVisionImage({
        studentId,
        subject: activeSubject || null,
        topic: activeTopic || null,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        base64Image,
        imageFile: selectedFile,
        grade: activeGrade,
      });
      const attempts = await fetchRecentVisionAttempts({ studentId, limit: 6 });
      setRecentAttempts(attempts);
      await startVisionTeaching(response.analysis);
    } catch (analysisError) {
      console.error(analysisError);
      setError(analysisError.message || 'Could not analyze this image right now.');
    } finally {
      setAnalyzing(false);
    }
  };

  const currentQuestionLabel =
    teachingQuestions[currentQuestionIndex] || 'Worksheet problem';

  return (
    <section style={styles.wrapper} className="card-glass vision-panel">
      <ModelLoadProgress label="Preparing vision models" />
      {showConsent && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: '10px' }}>Camera and Privacy Notice</h3>
            <p style={styles.modalText}>
              Images are analyzed on your device with Transformers.js (OCR and vision). A copy is stored securely on
              the STEM Mind AI backend for teacher review.
            </p>
            <div style={styles.modalActions}>
              <button type="button" className="btn-secondary" onClick={() => setShowConsent(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  sessionStorage.setItem(CONSENT_SESSION_KEY, 'true');
                  setConsentGiven(true);
                  setShowConsent(false);
                  if (pendingCameraStart) {
                    setPendingCameraStart(false);
                    startCamera();
                  }
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.headerRow}>
        <h2 style={styles.title}>Photo Analyzer</h2>
        <span style={styles.contextBadge}>{contextLabel}</span>
      </div>

      <p style={styles.description}>
        Capture a worksheet or upload a photo. After analysis, Visual Teacher AI walks through each problem step by step
        with diagrams and voice narration.
      </p>

      {!teachingMode ? (
        <>
          <div style={styles.captureZone}>
            {cameraActive ? (
              <div style={styles.liveCamera}>
                <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
                <div style={styles.cameraActions}>
                  <button type="button" className="btn-primary" onClick={captureFromCamera}>
                    <Camera size={16} /> Capture
                  </button>
                  <button type="button" className="btn-secondary" onClick={stopCamera}>
                    <XCircle size={16} /> Cancel
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              <div style={styles.previewWrap}>
                <img src={previewUrl} alt="Captured preview" style={styles.previewImg} />
              </div>
            ) : (
              <div style={styles.placeholder}>
                <ShieldAlert size={18} />
                <span>Capture or upload a JPG / PNG / WEBP image (up to {formatBytes(MAX_IMAGE_SIZE_BYTES)}).</span>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <div style={styles.actionRow} className="vision-actions">
            <button type="button" className="btn-secondary" onClick={startCamera} disabled={cameraActive}>
              <Camera size={16} /> Open Camera
            </button>
            <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Upload Image
            </button>
            <button type="button" className="btn-secondary" onClick={retake} disabled={!selectedFile}>
              <RotateCcw size={16} /> Retake
            </button>
            <button type="button" className="btn-primary" onClick={analyze} disabled={!selectedFile || analyzing}>
              <ScanLine size={16} /> {analyzing ? 'Analyzing...' : 'Analyze & Teach'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={onPickFile}
          />
        </>
      ) : (
        <div style={styles.teachingCard} className="card-glass">
          <div style={styles.teachingHeader}>
            <h3 style={{ margin: 0 }}>Visual Teaching</h3>
            <div style={styles.teachingMeta}>
              <span>
                Problem {currentQuestionIndex + 1} of {teachingQuestions.length}
              </span>
              <label style={styles.autoPlayLabel}>
                <input
                  type="checkbox"
                  checked={autoPlayTeaching}
                  onChange={(event) => setAutoPlayTeaching(event.target.checked)}
                />
                <span>Autoplay steps</span>
              </label>
              <button type="button" className="btn-secondary" onClick={resetTeaching} style={{ padding: '6px 12px' }}>
                Back to capture
              </button>
            </div>
          </div>

          <p style={styles.questionPreview}>{currentQuestionLabel}</p>

          {loadingTeaching ? (
            <div style={styles.loadingTeaching}>
              <Brain size={40} className="glow-pulse" style={{ color: '#06b6d4', marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Visual Teacher AI is preparing your lesson...</p>
            </div>
          ) : (
            <>
              <div className="visual-canvas" style={styles.visualCanvas}>
                {teachingSteps[currentTeachingStep]?.visual ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: teachingSteps[currentTeachingStep].visual }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No visual for this step.</p>
                )}
              </div>

              <div style={styles.stepControls}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleTeachingStepPrev}
                  disabled={currentTeachingStep === 0}
                >
                  Previous
                </button>
                <span style={{ fontWeight: 600 }}>
                  Step {currentTeachingStep + 1} of {teachingSteps.length || 1}
                  {speakingStep ? ' · Speaking' : ''}
                </span>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleTeachingStepNext}
                  disabled={currentTeachingStep >= teachingSteps.length - 1}
                >
                  Next Step
                  <ArrowRight size={16} />
                </button>
              </div>

              <div style={styles.repeatRow}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (teachingSteps[currentTeachingStep]) {
                      voiceSynthesizer.speak(teachingSteps[currentTeachingStep].speech);
                    }
                  }}
                >
                  <Volume2 size={16} />
                  <span>Repeat narration</span>
                </button>
              </div>

              {currentTeachingStep === teachingSteps.length - 1 && teachingSteps.length > 0 && (
                <div style={styles.teachingFooter}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      loadTeachingForQuestion(
                        teachingQuestions[currentQuestionIndex],
                        visionTeachingAnswerFor({ summary: 'Simpler walkthrough.' }),
                        true
                      )
                    }
                  >
                    <RotateCcw size={16} />
                    <span>Explain simpler</span>
                  </button>
                  {currentQuestionIndex < teachingQuestions.length - 1 ? (
                    <button type="button" className="btn-primary" onClick={handleNextQuestion}>
                      <span>Next problem</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button type="button" className="btn-primary" onClick={resetTeaching}>
                      <span>Done — analyze another</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      <div style={styles.historyCard}>
        <h3 style={{ marginBottom: '8px' }}>Recent Vision Attempts</h3>
        {attemptsLoading ? (
          <p style={styles.subtleText}>Loading attempts...</p>
        ) : recentAttempts.length === 0 ? (
          <p style={styles.subtleText}>No attempts yet for this student.</p>
        ) : (
          <ul style={styles.historyList}>
            {recentAttempts.map((attempt) => (
              <li key={attempt.attemptId || attempt.createdAt} style={styles.historyItem} className="vision-history-item">
                <div>
                  <div style={{ fontWeight: 600 }}>{new Date(attempt.createdAt).toLocaleString()}</div>
                  <div style={styles.subtleText}>{attempt.analysis.summary || 'No summary'}</div>
                </div>
                <span style={styles.contextBadge}>{attempt.analysis.confidence}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const styles = {
  wrapper: { padding: '24px', marginTop: '24px', position: 'relative', width: '100%' },
  headerRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },
  title: { margin: 0, fontSize: '1.25rem' },
  description: { color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '16px' },
  contextBadge: {
    padding: '4px 10px',
    borderRadius: '100px',
    background: 'rgba(6, 182, 212, 0.12)',
    color: '#06b6d4',
    fontSize: '0.8rem',
  },
  captureZone: {
    border: '1px dashed var(--border-color)',
    borderRadius: '12px',
    minHeight: '260px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  liveCamera: { width: '100%' },
  video: { width: '100%', maxHeight: '420px', objectFit: 'cover' },
  cameraActions: { display: 'flex', gap: '10px', padding: '12px', justifyContent: 'center' },
  previewWrap: { width: '100%', display: 'flex', justifyContent: 'center', padding: '12px' },
  previewImg: { maxWidth: '100%', maxHeight: '420px', borderRadius: '8px' },
  placeholder: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', padding: '20px' },
  actionRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' },
  errorBox: {
    marginTop: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#ef4444',
    fontSize: '0.9rem',
  },
  teachingCard: { marginTop: '8px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px' },
  teachingHeader: { display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' },
  teachingMeta: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' },
  autoPlayLabel: { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  questionPreview: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
    lineHeight: 1.5,
    maxHeight: '4.5em',
    overflow: 'hidden',
  },
  loadingTeaching: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px' },
  visualCanvas: {
    minHeight: '200px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    padding: '16px',
    marginBottom: '16px',
    background: 'rgba(255,255,255,0.02)',
  },
  stepControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  repeatRow: { display: 'flex', justifyContent: 'center', marginTop: '14px' },
  teachingFooter: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  historyCard: { marginTop: '18px' },
  historyList: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '8px' },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  subtleText: { color: 'var(--text-muted)', fontSize: '0.85rem' },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
  },
  modal: {
    width: 'min(560px, 92vw)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '20px',
  },
  modalText: { color: 'var(--text-secondary)', lineHeight: 1.5 },
  modalActions: { marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
};
