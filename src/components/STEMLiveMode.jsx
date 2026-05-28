import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, AlertTriangle, LoaderCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  endStemLiveSession,
  heartbeatStemLiveSession,
  sendStemLiveTurn,
  startStemLiveSession,
} from '../services/stemLiveService';

const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
const FRAME_INTERVAL_MS = 1400;
const HEARTBEAT_INTERVAL_MS = 12000;
const MAX_RECONNECT_ATTEMPTS = 2;

const STATES = {
  idle: 'idle',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'speaking',
  disconnected: 'disconnected',
  error: 'error',
};

export default function STEMLiveMode() {
  const { activeStudent, activeSubject, activeTopic, setLiveModeActive } = useApp();
  const [status, setStatus] = useState(STATES.idle);
  const [error, setError] = useState('');
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [micPermission, setMicPermission] = useState('pending');
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [sessionId, setSessionId] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [lastUserUtterance, setLastUserUtterance] = useState('');
  const [visionStatus, setVisionStatus] = useState('Visual context disabled');
  const [metrics, setMetrics] = useState({ provider: '-', latencyMs: 0, turnCount: 0 });
  const [recognitionSupported] = useState(Boolean(SpeechRecognitionApi));
  const [booting, setBooting] = useState(true);

  const speechActiveRef = useRef(false);
  const speechRecognitionRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mediaAnalyserRef = useRef(null);
  const mediaDataRef = useRef(null);
  const rafRef = useRef(0);
  const videoRef = useRef(null);
  const frameTimerRef = useRef(0);
  const heartbeatTimerRef = useRef(0);
  const latestFrameRef = useRef(null);
  const endingRef = useRef(false);
  const inFlightTurnRef = useRef(false);
  const queuedTranscriptRef = useRef('');
  const reconnectAttemptsRef = useRef(0);

  const context = useMemo(
    () => ({
      subject: activeSubject || null,
      topic: activeTopic || null,
      studentName: activeStudent?.name || 'Student',
    }),
    [activeStudent?.name, activeSubject, activeTopic]
  );

  const cleanupMic = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.onresult = null;
      speechRecognitionRef.current.onerror = null;
      speechRecognitionRef.current.onend = null;
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  };

  const cleanupCamera = () => {
    if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    frameTimerRef.current = 0;
    latestFrameRef.current = null;
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const cleanupHeartbeat = () => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = 0;
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    speechActiveRef.current = false;
    setStatus((prev) => (prev === STATES.speaking ? STATES.idle : prev));
  };

  const monitorVoiceLevel = () => {
    const analyser = mediaAnalyserRef.current;
    const data = mediaDataRef.current;
    if (!analyser || !data) return;
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const norm = (data[i] - 128) / 128;
      sum += norm * norm;
    }
    const rms = Math.sqrt(sum / data.length);
    const normalized = Math.min(1, rms * 5.5);
    setVoiceLevel((prev) => prev * 0.7 + normalized * 0.3);

    if (speechActiveRef.current && normalized > 0.18 && !isMicMuted) {
      stopSpeech();
      setStatus(STATES.listening);
    }
    rafRef.current = requestAnimationFrame(monitorVoiceLevel);
  };

  const speakReply = (text) => {
    if (!text) return;
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => {
      speechActiveRef.current = true;
      setStatus(STATES.speaking);
    };
    utterance.onend = () => {
      speechActiveRef.current = false;
      setStatus((prev) => (prev === STATES.speaking ? STATES.idle : prev));
    };
    utterance.onerror = () => {
      speechActiveRef.current = false;
      setStatus(STATES.error);
      setError('VOICE_SYNTHESIS_FAILED: Unable to play AI voice response.');
    };
    speechSynthesis.speak(utterance);
  };

  const processTurn = useCallback(async (transcript) => {
    if (!sessionId || !transcript.trim()) return;
    if (inFlightTurnRef.current) {
      queuedTranscriptRef.current = transcript.trim();
      return;
    }
    inFlightTurnRef.current = true;
    setStatus(STATES.thinking);
    setError('');
    try {
      const response = await sendStemLiveTurn({
        sessionId,
        transcript: transcript.trim(),
        context,
        visionFrame: isCameraOn ? latestFrameRef.current : null,
        clientState: {
          status,
          isMicMuted,
          isCameraOn,
          voiceLevel: Number(voiceLevel.toFixed(3)),
        },
      });
      setLastReply(response.replyText || '');
      setVisionStatus(response.visionSummary || (isCameraOn ? 'Visual context active' : 'Visual context disabled'));
      setMetrics((prev) => ({
        provider: response.provider || prev.provider,
        latencyMs: Number(response.latencyMs || response._clientLatencyMs || 0),
        turnCount: prev.turnCount + 1,
      }));
      reconnectAttemptsRef.current = 0;
      speakReply(response.replyText || 'I am here and listening.');
    } catch (turnError) {
      const message = turnError.message || 'TURN_FAILED: Could not process STEM Live turn.';
      const isNetwork = /timeout|network|fetch|connection/i.test(message);
      if (isNetwork && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        setStatus(STATES.disconnected);
        setError(`Connection dropped. Reconnecting (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
        window.setTimeout(() => processTurn(transcript), 800 * reconnectAttemptsRef.current);
      } else {
        setStatus(STATES.error);
        setError(message);
      }
    } finally {
      inFlightTurnRef.current = false;
      if (queuedTranscriptRef.current) {
        const queued = queuedTranscriptRef.current;
        queuedTranscriptRef.current = '';
        processTurn(queued);
      }
    }
  }, [context, isCameraOn, isMicMuted, sessionId, status, voiceLevel]);

  const initRecognition = () => {
    if (!SpeechRecognitionApi || isMicMuted) return;
    const recognition = new SpeechRecognitionApi();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result?.[0]?.transcript || '';
      if (!transcript.trim()) return;
      setLastUserUtterance(transcript.trim());
      if (result.isFinal) {
        processTurn(transcript.trim());
      } else {
        setStatus(STATES.listening);
      }
    };
    recognition.onerror = (event) => {
      setStatus(STATES.error);
      setError(`STT_ERROR_${event.error || 'unknown'}: Speech recognition failed.`);
    };
    recognition.onend = () => {
      if (!isMicMuted && !endingRef.current) {
        recognition.start();
      }
    };
    recognition.start();
    speechRecognitionRef.current = recognition;
  };

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      mediaAnalyserRef.current = analyser;
      mediaDataRef.current = new Uint8Array(analyser.fftSize);
      monitorVoiceLevel();
      initRecognition();
      setStatus(STATES.idle);
      setMicPermission('granted');
    } catch {
      setStatus(STATES.error);
      setError('MIC_PERMISSION_DENIED: Microphone permission is required for STEM Live.');
      setMicPermission('denied');
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    latestFrameRef.current = {
      mimeType: 'image/jpeg',
      base64Data: dataUrl.split(',')[1] || '',
      capturedAt: new Date().toISOString(),
    };
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      frameTimerRef.current = window.setInterval(captureFrame, FRAME_INTERVAL_MS);
      setIsCameraOn(true);
      setCameraPermission('granted');
      setVisionStatus('Visual context active');
    } catch {
      setIsCameraOn(false);
      setCameraPermission('denied');
      setVisionStatus('Visual context blocked');
      setError('CAMERA_PERMISSION_DENIED: Camera access blocked, continuing voice-only.');
    }
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      cleanupCamera();
      setIsCameraOn(false);
      setVisionStatus('Visual context disabled');
      return;
    }
    await startCamera();
  };

  const toggleMic = () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      initRecognition();
      return;
    }
    setIsMicMuted(true);
    if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
    setStatus(STATES.idle);
  };

  const closeLive = async () => {
    endingRef.current = true;
    stopSpeech();
    cleanupMic();
    cleanupCamera();
    cleanupHeartbeat();
    if (sessionId) {
      try {
        await endStemLiveSession({ sessionId });
      } catch {
        // do not block close on network failures
      }
    }
    setLiveModeActive(false);
  };

  const startHeartbeat = useCallback(() => {
    cleanupHeartbeat();
    heartbeatTimerRef.current = window.setInterval(async () => {
      if (!sessionId || endingRef.current) return;
      try {
        await heartbeatStemLiveSession({
          sessionId,
          clientState: {
            status,
            isMicMuted,
            isCameraOn,
            voiceLevel: Number(voiceLevel.toFixed(3)),
          },
        });
      } catch {
        if (!endingRef.current) {
          setStatus(STATES.disconnected);
          setError('Realtime heartbeat lost. Trying to recover...');
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [isCameraOn, isMicMuted, sessionId, status, voiceLevel]);

  useEffect(() => {
    const init = async () => {
      try {
        if (!activeStudent?.id) throw new Error('No active student selected.');
        const session = await startStemLiveSession({
          studentId: activeStudent.id,
          context,
        });
        setSessionId(session.sessionId);
        await startMicrophone();
        startHeartbeat();
      } catch (sessionError) {
        setStatus(STATES.error);
        setError(sessionError.message || 'SESSION_START_FAILED');
      } finally {
        setBooting(false);
      }
    };
    init();
    return () => {
      endingRef.current = true;
      stopSpeech();
      cleanupMic();
      cleanupCamera();
      cleanupHeartbeat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessionId) startHeartbeat();
  }, [sessionId, startHeartbeat]);

  const stateLabel = {
    [STATES.idle]: 'Ready',
    [STATES.listening]: 'Listening',
    [STATES.thinking]: 'Thinking',
    [STATES.speaking]: 'Speaking',
    [STATES.disconnected]: 'Reconnecting',
    [STATES.error]: 'Error',
  }[status];

  const permissionSummary = `Mic: ${micPermission} · Camera: ${cameraPermission}`;

  return (
    <div className={`stem-live-screen state-${status}`}>
      <div className="stem-live-overlay" />
      <header className="stem-live-header">
        <div>
          <div className="stem-live-title">STEM Live</div>
          <div className="stem-live-subtitle">
            {activeStudent?.name} - {activeSubject || 'General STEM'} {activeTopic ? `- ${activeTopic}` : ''}
          </div>
        </div>
        <div className="stem-live-status">
          <span className="status-dot" />
          <span>{booting ? 'Booting...' : stateLabel}</span>
        </div>
      </header>

      <main className="stem-live-main">
        <div
          className="voice-blob"
          style={{
            transform: `scale(${1 + voiceLevel * 0.45})`,
          }}
        />
        <p className="stem-live-last">
          {lastReply || 'Start speaking naturally. STEM Live will listen and respond in voice.'}
        </p>
        <p className="stem-live-last-user">{lastUserUtterance ? `You: ${lastUserUtterance}` : ''}</p>
        <p className="stem-live-meta">
          {permissionSummary} · Provider: {metrics.provider} · Latency: {metrics.latencyMs}ms · Turns: {metrics.turnCount}
        </p>
        {error ? (
          <div className="stem-live-error">
            {status === STATES.disconnected ? <LoaderCircle size={16} className="spin" /> : <AlertTriangle size={16} />}
            <span>{error}</span>
          </div>
        ) : null}
        <div className="stem-live-vision">
          <span>{visionStatus}</span>
          <video ref={videoRef} autoPlay playsInline muted className={isCameraOn ? 'preview-on' : 'preview-off'} />
        </div>
        {!recognitionSupported && (
          <div className="stem-live-error">
            <AlertTriangle size={16} />
            <span>Speech recognition is not supported in this browser. Use a Chromium-based browser.</span>
          </div>
        )}
        <p className="stem-live-guardrail">
          STEM Live prioritizes age-appropriate explanations and will avoid unsafe or harmful guidance.
        </p>
      </main>

      <footer className="stem-live-controls">
        <button className={`live-control ${isCameraOn ? 'is-on' : ''}`} onClick={toggleCamera} aria-label="Toggle camera">
          {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
          <span>{isCameraOn ? 'Camera On' : 'Camera Off'}</span>
        </button>
        <button className={`live-control ${!isMicMuted ? 'is-on' : ''}`} onClick={toggleMic} aria-label="Toggle microphone">
          {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
          <span>{isMicMuted ? 'Mic Muted' : 'Mic Live'}</span>
        </button>
        <button className="live-control danger" onClick={closeLive} aria-label="End live mode">
          <PhoneOff size={20} />
          <span>End</span>
        </button>
      </footer>
    </div>
  );
}
