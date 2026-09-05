import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, PanelLeft, Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { nexEngine } from '../../nex/behaviorEngine.js';
import { deriveDirectorAction } from '../../nex/director.js';
import {
  startStemLiveSession,
  sendStemLiveTurn,
  endStemLiveSession,
  heartbeatStemLiveSession,
} from '../../services/stemLiveService.js';
import { geminiLiveService } from '../../services/geminiLiveService.js';
import voiceSynthesizer from '../../utils/voiceSynthesizer.js';
import { Chip, IconButton, Label } from '../ui/index.jsx';
import { useReducedMotion } from '../../design/runtime.js';
import './live.css';

/* ==========================================================================
   LiveTutorMode — the full-screen conversational tutor surface.
   Nex is the room: every session state reads first from his animation
   (idle / listen_loop lean-in / think core pattern / amplitude-driven
   talk_loop), with the chips and captions as the quiet second voice.

   Voice pipeline is the old STEMLiveMode wiring, re-hosted:
     mic (getUserMedia) -> webkitSpeechRecognition for the student line,
     AnalyserNode for real amplitude, ScriptProcessor -> 16kHz PCM to the
     Gemini Live socket when a key is configured;
     camera frame (640x360 jpeg every 1.4s) rides the turn as visionFrame;
     tutor replies come from the stem-live edge function (sendStemLiveTurn)
     or the Gemini Live socket, and speak through voiceSynthesizer.

   Hard rules honored here:
   - Service failure -> quiet honest error state. Never a fake conversation.
   - Unmount stops every track, closes the AudioContext, cancels rAF, stops TTS.
   - prefers-reduced-motion: rings and cadence envelopes off; the states stay
     legible through Nex's resting pose + chips + captions.
   ========================================================================== */

const Nex = lazy(() => import('../nex/Nex.jsx'));

/* --- constants ----------------------------------------------------------- */

const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

const FRAME_INTERVAL_MS = 1400;   // camera -> turn cadence (old live mode)
const FRAME_WIDTH = 640;
const FRAME_HEIGHT = 360;
const NEX_SIZE = 320;             // center-stage presence
const NEX_SIZE_TABLET = 240;      // tablet scale (contract: responsive)
const RING_MARGIN = 1.18;         // rings sit just outside Nex's silhouette
const TABLET_BREAK = 1180;
const RMS_GAIN = 4.2;             // normalize quiet mics into visible motion
const TTS_ENVELOPE = 0.32;        // bounded, labeled-simulated cadence while TTS plays
const HEARTBEAT_MS = 30000;

/* SpeechRecognition is webkit-prefixed and Chromium-only — the old mode's
   platform gate, kept honest rather than silently faking transcription. */
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

/* Downsample mic PCM to 16kHz Int16 for the Gemini Live socket (old live mode). */
function downsampleTo16k(buffer, inputRate) {
  if (inputRate === 16000) return buffer;
  const ratio = inputRate / 16000;
  const outLen = Math.round(buffer.length / ratio);
  const out = new Float32Array(outLen);
  let o = 0;
  let i = 0;
  while (o < outLen) {
    const next = Math.round((o + 1) * ratio);
    let acc = 0;
    let n = 0;
    while (i < next && i < buffer.length) { acc += buffer[i]; n++; i++; }
    out[o] = n ? acc / n : 0;
    o++;
  }
  return out;
}

