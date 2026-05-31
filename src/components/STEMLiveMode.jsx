import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CameraOff, ClosedCaption, Menu, Mic, MicOff, Share2, Subtitles, Video, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import logoImg from '../assets/logo.png';
import {
  endStemLiveSession,
  heartbeatStemLiveSession,
  sendStemLiveTurn,
  startStemLiveSession,
} from '../services/stemLiveService';
import { analyzeLiveFrame, isWhisperReady, preloadVisionModels, transcribeAudioBlob } from '../ml/transformersClient';
import ModelLoadProgress from './ModelLoadProgress';
import voiceSynthesizer from '../utils/voiceSynthesizer';

const WELCOME_MAX_WORDS = 5;

const firstNameFrom = (name) => {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0] || 'there';
};

const clampLiveCaption = (text, maxWords = WELCOME_MAX_WORDS) => {
  const cleaned = String(text || '')
    .replace(/["'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.split(' ').filter(Boolean).slice(0, maxWords).join(' ');
};

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
  const [captionsOn, setCaptionsOn] = useState(true);
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
  const latestVisualContextRef = useRef(null);
  const frameAnalysisInFlightRef = useRef(false);
  const sttModeRef = useRef('webspeech');
  const sttRecorderRef = useRef(null);
  const sttChunksRef = useRef([]);
  const sttSpeakingRef = useRef(false);
  const sttSilenceTimerRef = useRef(0);
  const endingRef = useRef(false);
  const inFlightTurnRef = useRef(false);
  const queuedTranscriptRef = useRef('');
  const reconnectAttemptsRef = useRef(0);
  const isMicMutedRef = useRef(false);
  const processTurnRef = useRef(null);

  const context = useMemo(
    () => ({
      subject: activeSubject || null,
      topic: activeTopic || null,
      studentName: activeStudent?.name || 'Student',
    }),
    [activeStudent?.name, activeSubject, activeTopic]
  );

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const stopWhisperStt = () => {
    if (sttSilenceTimerRef.current) {
      window.clearTimeout(sttSilenceTimerRef.current);
      sttSilenceTimerRef.current = 0;
    }
    sttSpeakingRef.current = false;
    sttChunksRef.current = [];
    if (sttRecorderRef.current) {
      sttRecorderRef.current.ondataavailable = null;
      try {
        if (sttRecorderRef.current.state !== 'inactive') sttRecorderRef.current.stop();
      } catch {
        // ignore
      }
      sttRecorderRef.current = null;
    }
  };

  const flushWhisperChunk = async () => {
    const chunks = sttChunksRef.current;
    sttChunksRef.current = [];
    if (!chunks.length) return;
    const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });
    try {
      const text = await transcribeAudioBlob(blob);
      if (text.trim()) {
        setLastUserUtterance(text.trim());
        processTurnRef.current?.(text.trim());
      }
    } catch (err) {
      console.warn('Whisper transcription failed:', err);
    }
  };

  const setupWhisperStt = (stream) => {
    if (!stream || sttRecorderRef.current) return;
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) sttChunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      if (sttModeRef.current === 'whisper') flushWhisperChunk();
    };
    sttRecorderRef.current = recorder;
  };

  const handleWhisperVad = (normalized) => {
    if (sttModeRef.current !== 'whisper' || isMicMutedRef.current || endingRef.current) return;
    const recorder = sttRecorderRef.current;
    if (!recorder) return;

    if (normalized > 0.22) {
      if (!sttSpeakingRef.current) {
        sttSpeakingRef.current = true;
        sttChunksRef.current = [];
        if (recorder.state === 'inactive') {
          try {
            recorder.start(250);
          } catch {
            // ignore
          }
        }
        setStatus(STATES.listening);
      }
      if (sttSilenceTimerRef.current) {
        window.clearTimeout(sttSilenceTimerRef.current);
        sttSilenceTimerRef.current = 0;
      }
      return;
    }

    if (sttSpeakingRef.current && normalized < 0.12 && !sttSilenceTimerRef.current) {
      sttSilenceTimerRef.current = window.setTimeout(() => {
        sttSpeakingRef.current = false;
        sttSilenceTimerRef.current = 0;
        if (recorder.state === 'recording') {
          try {
            recorder.stop();
          } catch {
            // ignore
          }
        }
      }, 750);
    }
  };

  const stopRecognition = () => {
    if (!speechRecognitionRef.current) return;
    speechRecognitionRef.current.onresult = null;
    speechRecognitionRef.current.onerror = null;
    speechRecognitionRef.current.onend = null;
    try {
      speechRecognitionRef.current.stop();
    } catch {
      // ignore stop races
    }
    speechRecognitionRef.current = null;
  };

  const cleanupMic = () => {
    stopRecognition();
    stopWhisperStt();
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
    voiceSynthesizer.stop();
    speechActiveRef.current = false;
    setStatus((prev) => (prev === STATES.speaking ? STATES.idle : prev));
  };

  const resetVoiceLevel = () => {
    voiceLevelRef.current = 0;
    setVoiceLevel(0);
    if (dockPillRef.current) {
      dockPillRef.current.style.setProperty('--voice-level', '0');
    }
  };

  const monitorVoiceLevel = () => {
    if (isMicMutedRef.current) {
      resetVoiceLevel();
      rafRef.current = requestAnimationFrame(monitorVoiceLevel);
      return;
    }

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

    if (speechActiveRef.current && normalized > 0.2 && !isMicMutedRef.current) {
      stopSpeech();
      setStatus(STATES.listening);
    }
    handleWhisperVad(normalized);
    rafRef.current = requestAnimationFrame(monitorVoiceLevel);
  };

  const speakReply = (text) => {
    const trimmed = String(text || '').replace(/\s+/g, ' ').trim();
    if (!trimmed) return;
    voiceSynthesizer.unlock();
    stopSpeech();
    voiceSynthesizer.speak(
      trimmed,
      () => {
        speechActiveRef.current = false;
        setStatus((prev) => (prev === STATES.speaking ? STATES.idle : prev));
      },
      () => {
        speechActiveRef.current = true;
        setStatus(STATES.speaking);
      }
    );
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
        visualContext: isCameraOn ? latestVisualContextRef.current : null,
        clientState: {
          status,
          isMicMuted,
          isCameraOn,
          voiceLevel: Number(voiceLevel.toFixed(3)),
          sttMode: sttModeRef.current,
        },
      });
      const replyText = String(response.replyText || response.ttsText || '')
        .replace(/\s+/g, ' ')
        .trim();
      setLastReply(replyText);
      reconnectAttemptsRef.current = 0;
      speakReply(replyText || 'Listening.');
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

  useEffect(() => {
    processTurnRef.current = processTurn;
  }, [processTurn]);

  const initRecognition = () => {
    if (!SpeechRecognitionApi) return;
    if (isMicMutedRef.current || endingRef.current) return;
    stopRecognition();
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
      const code = event.error || 'unknown';
      const benign = ['no-speech', 'aborted', 'audio-capture'];
      if (benign.includes(code)) {
        if (!isMicMutedRef.current && !endingRef.current) {
          window.setTimeout(() => {
            try {
              recognition.start();
            } catch {
              // ignore restart races
            }
          }, 250);
        }
        return;
      }
      if (code === 'not-allowed') {
        setStatus(STATES.error);
        setError('MIC_PERMISSION_DENIED: Allow microphone access for speech recognition (Chrome recommended).');
        setMicPermission('denied');
        return;
      }
      setStatus(STATES.error);
      setError(`STT_ERROR_${code}: Speech recognition failed. Use Chrome over HTTPS and allow the microphone.`);
    };
    recognition.onend = () => {
      if (!isMicMutedRef.current && !endingRef.current && speechRecognitionRef.current === recognition) {
        window.setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // ignore restart races
          }
        }, 200);
      }
    };
    try {
      recognition.start();
      speechRecognitionRef.current = recognition;
      setStatus(STATES.listening);
    } catch {
      setStatus(STATES.error);
      setError('STT_START_FAILED: Could not start speech recognition. Try Chrome and reload.');
    }
  };

  const initSpeechInput = async (stream) => {
    const whisperReady = await isWhisperReady();
    if (whisperReady && !endingRef.current) {
      sttModeRef.current = 'whisper';
      setupWhisperStt(stream);
      setStatus(STATES.listening);
      return;
    }
    sttModeRef.current = 'webspeech';
    if (recognitionSupported) {
      initRecognition();
    } else {
      setStatus(STATES.error);
      setError('STT_UNSUPPORTED: Speech recognition requires Chrome, Edge, or Safari over HTTPS.');
    }
  };

  const startMicrophone = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setStatus(STATES.error);
      setError('MIC_UNSUPPORTED: Microphone access is not available in this browser.');
      setMicPermission('denied');
      return;
    }
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
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      mediaAnalyserRef.current = analyser;
      mediaDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      monitorVoiceLevel();
      setMicPermission('granted');
      await initSpeechInput(stream);
    } catch (micError) {
      const name = micError?.name || '';
      setStatus(STATES.error);
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('MIC_PERMISSION_DENIED: Allow microphone access in browser settings for STEM Live.');
      } else {
        setError('MIC_START_FAILED: Could not open the microphone. Check permissions and try again.');
      }
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

    const framePayload = latestFrameRef.current;
    if (!frameAnalysisInFlightRef.current && framePayload.base64Data) {
      frameAnalysisInFlightRef.current = true;
      analyzeLiveFrame(framePayload.base64Data, framePayload.mimeType)
        .then((ctx) => {
          latestVisualContextRef.current = ctx;
        })
        .catch(() => undefined)
        .finally(() => {
          frameAnalysisInFlightRef.current = false;
        });
    }
  };

  const startCamera = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setIsCameraOn(false);
      setCameraPermission('denied');
      setError('CAMERA_UNSUPPORTED: Camera is not available in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      cameraStreamRef.current = stream;
      frameTimerRef.current = window.setInterval(captureFrame, FRAME_INTERVAL_MS);
      setIsCameraOn(true);
      setCameraPermission('granted');
    } catch (cameraError) {
      setIsCameraOn(false);
      setCameraPermission('denied');
      const name = cameraError?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('CAMERA_PERMISSION_DENIED: Allow camera access in browser settings, or continue voice-only.');
      } else {
        setError('CAMERA_START_FAILED: Could not open the camera. Continuing voice-only.');
      }
    }
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      cleanupCamera();
      setIsCameraOn(false);
      return;
    }
    await startCamera();
  };

  const toggleMic = async () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      isMicMutedRef.current = false;
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume().catch(() => undefined);
      }
      if (!micStreamRef.current) {
        await startMicrophone();
        return;
      }
      if (sttModeRef.current === 'webspeech') {
        initRecognition();
      } else {
        setStatus(STATES.listening);
      }
      return;
    }
    setIsMicMuted(true);
    isMicMutedRef.current = true;
    stopRecognition();
    stopWhisperStt();
    resetVoiceLevel();
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
    preloadVisionModels();
    const init = async () => {
      try {
        if (!activeStudent?.id) throw new Error('No active student selected.');
        const session = await startStemLiveSession({
          studentId: activeStudent.id,
          context,
        });
        setSessionId(session.sessionId);
        if (session.welcomeMessage) {
          setWelcomeMessage(clampLiveCaption(session.welcomeMessage));
        }
        await startMicrophone();
        voiceSynthesizer.unlock();
        if (session.welcomeMessage) {
          speakReply(clampLiveCaption(session.welcomeMessage));
        }
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

  useEffect(() => {
    const unlockTts = () => voiceSynthesizer.unlock();
    window.addEventListener('pointerdown', unlockTts, { once: true, passive: true });
    window.addEventListener('keydown', unlockTts, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockTts);
      window.removeEventListener('keydown', unlockTts);
    };
  }, []);

  useEffect(() => {
    if (!isCameraOn || !cameraStreamRef.current || !videoRef.current) return undefined;
    const video = videoRef.current;
    video.srcObject = cameraStreamRef.current;
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        setError('CAMERA_PREVIEW_FAILED: Could not start camera preview. Toggle camera off and on.');
      });
    }
    return undefined;
  }, [isCameraOn]);

  const studentFirstName = firstNameFrom(activeStudent?.name);
  const defaultWelcome = booting ? 'Connecting...' : `Ready, ${studentFirstName}.`;
  const heroWelcome = clampLiveCaption(welcomeMessage || defaultWelcome, WELCOME_MAX_WORDS);
  const captionAiLine = lastReply.trim();
  const captionUserLine = lastUserUtterance.trim();
  const dockVoiceLevel = isMicMuted ? 0 : voiceLevel;
  const dockPillClass = [
    'stem-live-dock-pill',
    isMicMuted ? 'stem-live-dock-pill--inactive' : 'stem-live-dock-pill--active',
  ].join(' ');
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
      <ModelLoadProgress label="Loading STEM Live models" />
      <div className="stem-live-vignette" />
      <header className="stem-live-topbar">
        <button type="button" className="live-icon-btn" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <button
          type="button"
          className={`live-icon-btn ${captionsOn ? 'is-on' : ''}`}
          onClick={() => setCaptionsOn((prev) => !prev)}
          aria-label={captionsOn ? 'Turn captions off' : 'Turn captions on'}
          aria-pressed={captionsOn}
          title={captionsOn ? 'Captions on' : 'Captions off'}
        >
          {captionsOn ? <ClosedCaption size={20} /> : <Subtitles size={20} />}
        </button>
      </header>

      <main className="stem-live-center">
        <img src={logoImg} alt="STEM Mind AI" className="live-brand-logo" />
        {captionsOn ? (
          <div className="live-caption-stack" aria-live="polite">
            {captionUserLine ? <p className="live-caption-user">You: {captionUserLine}</p> : null}
            {captionAiLine ? <p className="live-caption-text">STEM Mind: {captionAiLine}</p> : null}
            {!captionUserLine && !captionAiLine && error ? (
              <p className="live-caption-text live-caption-error">{error}</p>
            ) : null}
          </div>
        ) : (
          <p className="live-main-text">{heroWelcome}</p>
        )}
        <div className={`live-camera-preview-wrap ${isCameraOn ? '' : 'is-hidden'}`}>
          <video ref={videoRef} autoPlay playsInline muted className="live-camera-preview" />
          {isCameraOn ? <span className="live-camera-badge">Visual intelligence on</span> : null}
        </div>
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
          className={dockPillClass}
          style={{ '--voice-level': dockVoiceLevel }}
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
