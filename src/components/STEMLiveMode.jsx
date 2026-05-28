import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraOff, Menu, Mic, MicOff, Share2, Video, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import logoImg from '../assets/logo.png';
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
const EXIT_ANIMATION_MS = 420;

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
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [lastUserUtterance, setLastUserUtterance] = useState('');
  const [visionStatus, setVisionStatus] = useState('Visual context disabled');
  const [recognitionSupported] = useState(Boolean(SpeechRecognitionApi));
  const [booting, setBooting] = useState(true);
  const [isEntering, setIsEntering] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const speechActiveRef = useRef(false);
  const speechRecognitionRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mediaAnalyserRef = useRef(null);
  const mediaDataRef = useRef(null);
  const rafRef = useRef(0);
  const videoRef = useRef(null);
  const dockPillRef = useRef(null);
  const voiceLevelRef = useRef(0);
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

    analyser.getByteFrequencyData(data);
    let sum = 0;
    const voiceBins = Math.min(48, data.length);
    for (let i = 0; i < voiceBins; i += 1) {
      sum += data[i];
    }
    const average = sum / voiceBins / 255;
    const normalized = Math.min(1, Math.pow(average, 0.72) * 2.4);
    const smoothed = voiceLevelRef.current * 0.62 + normalized * 0.38;
    voiceLevelRef.current = smoothed;
    setVoiceLevel(smoothed);
    if (dockPillRef.current) {
      dockPillRef.current.style.setProperty('--voice-level', smoothed.toFixed(3));
    }

    if (speechActiveRef.current && normalized > 0.2 && !isMicMuted) {
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
      reconnectAttemptsRef.current = 0;
      speakReply(response.replyText || 'I am here and listening.');
    } catch (turnError) {
      const message = turnError.message || 'TURN_FAILED: Could not process STEM Live turn.';
      const isNetwork = /timeout|network|fetch|connection|cors/i.test(message);
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
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      mediaAnalyserRef.current = analyser;
      mediaDataRef.current = new Uint8Array(analyser.frequencyBinCount);
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
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

  const finishClose = async () => {
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

  const closeLive = async () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      finishClose();
    }, EXIT_ANIMATION_MS);
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
        if (session.welcomeMessage) {
          setWelcomeMessage(session.welcomeMessage);
        }
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
    const enterTimer = window.setTimeout(() => setIsEntering(false), 40);
    return () => {
      window.clearTimeout(enterTimer);
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

  const centerMessage =
    lastReply ||
    welcomeMessage ||
    (booting ? 'Connecting you to STEM Live...' : `Ready when you are, ${activeStudent?.name || 'student'}.`);
  const canUseMic = !booting && recognitionSupported && micPermission !== 'denied';
  const screenClass = [
    'stem-live-screen',
    `state-${status}`,
    isEntering ? 'is-entering' : 'is-entered',
    isClosing ? 'is-exiting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={screenClass}>
      <div className="stem-live-vignette" />
      <header className="stem-live-topbar">
        <button type="button" className="live-icon-btn" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <button
          type="button"
          className={`live-icon-btn ${isCameraOn ? 'is-on' : ''}`}
          onClick={toggleCamera}
          aria-label="Toggle camera"
          title={isCameraOn ? 'Camera On' : 'Camera Off'}
        >
          {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
        </button>
      </header>

      <main className="stem-live-center">
        <img src={logoImg} alt="STEM Mind AI" className="live-brand-logo" />
        <p className="live-main-text">{centerMessage}</p>
        <p className="live-sub-text">
          {booting ? 'Starting STEM Live...' : error || visionStatus}
        </p>
        <p className="live-sub-text">{lastUserUtterance ? `You said: ${lastUserUtterance}` : ''}</p>
        {isCameraOn ? (
          <div className="live-camera-preview-wrap">
            <video ref={videoRef} autoPlay playsInline muted className="live-camera-preview" />
            <span className="live-camera-badge">Visual intelligence on</span>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="live-hidden-preview" />
        )}
      </main>

      <footer className="stem-live-bottom">
        <button type="button" className={`live-control-btn ${isCameraOn ? 'is-on' : ''}`} onClick={toggleCamera} aria-label="Toggle camera">
          {isCameraOn ? <Video size={20} /> : <CameraOff size={20} />}
        </button>
        <button type="button" className="live-control-btn" aria-label="Share">
          <Share2 size={18} />
        </button>
        <div
          ref={dockPillRef}
          className="stem-live-dock-pill"
          style={{ '--voice-level': voiceLevel }}
          aria-hidden="true"
        />
        <button
          type="button"
          className={`live-control-btn ${canUseMic && !isMicMuted ? 'is-on' : ''}`}
          onClick={toggleMic}
          aria-label="Toggle microphone"
        >
          {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button type="button" className="live-control-btn danger" onClick={closeLive} aria-label="End live mode">
          <X size={20} />
        </button>
      </footer>
    </div>
  );
}
