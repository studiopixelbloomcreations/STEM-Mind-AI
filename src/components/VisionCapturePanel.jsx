import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Upload, RotateCcw, ShieldAlert, ScanLine, XCircle } from 'lucide-react';
import { analyzeVisionImage, fetchRecentVisionAttempts } from '../services/visionService';
import { fileToBase64, formatBytes, MAX_IMAGE_SIZE_BYTES, validateImageFile } from '../utils/visionValidation';
import { useApp } from '../context/AppContext';

const CONSENT_SESSION_KEY = 'vision-camera-consent-v1';

export default function VisionCapturePanel() {
  const { activeStudent, activeSubject, activeTopic } = useApp();
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [showConsent, setShowConsent] = useState(false);
  const [consentGiven, setConsentGiven] = useState(() => sessionStorage.getItem(CONSENT_SESSION_KEY) === 'true');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const studentId = activeStudent?.id || null;

  const contextLabel = useMemo(() => {
    if (!activeSubject && !activeTopic) return 'General worksheet analysis';
    return `${activeSubject || 'General'}${activeTopic ? ` - ${activeTopic}` : ''}`;
  }, [activeSubject, activeTopic]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

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

  const ensureConsent = () => {
    if (consentGiven) return true;
    setShowConsent(true);
    return false;
  };

  const startCamera = async () => {
    setError('');
    if (!ensureConsent()) return;
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser. Upload an image file instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (cameraError) {
      console.error(cameraError);
      setError('Camera permission was denied. You can still upload an image from device.');
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
        setResult(null);
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
      setResult(null);
      setError(validation.message);
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const retake = () => {
    setSelectedFile(null);
    setResult(null);
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
      const base64Image = await fileToBase64(selectedFile);
      const response = await analyzeVisionImage({
        studentId,
        subject: activeSubject || null,
        topic: activeTopic || null,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        base64Image,
      });
      setResult(response);
      const attempts = await fetchRecentVisionAttempts({ studentId, limit: 6 });
      setRecentAttempts(attempts);
    } catch (analysisError) {
      console.error(analysisError);
      setError(analysisError.message || 'Could not analyze this image right now.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section style={styles.wrapper} className="card-glass">
      {showConsent && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: '10px' }}>Camera and Privacy Notice</h3>
            <p style={styles.modalText}>
              Captured images are sent to the STEM Mind AI secure backend for OCR and analysis. Images are stored in
              a private bucket and linked to the current student profile for teacher review.
            </p>
            <div style={styles.modalActions}>
              <button className="btn-secondary" onClick={() => setShowConsent(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  sessionStorage.setItem(CONSENT_SESSION_KEY, 'true');
                  setConsentGiven(true);
                  setShowConsent(false);
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.headerRow}>
        <h2 style={styles.title}>Camera + Vision Analysis</h2>
        <span style={styles.contextBadge}>{contextLabel}</span>
      </div>

      <p style={styles.description}>
        Capture a worksheet, whiteboard, or handwritten answer. The model extracts text, builds structured guidance,
        and logs attempts for this student.
      </p>

      <div style={styles.captureZone}>
        {cameraActive ? (
          <div style={styles.liveCamera}>
            <video ref={videoRef} autoPlay playsInline style={styles.video} />
            <div style={styles.cameraActions}>
              <button className="btn-primary" onClick={captureFromCamera}>
                <Camera size={16} /> Capture
              </button>
              <button className="btn-secondary" onClick={stopCamera}>
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
        <button className="btn-secondary" onClick={startCamera} disabled={cameraActive}>
          <Camera size={16} /> Open Camera
        </button>
        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} /> Upload Image
        </button>
        <button className="btn-secondary" onClick={retake} disabled={!selectedFile && !result}>
          <RotateCcw size={16} /> Retake
        </button>
        <button className="btn-primary" onClick={analyze} disabled={!selectedFile || analyzing}>
          <ScanLine size={16} /> {analyzing ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={onPickFile}
      />

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      {result ? (
        <div style={styles.resultCard}>
          <h3 style={{ marginBottom: '8px' }}>Latest Analysis</h3>
          <div style={styles.metaRow} className="vision-meta">
            <span>Confidence: {result.analysis.confidence}%</span>
            <span>Provider: {result.analysis.provider}</span>
          </div>
          <p style={styles.summary}>{result.analysis.summary || 'No summary provided.'}</p>
          <h4>Extracted Text</h4>
          <pre style={styles.extractedText}>{result.analysis.extractedText || 'No text detected.'}</pre>
          {result.analysis.warnings.length > 0 && (
            <>
              <h4>Warnings</h4>
              <ul style={styles.list}>
                {result.analysis.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </>
          )}
          <h4>Structured Steps</h4>
          <ol style={styles.list}>
            {result.analysis.structuredSteps.map((step, index) => (
              <li key={`${step.title}-${index}`}>
                <strong>{step.title}:</strong> {step.explanation}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

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
  wrapper: { padding: '24px', marginTop: '24px', position: 'relative' },
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
  resultCard: { marginTop: '20px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' },
  metaRow: { display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '10px' },
  summary: { marginBottom: '10px' },
  extractedText: {
    whiteSpace: 'pre-wrap',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '0.85rem',
  },
  list: { marginTop: '6px', marginBottom: '10px', paddingLeft: '20px' },
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
