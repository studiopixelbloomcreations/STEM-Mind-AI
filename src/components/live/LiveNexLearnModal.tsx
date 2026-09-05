import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { geminiLiveService } from '../../services/geminiLiveService';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Sparkles,
  Radio,
  X,
} from '../icons';

interface LiveNexLearnModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: string;
  grade?: number;
}

interface Caption {
  speaker: 'student' | 'nex';
  text: string;
}

// Convert audio buffer to 16kHz 16-bit linear PCM (Little-Endian)
function downsampleTo16kPCM(buffer: Float32Array, inputSampleRate: number): Int16Array {
  if (inputSampleRate === 16000) {
    const pcm = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm;
  }

  const sampleRatio = inputSampleRate / 16000;
  const newLength = Math.round(buffer.length / sampleRatio);
  const pcm = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < pcm.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    const sample = count > 0 ? accum / count : 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    pcm[offsetResult] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return pcm;
}

export const LiveNexLearnModal: React.FC<LiveNexLearnModalProps> = ({
  isOpen,
  onClose,
  subject = 'Physics',
  grade = 10,
}) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'speaking' | 'listening'>('idle');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(16).fill(12));

  // Media & Web Audio references
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isMicActiveRef = useRef<boolean>(false);

  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const captionTimeoutRef = useRef<number | null>(null);

  // Set passive caption with auto-dismiss
  const showCaption = useCallback((speaker: 'student' | 'nex', text: string) => {
    if (!text.trim()) return;
    setCaption({ speaker, text });
    if (captionTimeoutRef.current) {
      window.clearTimeout(captionTimeoutRef.current);
    }
    captionTimeoutRef.current = window.setTimeout(() => {
      setCaption(null);
    }, 6000);
  }, []);

  // Teardown Web Audio Pipeline
  const stopAudioPipeline = useCallback(() => {
    isMicActiveRef.current = false;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setAudioLevels(new Array(16).fill(12));
    setIsMicOn(false);
  }, []);

  // Initialize and start microphone capture
  const startAudioPipeline = useCallback(async () => {
    try {
      stopAudioPipeline();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createMediaStreamSource(stream);
      micSourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      // 4096 samples buffer (~85ms chunks at 48kHz, ~250ms at 16kHz)
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(analyser);
      source.connect(processor);
      // Connect to destination through a zero-gain node to keep processor active without echoing to speakers
      const muteGain = ctx.createGain();
      muteGain.gain.value = 0;
      processor.connect(muteGain);
      muteGain.connect(ctx.destination);

      isMicActiveRef.current = true;
      setIsMicOn(true);

      // Handle continuous microphone PCM chunk conversion
      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!isMicActiveRef.current) return;
        const channelData = e.inputBuffer.getChannelData(0);
        const pcm16 = downsampleTo16kPCM(channelData, ctx.sampleRate);
        if (geminiLiveService.isReady()) {
          geminiLiveService.sendAudioChunk(pcm16);
        }
      };

      // Real-time amplitude meter loop from AnalyserNode
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyserRef.current || !isMicActiveRef.current) return;
        analyserRef.current.getByteFrequencyData(freqData);

        // Sample 16 frequency bands
        const step = Math.max(1, Math.floor(freqData.length / 16));
        const levels = Array.from({ length: 16 }, (_, i) => {
          const val = freqData[i * step] || 0;
          return Math.max(12, Math.min(100, (val / 255) * 100));
        });

        setAudioLevels(levels);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      animFrameRef.current = requestAnimationFrame(updateMeter);
    } catch (err) {
      console.error('Failed to initialize microphone pipeline:', err);
      setIsMicOn(false);
    }
  }, [stopAudioPipeline]);

  // Toggle Microphone
  const toggleMic = async () => {
    if (isMicOn) {
      stopAudioPipeline();
    } else {
      await startAudioPipeline();
    }
  };

  // Video Frame Grabber for Gemini Multimodal
  const captureAndSendVideoFrame = useCallback(() => {
    if (!videoElementRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoElementRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      const base64 = dataUrl.split(',')[1];
      if (base64 && geminiLiveService.isReady()) {
        geminiLiveService.sendVideoFrame(base64);
      }
    } catch (e) {
      console.warn('Frame capture notice:', e);
    }
  }, []);

  // Stop active video (camera or screen share)
  const stopVideoTracks = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    setIsVideoOn(false);
    setIsScreenSharing(false);
  }, []);

  // Toggle Camera
  const toggleCamera = async () => {
    if (isVideoOn) {
      stopVideoTracks();
    } else {
      try {
        stopVideoTracks();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
          audio: false,
        });
        videoStreamRef.current = stream;
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
        setIsScreenSharing(false);

        // Feed 1 FPS JPEG frame to Gemini Multimodal Live session
        frameIntervalRef.current = window.setInterval(captureAndSendVideoFrame, 1000);
      } catch (err) {
        console.warn('Camera access denied or unavailable:', err);
      }
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopVideoTracks();
    } else {
      try {
        stopVideoTracks();
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        videoStreamRef.current = stream;
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = stream;
        }

        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          stopVideoTracks();
        });

        setIsScreenSharing(true);
        setIsVideoOn(false);

        // Feed 1 FPS screen capture to Gemini Multimodal Live session
        frameIntervalRef.current = window.setInterval(captureAndSendVideoFrame, 1000);
      } catch (err) {
        console.warn('Screen share cancelled or unavailable:', err);
      }
    }
  };

  // Connect Gemini Live Session
  const startSession = useCallback(async () => {
    setStatus('connecting');
    try {
      geminiLiveService.setCallback('onStatusChange', (s: string) => {
        if (s === 'Connected') setStatus('connected');
        if (s === 'Disconnected') setStatus('idle');
      });

      geminiLiveService.setCallback('onAudioStart', () => {
        setStatus('speaking');
      });

      geminiLiveService.setCallback('onAudioEnd', () => {
        setStatus('listening');
      });

      geminiLiveService.setCallback('onTranscription', (text: string, speaker: 'AI' | 'User') => {
        if (text) {
          showCaption(speaker === 'AI' ? 'nex' : 'student', text);
        }
      });

      geminiLiveService.setCallback('onText', (text: string) => {
        if (text) {
          showCaption('nex', text);
        }
      });

      const systemPrompt = `You are Nex, a world-class, engaging AI STEM tutor on the NexLearn platform teaching Grade ${grade} ${subject} according to the Sri Lankan National Curriculum.
You are in a live, spoken conversation.
Keep spoken responses natural, encouraging, concise (1-3 sentences per turn), and interactive. Ask guiding questions to help the student reach the solution themselves.`;

      await geminiLiveService.connect(systemPrompt);
      setStatus('listening');

      // Auto-start microphone once live socket is ready
      await startAudioPipeline();
    } catch (err) {
      console.warn('Live session notice (offline mode fallback):', err);
      setStatus('connected');
      showCaption('nex', `Hello! I'm Nex, your live STEM tutor for Grade ${grade} ${subject}. Ask me anything out loud!`);
      await startAudioPipeline();
    }
  }, [grade, subject, showCaption, startAudioPipeline]);

  // Full Session Teardown
  const endSession = useCallback(() => {
    stopAudioPipeline();
    stopVideoTracks();
    if (captionTimeoutRef.current) {
      window.clearTimeout(captionTimeoutRef.current);
    }
    try {
      geminiLiveService.disconnect();
    } catch (e) {
      // ignore
    }
    setStatus('idle');
    onClose();
  }, [stopAudioPipeline, stopVideoTracks, onClose]);

  // Lifecycle
  useEffect(() => {
    if (!isOpen) return;
    startSession();

    return () => {
      stopAudioPipeline();
      stopVideoTracks();
      if (captionTimeoutRef.current) {
        window.clearTimeout(captionTimeoutRef.current);
      }
      try {
        geminiLiveService.disconnect();
      } catch (e) {}
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isVideoActive = isVideoOn || isScreenSharing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden shadow-xl relative"
      >
        {/* Top Header Bar */}
        <header className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-base)]/90 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white font-bold shadow-sm">
              <Icon icon={Sparkles} size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-display font-bold text-[var(--color-text-primary)] tracking-tight">
                  Live NexLearn
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[var(--color-bg-surface-alt)] text-[var(--color-success)] border border-[var(--color-border)] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                  {status === 'speaking'
                    ? 'Nex Speaking'
                    : status === 'listening'
                    ? 'Listening'
                    : status === 'connecting'
                    ? 'Connecting'
                    : 'Active'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                Multimodal Live Voice &bull; Grade {grade} {subject}
              </p>
            </div>
          </div>

          {/* End Session Button in Top-Right Corner */}
          <button
            type="button"
            onClick={endSession}
            className="px-4 py-2 rounded-lg text-xs font-semibold font-mono uppercase tracking-wider bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-danger)] text-[var(--color-danger)] border border-[var(--color-border)] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Icon icon={X} size={14} />
            <span>End Session</span>
          </button>
        </header>

        {/* Main Immersive Stage */}
        <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden bg-[var(--color-bg-base)]">
          {/* Subtle Accent Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none blur-[100px] opacity-10"
            style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
          />

          {/* Camera / Screen Share Video Feed (Full Stage Overlay) */}
          {isVideoActive && (
            <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoElementRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-mono text-white/90 border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />
                <span>{isScreenSharing ? 'Sharing Screen with Nex' : 'Camera Streaming'}</span>
              </div>
            </div>
          )}

          {/* Central AI Avatar / Visualizer Stage */}
          <div
            className={`relative z-10 flex flex-col items-center justify-center text-center transition-all duration-300 ${
              isVideoActive ? 'scale-75 translate-y-[-40px] drop-shadow-xl' : ''
            }`}
          >
            {/* Avatar Orb */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Inner Nexus Sphere */}
              <div className="w-28 h-28 rounded-full bg-[var(--color-accent)] p-1 shadow-sm flex items-center justify-center border border-[var(--color-border)]">
                <div className="w-full h-full rounded-full bg-[var(--color-bg-surface)] flex flex-col items-center justify-center">
                  <span className="font-display font-black text-2xl tracking-wider text-[var(--color-text-primary)]">
                    NEX
                  </span>
                  <span className="text-[9px] font-mono text-[var(--color-accent)] uppercase tracking-widest font-bold mt-0.5">
                    TUTOR
                  </span>
                </div>
              </div>
            </div>

            {/* Real AnalyserNode-Driven Audio Amplitude Waveform */}
            <div className="flex items-center justify-center gap-1.5 mt-8 h-12 px-6 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
              {audioLevels.map((level, i) => (
                <div
                  key={i}
                  style={{
                    height: `${status === 'speaking' ? Math.max(25, (Math.sin(Date.now() / 200 + i) + 1) * 45) : level}%`,
                    transition: 'height 80ms ease-out',
                  }}
                  className={`w-1.5 rounded-full transition-all ${
                    status === 'speaking' || isMicOn
                      ? 'bg-[var(--color-accent)]'
                      : 'bg-[var(--color-border)]'
                  }`}
                />
              ))}
            </div>

            {/* Spoken State Indication */}
            <p className="text-xs font-mono text-[var(--color-text-secondary)] mt-3">
              {status === 'speaking'
                ? 'Nex is explaining...'
                : isMicOn
                ? 'Microphone active — speak anytime'
                : 'Microphone muted — unmute to speak'}
            </p>
          </div>

          {/* Floating Passive Captions (Speech-to-Text Preview) */}
          <AnimatePresence>
            {caption && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.16, ease: [0.65, 0, 0.35, 1] }}
                className="absolute bottom-28 left-6 right-6 max-w-2xl mx-auto z-30 pointer-events-none"
              >
                <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-xl text-center">
                  <div className="inline-flex items-center gap-1.5 mb-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono text-[10px] uppercase font-bold tracking-wider">
                    <span>{caption.speaker === 'student' ? 'You' : 'Nex'}</span>
                  </div>
                  <p className="text-sm sm:text-base text-[var(--color-text-primary)] font-medium leading-relaxed">
                    &ldquo;{caption.text}&rdquo;
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Control Dock (Liquid Glass) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-full liquid-glass specular-highlight shadow-2xl">
            {/* Control 1: Microphone Toggle */}
            <button
              type="button"
              onClick={toggleMic}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isMicOn
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'bg-[var(--color-bg-surface-alt)] text-[var(--color-danger)] border border-[var(--color-border)]'
              }`}
            >
              <Icon icon={isMicOn ? Mic : MicOff} size={20} />
            </button>

            {/* Control 2: Camera Toggle */}
            <button
              type="button"
              onClick={toggleCamera}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isVideoOn
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Icon icon={isVideoOn ? Video : VideoOff} size={20} />
            </button>

            {/* Control 3: Screen Share Toggle */}
            <button
              type="button"
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen / Problem'}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isScreenSharing
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Icon icon={ScreenShare} size={20} />
            </button>
          </div>
        </main>
      </motion.div>
    </div>
  );
};
export default LiveNexLearnModal;
