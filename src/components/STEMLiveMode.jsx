import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CameraOff, ClosedCaption, Menu, Mic, MicOff, Share2, Subtitles, Video, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import logoImg from '../assets/logo.png';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { geminiLiveService } from '../services/geminiLiveService';
import ModelLoadProgress from './ModelLoadProgress';

const WELCOME_MAX_WORDS = 8;
const FRAME_INTERVAL_MS = 1400; // Throttled webcam snapshot interval
const EXIT_ANIMATION_MS = 420;

const STATES = {
  idle: 'idle',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'speaking',
  disconnected: 'disconnected',
  error: 'error',
};

// Downsampler utility to convert native microphone rates to 16kHz PCM required by Gemini
function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

export default function STEMLiveMode() {
  const { activeStudent, activeSubject, activeTopic, setLiveModeActive } = useApp();
  const [status, setStatus] = useState(STATES.idle);
  const [error, setError] = useState('');
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [micPermission, setMicPermission] = useState('pending');
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [lastUserUtterance, setLastUserUtterance] = useState('');
  const [captionsOn, setCaptionsOn] = useState(true);
  const [booting, setBooting] = useState(true);
  const [isEntering, setIsEntering] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Refs for audio capturing/processing
  const audioContextRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const micStreamRef = useRef(null);
  const isMicMutedRef = useRef(false);

  // Refs for camera/canvas rendering
  const cameraStreamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameTimerRef = useRef(0);
  const isVideoOnRef = useRef(false);

  // Hand tracking refs
  const handLandmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  // UI display refs
  const dockPillRef = useRef(null);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    isVideoOnRef.current = isCameraOn;
  }, [isCameraOn]);

  const cleanupMic = () => {
    if (audioProcessorRef.current) {
      try {
        audioProcessorRef.current.disconnect();
      } catch (e) {}
      audioProcessorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setVoiceLevel(0);
  };

  const cleanupCamera = () => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = 0;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    isVideoOnRef.current = false;
  };

  const startMicrophone = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setStatus(STATES.error);
      setError('Microphone access is not supported by your browser.');
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
      setMicPermission('granted');

      // Hook up Gemini Live socket streaming
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      // ScriptProcessorNode handles chunk extraction
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      audioProcessorRef.current = processor;
      
      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isMicMutedRef.current || !geminiLiveService.isConnected) {
          setVoiceLevel(0);
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate simple volume level for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const level = Math.min(1, rms * 4);
        setVoiceLevel(level);
        if (dockPillRef.current) {
          dockPillRef.current.style.setProperty('--voice-level', level.toFixed(3));
        }

        // Downsample input data to 16kHz
        const downsampled = downsampleBuffer(inputData, audioCtx.sampleRate, 16000);
        const int16Array = new Int16Array(downsampled.length);
        for (let i = 0; i < downsampled.length; i++) {
          int16Array[i] = Math.max(-32768, Math.min(32767, downsampled[i] * 32768));
        }

        // Stream raw audio to Gemini Live API
        geminiLiveService.sendAudioChunk(int16Array);
      };

    } catch (micError) {
      console.error('Microphone initialization failed:', micError);
      setStatus(STATES.error);
      setError('Allow microphone access in browser settings to start.');
      setMicPermission('denied');
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0 || !isCameraOn) return;
    
    // Draw frame to a hidden canvas to extract resized JPEG data
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw mirrored to match local display canvas
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    const base64Data = dataUrl.split(',')[1] || '';
    
    if (geminiLiveService.isConnected && base64Data) {
      geminiLiveService.sendVideoFrame(base64Data);
    }
  };

  const startCamera = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setIsCameraOn(false);
      setCameraPermission('denied');
      setError('Camera access is not supported by your browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      cameraStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOn(true);
      isVideoOnRef.current = true;
      setCameraPermission('granted');
      
      // Start throttled frame capture
      frameTimerRef.current = window.setInterval(captureFrame, FRAME_INTERVAL_MS);

      // Start the canvas rendering and landmark prediction loop
      requestAnimationFrame(predictWebcam);
    } catch (cameraError) {
      console.error('Camera initialization failed:', cameraError);
      setIsCameraOn(false);
      setCameraPermission('denied');
      setError('Could not access camera. Continuing voice-only.');
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

  const toggleMic = () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      isMicMutedRef.current = false;
      setStatus(STATES.listening);
    } else {
      setIsMicMuted(true);
      isMicMutedRef.current = true;
      setVoiceLevel(0);
      setStatus(STATES.idle);
    }
  };

  const closeLive = () => {
    if (isClosing) return;
    setIsClosing(true);
    geminiLiveService.disconnect();
    cleanupMic();
    cleanupCamera();
    window.setTimeout(() => {
      setLiveModeActive(false);
    }, EXIT_ANIMATION_MS);
  };

  const initHandLandmarker = async () => {
    try {
      console.log('Initializing MediaPipe HandLandmarker...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });
      console.log('MediaPipe HandLandmarker loaded successfully.');
    } catch (e) {
      console.error('Failed to initialize HandLandmarker:', e);
    }
  };

  const predictWebcam = () => {
    if (!videoRef.current || !canvasRef.current || !isVideoOnRef.current) return;

    if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      requestAnimationFrame(predictWebcam);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
    }

    // Mirror image for a natural look
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const startTimeMs = performance.now();
    if (handLandmarkerRef.current && videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
      }
    }

    if (isVideoOnRef.current) {
      requestAnimationFrame(predictWebcam);
    }
  };

  const drawSkeleton = (ctx, landmarks, width, height) => {
    ctx.strokeStyle = '#22d3ee'; // cyan-400
    ctx.lineWidth = 3;
    ctx.fillStyle = '#06b6d4'; // cyan-500

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17] // Palm
    ];

    // Draw connection lines
    for (const [start, end] of connections) {
      const ptStart = landmarks[start];
      const ptEnd = landmarks[end];
      if (ptStart && ptEnd) {
        const xStart = (1 - ptStart.x) * width;
        const yStart = ptStart.y * height;
        const xEnd = (1 - ptEnd.x) * width;
        const yEnd = ptEnd.y * height;

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
      }
    }

    // Draw joints
    for (const landmark of landmarks) {
      const x = (1 - landmark.x) * width;
      const y = landmark.y * height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Load MediaPipe hand model first
        await initHandLandmarker();

        const studentName = activeStudent?.name || 'Student';
        const subject = activeSubject || 'STEM';
        const topic = activeTopic || 'General STEM';

        // Connect directly to the Gemini Live WebSockets API
        const sysInstruction = 
          `You are a friendly, warm, and highly pedagogical STEM teacher named STEMMind. ` +
          `Your student is ${studentName}. You are talking about ${topic} in ${subject}. ` +
          `Ground your descriptions in whatever items they show you via the camera (e.g. ball, book, cup). ` +
          `Respond with complete, concise sentences, keeping responses short so conversations are responsive.`;

        // Set up Gemini service callbacks
        geminiLiveService.setCallback('onStatusChange', (statusText) => {
          if (statusText === 'Connected') {
            setStatus(STATES.idle);
            setWelcomeMessage(`Connected to STEM Live!`);
            // Trigger introductory greeting
            geminiLiveService.sendTextMessage(`Hello! Introduce yourself to the student Maya.`);
          } else {
            console.log(`[Gemini Socket Status] ${statusText}`);
          }
        });

        geminiLiveService.setCallback('onTranscription', (text, sender) => {
          if (sender === 'AI') {
            setLastReply(text);
          } else {
            setLastUserUtterance(text);
            // Interrupt playback immediately if the user starts speaking
            geminiLiveService.interruptPlayback();
          }
        });

        geminiLiveService.setCallback('onAudioStart', () => {
          setStatus(STATES.speaking);
        });

        geminiLiveService.setCallback('onAudioEnd', () => {
          setStatus(STATES.idle);
        });

        geminiLiveService.setCallback('onError', (err) => {
          setStatus(STATES.error);
          setError(err.message || 'Gemini connection error');
        });

        geminiLiveService.setCallback('onClose', () => {
          setStatus(STATES.disconnected);
        });

        await geminiLiveService.connect(sysInstruction);
        await startMicrophone();
      } catch (err) {
        setStatus(STATES.error);
        setError(err.message || 'Connection failed.');
      } finally {
        setBooting(false);
      }
    };

    init();

    const enterTimer = window.setTimeout(() => setIsEntering(false), 40);
    return () => {
      window.clearTimeout(enterTimer);
      geminiLiveService.disconnect();
      cleanupMic();
      cleanupCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const studentFirstName = activeStudent?.name ? activeStudent.name.split(' ')[0] : 'there';
  const defaultWelcome = booting ? 'Connecting to Gemini...' : `Ready, ${studentFirstName}.`;
  const heroWelcome = welcomeMessage || defaultWelcome;
  const captionAiLine = lastReply.trim();
  const captionUserLine = lastUserUtterance.trim();
  const dockVoiceLevel = isMicMuted ? 0 : voiceLevel;
  const dockPillClass = [
    'stem-live-dock-pill',
    isMicMuted ? 'stem-live-dock-pill--inactive' : 'stem-live-dock-pill--active',
  ].join(' ');
  const canUseMic = !booting && micPermission !== 'denied';
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
      <ModelLoadProgress label="Connecting to Gemini Live Core" />
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
          <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
          <canvas ref={canvasRef} className="live-camera-preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