export default function LiveTutorMode() {
  const { activeStudent, activeSubject, activeTopic, setLiveModeActive } = useApp();
  const reducedMotion = useReducedMotion();

  /* --- session state (contract §3.6) -------------------------------------- */
  const [status, setStatus] = useState(STATES.IDLE);
  const [caption, setCaption] = useState('Tap the mic to begin.');
  const [transcript, setTranscript] = useState([]); // [{speaker:'student'|'nex', text, at}]
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [connection, setConnection] = useState('connecting'); // connecting | live | local
  const [railOpen, setRailOpen] = useState(true);
  const [tablet, setTablet] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= TABLET_BREAK : false
  );

  /* --- refs: media, audio graph, cadence, latches -------------------------- */
  const micStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const processorRef = useRef(null);
  const rafRef = useRef(0);
  const frameTimerRef = useRef(0);
  const recognitionRef = useRef(null);
  const heartbeatTimerRef = useRef(0);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const selfViewVideoRef = useRef(null);
  const sessionRef = useRef(null);
  const finalRef = useRef('');       // accumulated final student utterance
  const busyRef = useRef(false);     // a turn is in flight
  const pendingRef = useRef('');     // the newer question that superseded it
  const turnSeqRef = useRef(0);     // monotonic turn id, stale replies discarded
  const micIntentRef = useRef(false); // deliberate mic state, vs Chromium auto-stops
  const statusRef = useRef(STATES.IDLE);
  const micOnRef = useRef(false);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { micOnRef.current = micOn; }, [micOn]);

  /* Tablet width -> Nex shrinks, rail becomes an overlay (contract: responsive). */
  useEffect(() => {
    const onResize = () => setTablet(window.innerWidth <= TABLET_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const nexSize = tablet ? NEX_SIZE_TABLET : NEX_SIZE;
  const ringBase = Math.round(nexSize * RING_MARGIN);

  /* Rings follow Nex's size (they are his resonance, not separate chrome). */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty('--live-ring-base', `${ringBase}px`);
  }, [ringBase]);

  /* --- transcript rail: last 8 turns -------------------------------------- */
  const pushTurn = useCallback((speaker, text) => {
    const clean = String(text || '').trim();
    if (!clean) return;
    setTranscript((prev) => [...prev, { speaker, text: clean, at: Date.now() }].slice(-8));
  }, []);

  /* ========================================================================
     NEX DIRECTOR WIRING — every state change is his animation first
     (director events per contract §6: live_listening / live_thinking /
     live_speaking / session_idle).
     ======================================================================== */
  const enterNexState = useCallback((next, speechOverride) => {
    if (next === STATES.LISTENING) {
      const action = deriveDirectorAction('live_listening');
      nexEngine.dispatch(action);            // listen_loop — lean in, eyes on camera
      setCaption(action.speech);
    } else if (next === STATES.THINKING) {
      const action = deriveDirectorAction('live_thinking');
      nexEngine.dispatch(action);            // think — gaze up-left, core think pattern
      setCaption('…');
    } else if (next === STATES.SPEAKING) {
      const action = deriveDirectorAction('live_speaking', { speech: speechOverride });
      nexEngine.dispatch(action);            // talk_loop — amplitude-driven jaw + head
      setCaption(speechOverride || '—');
    } else if (next === STATES.ERROR) {
      const action = deriveDirectorAction('session_idle');
      nexEngine.dispatch(action);            // honest settle; never fake "connected"
      setCaption('Voice is offline. Nothing is being sent.');
    } else {
      const action = deriveDirectorAction('session_idle');
      nexEngine.dispatch(action);            // idle loop
      setCaption('Tap the mic to begin.');
    }
    setStatus(next);
  }, []);

  /* ========================================================================
     AMPLITUDE PIPELINE — mic -> AnalyserNode -> nexEngine + rings.
     One rAF loop computes RMS from real time-domain data, normalizes it,
     smooths it, then writes it to the engine (talk_jaw / head_speak) and
     to the stage's --live-level var (the rings scale with it). While Nex
     speaks, this TTS path is AudioContext playback with no boundary
     events, so a gentle labeled-simulated envelope carries the cadence;
     the mic path is always the real signal.
     ======================================================================== */
  const startAmplitudeLoop = useCallback(() => {
    if (rafRef.current || reducedMotion) return;
    let smooth = 0;
    const tick = () => {
      const analyser = analyserRef.current;
      let level = 0;
      if (analyser) {
        const buf = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        level = Math.min(1, rms * RMS_GAIN);
      } else if (statusRef.current === STATES.SPEAKING) {
        const t = performance.now() / 1000;
        level = TTS_ENVELOPE * (0.6 + 0.4 * Math.sin(t * 2.4) * Math.sin(t * 0.9));
      }
      smooth += (level - smooth) * 0.25;
      nexEngine.setAmplitude(smooth);
      const stage = stageRef.current;
      if (stage) {
        stage.style.setProperty('--live-level', smooth.toFixed(3));
        stage.dataset.level = smooth > 0.04 ? 'on' : 'off';
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [reducedMotion]);

  const stopAmplitudeLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    nexEngine.setAmplitude(0);
    const stage = stageRef.current;
    if (stage) {
      stage.style.setProperty('--live-level', '0');
      stage.dataset.level = 'off';
    }
  }, []);

  /* ========================================================================
     TTS — voiceSynthesizer (Gemini native audio), the old mode's play path.
     onEnd walks Nex back to listening so the conversation keeps flowing.
     ======================================================================== */
  const speakNex = useCallback((text) => {
    pushTurn('nex', text);
    enterNexState(STATES.SPEAKING, text);
    try {
      voiceSynthesizer.speak(
        text,
        () => {
          if (micOnRef.current) enterNexState(STATES.LISTENING);
          else enterNexState(STATES.IDLE);
        },
        () => { /* talk_loop is already dispatched above */ }
      );
    } catch {
      if (micOnRef.current) enterNexState(STATES.LISTENING);
    }
  }, [enterNexState, pushTurn]);

  /* ========================================================================
     CAMERA — self-view + periodic frame capture for the vision pipeline.
     captureFrame (640x360 mirrored jpeg) is the old live mode's shape and
     cadence; the latest frame rides the next stem-live turn as visionFrame
     and, when the Gemini Live socket is up, is pushed as a realtime frame.
     ======================================================================== */
  const latestFrameRef = useRef(null);

  const captureVisionFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !cameraStreamRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // mirror to match the self-view
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    const base64Data = dataUrl.split(',')[1] || '';
    if (!base64Data) return null;
    const frame = { mimeType: 'image/jpeg', base64Data, capturedAt: new Date().toISOString() };
    latestFrameRef.current = frame;
    if (geminiLiveService.isReady()) geminiLiveService.sendVideoFrame(base64Data);
    return frame;
  }, []);

  const startCamera = useCallback(async () => {
    if (cameraStreamRef.current) return;
    if (!navigator?.mediaDevices?.getUserMedia) {
      setSessionError('Camera access is not supported by this browser.');
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
        videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
      window.setTimeout(captureVisionFrame, 250); // first frame lands fast
      frameTimerRef.current = window.setInterval(captureVisionFrame, FRAME_INTERVAL_MS);
    } catch {
      setSessionError('Camera was blocked. Continuing voice-only.');
    }
  }, [captureVisionFrame]);

  const stopCamera = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = 0;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (selfViewVideoRef.current) selfViewVideoRef.current.srcObject = null;
    latestFrameRef.current = null;
    setCameraOn(false);
  }, []);

  const toggleCamera = useCallback(() => {
    if (cameraOn) stopCamera();
    else startCamera();
  }, [cameraOn, startCamera, stopCamera]);

  /* Self-view: the thumbnail mirrors the same live camera stream.
     The ref callback re-attaches whenever the figure mounts. */
  const attachSelfView = useCallback((el) => {
    selfViewVideoRef.current = el;
    if (el && cameraStreamRef.current && el.srcObject !== cameraStreamRef.current) {
      el.srcObject = cameraStreamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  /* ========================================================================
     TURN PIPELINE — student utterance -> stem-live turn -> reply -> TTS.
     sendStemLiveTurn is the old STEMLiveMode call exactly: transcript
     string + context + latest visionFrame + clientState. The edge function
     is unchanged and answers with replyText/ttsText.

     Barge-in: the student's voice always wins — it stops Nex's TTS and the
     Gemini socket playback (the old mode's rule), and a newer question
     supersedes an in-flight reply rather than answering the wrong thing.
     ======================================================================== */
  const sendTurnRef = useRef(null);

  const sendTurn = useCallback(
    async (utterance) => {
      const text = String(utterance || '').trim();
      if (!text) return;

      // No live session: the student's words are real, the answer is not faked.
      if (!sessionRef.current) {
        pushTurn('student', text);
        setSessionError('Live tutor is unreachable — nothing was answered.');
        enterNexState(STATES.ERROR);
        return;
      }

      // Barge-in: student speech interrupts Nex mid-line.
      voiceSynthesizer.stop();
      geminiLiveService.interruptPlayback();

      // A turn is already in flight: keep only the newest question, and let
      // the stale reply be discarded when it resolves.
      if (busyRef.current) {
        pendingRef.current = text;
        turnSeqRef.current += 1;
        return;
      }

      busyRef.current = true;
      const mySeq = turnSeqRef.current;
      pushTurn('student', text);
      enterNexState(STATES.THINKING);
      setSessionError('');
      try {
        const res = await sendStemLiveTurn({
          sessionId: sessionRef.current,
          transcript: text,
          context: {
            studentName: activeStudent?.name || 'Student',
            subject: activeSubject || 'STEM',
            topic: activeTopic || 'General STEM',
          },
          visionFrame: latestFrameRef.current,
          clientState: { surface: 'live-tutor-mode', cameraOn },
        });
        busyRef.current = false;
        // A newer question arrived while this one was in flight: answer that
        // instead of playing a reply to something the student moved past.
        const superseded = mySeq !== turnSeqRef.current;
        if (superseded) {
          const next = pendingRef.current;
          pendingRef.current = '';
          if (next) sendTurnRef.current?.(next);
          return;
        }
        const reply = String(res?.replyText || res?.ttsText || '').trim();
        if (!reply) throw new Error('The tutor returned no reply.');
        speakNex(reply);
      } catch (err) {
        busyRef.current = false;
        if (mySeq !== turnSeqRef.current) {
          // The newer question is already queued; don't surface the stale error.
          const next = pendingRef.current;
          pendingRef.current = '';
          if (next) sendTurnRef.current?.(next);
          return;
        }
        // Honest failure: quiet chip, Nex settles. Never a fabricated answer.
        setSessionError(err?.message || 'Live tutor is unreachable right now.');
        enterNexState(STATES.ERROR);
      }
    },
    [activeStudent, activeSubject, activeTopic, cameraOn, enterNexState, pushTurn, speakNex]
  );

  /* Late-bound so the turn pipeline can re-enter itself for queued turns. */
  useEffect(() => { sendTurnRef.current = sendTurn; }, [sendTurn]);

  /* --- speech recognition -> sendTurn ------------------------------------- */
  const startRecognition = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setMicError('Speech recognition needs a Chromium browser.');
      return null;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (interim.trim()) setCaption(interim.trim());
      if (finalRef.current.trim()) {
        const turn = finalRef.current.trim();
        finalRef.current = '';
        sendTurn(turn);
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setMicError('Microphone permission was blocked.');
        micIntentRef.current = false;
        setMicOn(false);
        enterNexState(STATES.IDLE);
      }
      // 'no-speech' and transient blips: keep the mic live, don't kill the session.
    };
    rec.onend = () => {
      // Chromium auto-stops on silence; restart only while the mic is
      // deliberate. Each restart begins a fresh utterance buffer so words
      // are never double-counted across sessions.
      if (micIntentRef.current) {
        finalRef.current = '';
        try { rec.start(); } catch { /* restart race */ }
      }
    };
    try { rec.start(); } catch { /* start race */ }
    return rec;
  }, [enterNexState, sendTurn]);

  /* ========================================================================
     MIC — getUserMedia -> AudioContext -> Analyser (+ Gemini Live stream).
     The AnalyserNode feeds the amplitude loop; the ScriptProcessor path
     streams 16kHz PCM to the geminiLiveService socket when a key exists.
     ======================================================================== */
  const startMic = useCallback(async () => {
    if (micStreamRef.current) return;
    if (!navigator?.mediaDevices?.getUserMedia) {
      setMicError('Microphone access is not supported by this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micStreamRef.current = stream;
      micIntentRef.current = true;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);

      // Real amplitude: AnalyserNode -> rAF RMS -> rings + nexEngine.
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Gemini Live socket streaming (old live mode's wiring, unchanged).
      if (geminiLiveService.isReady()) {
        const processor = ctx.createScriptProcessor(2048, 1, 1);
        source.connect(processor);
        processor.connect(ctx.destination);
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const ds = downsampleTo16k(input, ctx.sampleRate);
          const int16 = new Int16Array(ds.length);
          for (let i = 0; i < ds.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, ds[i] * 32768));
          }
          geminiLiveService.sendAudioChunk(int16);
        };
        processorRef.current = processor;
      }

      setMicOn(true);
      setMicError('');
      finalRef.current = '';
      recognitionRef.current = startRecognition();
      enterNexState(STATES.LISTENING);
      startAmplitudeLoop();
    } catch {
      micIntentRef.current = false;
      setMicError('Allow microphone access to talk with Nex.');
    }
  }, [enterNexState, startAmplitudeLoop, startRecognition]);

  const stopMic = useCallback(() => {
    micIntentRef.current = false;
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    recognitionRef.current = null;
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch { /* already gone */ }
      processorRef.current = null;
    }
    analyserRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch { /* already closed */ }
      audioCtxRef.current = null;
    }
    stopAmplitudeLoop();
    setMicOn(false);
    enterNexState(STATES.IDLE);
  }, [enterNexState, stopAmplitudeLoop]);

  const toggleMic = useCallback(() => {
    if (micOn) stopMic();
    else startMic();
  }, [micOn, startMic, stopMic]);

  /* ========================================================================
     SESSION LIFECYCLE — startStemLiveSession on mount (the old mode's call);
     the Gemini Live socket is the second path when stem-live is not
     configured. Failures surface honestly; nothing fakes a conversation.
     ======================================================================== */
  useEffect(() => {
    let alive = true;

    const wireGeminiCallbacks = () => {
      geminiLiveService.setCallback('onTranscription', (text, sender) => {
        if (!alive || !text) return;
        if (sender === 'AI') pushTurn('nex', text);
        else {
          pushTurn('student', text);
          geminiLiveService.interruptPlayback(); // barge-in, old mode's rule
        }
      });
      geminiLiveService.setCallback('onAudioStart', () => {
        if (!alive) return;
        busyRef.current = false;
        enterNexState(STATES.SPEAKING, '—');
      });
      geminiLiveService.setCallback('onAudioEnd', () => {
        if (!alive) return;
        if (micOnRef.current) enterNexState(STATES.LISTENING);
        else enterNexState(STATES.IDLE);
      });
      geminiLiveService.setCallback('onError', (err) => {
        if (!alive) return;
        setSessionError(err?.message || 'Gemini Live connection error.');
      });
    };

    const boot = async () => {
      enterNexState(STATES.IDLE);
      try {
        const started = await startStemLiveSession({
          studentId: activeStudent?.id,
          context: {
            studentName: activeStudent?.name || 'Student',
            subject: activeSubject || 'STEM',
            topic: activeTopic || 'General STEM',
          },
        });
        // Unmounted (or session ended) while the start call was in flight:
        // tear the server session down immediately rather than leaking it.
        if (!alive) {
          const id = started?.sessionId;
          if (id) endStemLiveSession({ sessionId: id }).catch(() => {});
          return;
        }
        sessionRef.current = started?.sessionId || null;
        setConnection('live');
        if (started?.welcomeMessage) speakNex(started.welcomeMessage);
        heartbeatTimerRef.current = window.setInterval(() => {
          const id = sessionRef.current;
          if (!id) return;
          heartbeatStemLiveSession({
            sessionId: id,
            clientState: { surface: 'live-tutor-mode' },
          }).catch(() => {});
        }, HEARTBEAT_MS);
      } catch {
        // stem-live unreachable: try the Gemini Live socket as path two.
        if (!alive) return;
        try {
          wireGeminiCallbacks();
          await geminiLiveService.connect();
          if (!alive) return;
          setConnection('live');
        } catch {
          if (!alive) return;
          setConnection('local');
          setSessionError('Live tutor services are unreachable. Mic and camera still run locally.');
        }
      }
    };

    boot();

    return () => {
      alive = false;
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- END SESSION — full teardown ---------------------------------------- */
  const endSession = useCallback(() => {
    voiceSynthesizer.stop();
    micIntentRef.current = false;
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    recognitionRef.current = null;
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = 0;
    }
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = 0;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (selfViewVideoRef.current) selfViewVideoRef.current.srcObject = null;
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch { /* already gone */ }
      processorRef.current = null;
    }
    analyserRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch { /* already closed */ }
      audioCtxRef.current = null;
    }
    stopAmplitudeLoop();
    geminiLiveService.disconnect();
    const id = sessionRef.current;
    sessionRef.current = null;
    if (id) {
      endStemLiveSession({ sessionId: id }).catch(() => {});
    }
    setLiveModeActive(false);
  }, [setLiveModeActive, stopAmplitudeLoop]);

  /* Unmount safety net — every resource dies, whatever path got here. */
  const endSessionRef = useRef(endSession);
  useEffect(() => { endSessionRef.current = endSession; }, [endSession]);
  useEffect(() => () => endSessionRef.current(), []);

  /* --- derived view state -------------------------------------------------- */
  const statusChip = useMemo(() => ({
    idle: { tone: undefined, label: 'idle' },
    listening: { tone: 'amber', label: 'listening' },
    thinking: { tone: 'amber', label: 'thinking' },
    speaking: { tone: 'resolve', label: 'speaking' },
    error: { tone: 'alert', label: 'offline' },
  }[status] || { tone: undefined, label: status }), [status]);

  const errorNote = micError || sessionError;
  const subjectLine = [activeSubject || 'STEM', activeTopic || 'open topic'].join(' · ');

  return (
    <div
      ref={stageRef}
      className={`nx-live-stage is-${status}${reducedMotion ? ' is-reduced' : ''}${tablet ? ' is-tablet' : ''}`}
      data-camera={cameraOn ? 'on' : 'off'}
      role="region"
      aria-label="Live tutor session"
    >
      {/* Nex's room floor — a quiet pool of light under center stage */}
      <div className="nx-live-stage__floor" aria-hidden="true" />

      {/* The capture source: hidden video whose frames ride the turns.
          The self-view below is a second sink of the same stream. */}
      <video ref={videoRef} className="nx-u-sr" autoPlay playsInline muted />

      {/* Camera self-view — the thumbnail of exactly what Nex sees.
          Same stream as the capture video, second sink, mirrored. */}
      {cameraOn && (
        <figure className="nx-live-selfview" aria-hidden="true">
          <video
            ref={attachSelfView}
            className="nx-live-selfview__video"
            autoPlay
            playsInline
            muted
          />
          <figcaption className="nx-live-selfview__note">
            <Camera size={11} aria-hidden="true" />
            NEX CAN SEE THIS
          </figcaption>
        </figure>
      )}

      {/* Top chrome — status truth lives here AND in Nex */}
      <header className="nx-live-top">
        <Label plain>Live tutor</Label>
        <span className="nx-live-top__subject">{subjectLine}</span>
        <div className="nx-live-top__chips">
          <Chip tone={statusChip.tone} live={status === 'listening' || status === 'speaking'}>
            {statusChip.label}
          </Chip>
          <Chip tone={cameraOn ? 'amber' : undefined}>{cameraOn ? 'camera on' : 'camera off'}</Chip>
          <Chip>
            {connection === 'live' ? 'connection · live' : connection === 'local' ? 'connection · local' : 'connection · …'}
          </Chip>
        </div>
      </header>

      {/* Transcript rail — last 8 turns, collapsible */}
      <aside className={`nx-live-rail${railOpen ? ' is-open' : ''}`} aria-label="Live transcript">
        <button
          type="button"
          className="nx-live-rail__toggle"
          aria-expanded={railOpen}
          onClick={() => setRailOpen((v) => !v)}
        >
          <PanelLeft size={14} aria-hidden="true" />
          <span className="nx-u-sr">{railOpen ? 'Hide transcript' : 'Show transcript'}</span>
        </button>
        {railOpen && (
          <div className="nx-live-rail__scroll" role="log" aria-live="polite">
            {transcript.length === 0 && <p className="nx-live-rail__empty">— no turns yet —</p>}
            {transcript.map((t, i) => (
              <p key={`${t.at}-${i}`} className={`nx-live-rail__line nx-live-rail__line--${t.speaker}`}>
                <span className="nx-live-rail__who">{t.speaker === 'nex' ? 'NEX' : 'YOU'}</span>
                {t.text}
              </p>
            ))}
          </div>
        )}
      </aside>

      {/* Center stage: rings + Nex + captions */}
      <main className="nx-live-center">
        {!reducedMotion && (
          <div className="nx-live-rings" aria-hidden="true">
            <span className="nx-voice-ring nx-voice-ring--1" />
            <span className="nx-voice-ring nx-voice-ring--2" />
            <span className="nx-voice-ring nx-voice-ring--3" />
          </div>
        )}
        <div className="nx-live-nex" style={{ width: nexSize, height: Math.round(nexSize * 1.2) }}>
          <Suspense fallback={<div className="nx-live-nex__ghost" aria-hidden="true" />}>
            <Nex dock ariaLabel="Nex, your live tutor" />
          </Suspense>
        </div>
        <p className="nx-captions nx-live-captions" aria-live="polite">{caption}</p>
        {errorNote && <p className="nx-live-error" role="alert">{errorNote}</p>}
      </main>

      {/* Control bar — glass-dark, bottom center */}
      <footer className="nx-live-controls">
        <div className="nx-live-controls__inner">
          <div className="nx-live-controls__unit">
            <IconButton
              label={micOn ? 'Stop microphone' : 'Start microphone'}
              className={micOn ? 'is-on' : ''}
              onClick={toggleMic}
              aria-pressed={micOn}
            >
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </IconButton>
            <span className="nx-live-controls__key">{micOn ? 'mic on' : 'mic off'}</span>
          </div>
          <div className="nx-live-controls__unit">
            <IconButton
              label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              className={cameraOn ? 'is-on' : ''}
              onClick={toggleCamera}
              aria-pressed={cameraOn}
            >
              {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
            </IconButton>
            <span className="nx-live-controls__key">{cameraOn ? 'cam on' : 'cam off'}</span>
          </div>
          <div className="nx-live-controls__unit">
            <IconButton
              label="End session"
              className="nx-live-controls__end"
              onClick={endSession}
            >
              <PhoneOff size={18} />
            </IconButton>
            <span className="nx-live-controls__key">end</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
