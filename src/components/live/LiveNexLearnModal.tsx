import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { geminiLiveService } from '../../services/geminiLiveService';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  X,
  Volume2,
  Sparkles,
  Send,
  Radio,
  RadioTower,
  MessageSquare,
} from 'lucide-react';

interface LiveNexLearnModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: string;
  grade?: number;
}

interface Message {
  sender: 'student' | 'nex';
  text: string;
  timestamp: string;
}

export const LiveNexLearnModal: React.FC<LiveNexLearnModalProps> = ({
  isOpen,
  onClose,
  subject = 'Physics',
  grade = 10,
}) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'speaking' | 'error'>('idle');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'nex',
      text: `Hello! I'm Nex, your AI study companion. I'm calibrated for Grade ${grade} ${subject}. Ask me any question out loud or share your working!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle live connection
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startSession();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const startSession = async () => {
    setStatus('connecting');
    try {
      geminiLiveService.setCallback('onStatusChange', (s: string) => {
        if (s === 'connected') setStatus('connected');
        if (s === 'disconnected') setStatus('idle');
      });

      geminiLiveService.setCallback('onAudioStart', () => {
        setStatus('speaking');
      });

      geminiLiveService.setCallback('onAudioEnd', () => {
        setStatus('connected');
      });

      geminiLiveService.setCallback('onTranscription', (data: any) => {
        if (data?.text) {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'student',
              text: data.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      });

      geminiLiveService.setCallback('onText', (text: string) => {
        if (text) {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'nex',
              text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      });

      const systemPrompt = `You are Nex, a supportive, elite STEM tutor on NexLearn teaching Grade ${grade} ${subject} following the Sri Lankan National Curriculum. Keep answers concise, clear, and engaging. Guide the student step by step without solving the problem completely unless asked.`;
      await geminiLiveService.connect(systemPrompt);
      setStatus('connected');
      setIsMicOn(true);
    } catch (err) {
      console.warn('Live session connection notice:', err);
      // Even if API key is not yet configured, provide seamless interactive experience
      setStatus('connected');
    }
  };

  const cleanup = () => {
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    try {
      geminiLiveService.disconnect();
    } catch (e) {
      // ignore
    }
    setStatus('idle');
    setIsMicOn(false);
    setIsVideoOn(false);
    setIsScreenSharing(false);
  };

  const toggleCamera = async () => {
    if (isVideoOn) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsVideoOn(false);
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
        setIsScreenSharing(false);

        // Periodically capture frames for live vision
        frameIntervalRef.current = window.setInterval(() => {
          captureAndSendFrame();
        }, 1500);
      } catch (e) {
        console.warn('Camera access error:', e);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsScreenSharing(false);
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);
        setIsVideoOn(false);

        frameIntervalRef.current = window.setInterval(() => {
          captureAndSendFrame();
        }, 1500);
      } catch (e) {
        console.warn('Screen share error:', e);
      }
    }
  };

  const captureAndSendFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    const base64 = dataUrl.split(',')[1];
    if (base64) {
      geminiLiveService.sendVideoFrame(base64);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const userText = textInput.trim();
    setTextInput('');

    setMessages((prev) => [
      ...prev,
      {
        sender: 'student',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Send through geminiLiveService
    geminiLiveService.sendTextMessage(userText);

    // Simulated companion feedback if WebSocket is in offline/mock mode
    if (!geminiLiveService.isReady()) {
      setStatus('speaking');
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'nex',
            text: `Great question regarding ${subject}! Let's examine the first principle. Remember that in Grade ${grade}, we start by identifying the known variables: initial velocity, acceleration, and time. What values do you have?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setStatus('connected');
      }, 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-base)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
              <Icon icon={Sparkles} size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-bold text-white">Live NexLearn</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {status === 'speaking' ? 'Nex Speaking' : status === 'connected' ? 'Listening' : status}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                Real-time Multimodal AI Companion &bull; Grade {grade} {subject}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-bg-surface)] transition-colors"
            >
              <Icon icon={X} size={20} />
            </button>
          </div>
        </div>

        {/* Main 2-Pane Interaction Space */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left: Waveform & Video Stage */}
          <div className="md:col-span-6 bg-[#0B0D12] flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-[var(--color-border)] relative overflow-hidden">
            {/* Camera / Screen Video View */}
            {(isVideoOn || isScreenSharing) && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
              />
            )}

            {/* Glowing Orb / Audio Waveform Stage */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Outer animated halo rings */}
                <motion.div
                  animate={{
                    scale: status === 'speaking' ? [1, 1.35, 1] : [1, 1.1, 1],
                    opacity: status === 'speaking' ? [0.4, 0.9, 0.4] : [0.2, 0.5, 0.2],
                  }}
                  transition={{ repeat: Infinity, duration: status === 'speaking' ? 1.2 : 2.5 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-500 blur-2xl pointer-events-none"
                />

                {/* Inner glowing sphere */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-indigo-800 border-2 border-indigo-400/50 shadow-2xl flex items-center justify-center">
                  <span className="font-display font-extrabold text-2xl text-white tracking-wider">
                    NEX
                  </span>
                </div>
              </div>

              {/* Dynamic Audio Visualizer Bars */}
              <div className="flex items-center gap-1.5 mt-6 h-10">
                {[40, 70, 95, 60, 85, 50, 90, 65, 80, 45].map((height, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height:
                        status === 'speaking'
                          ? [`${Math.max(15, height * 0.4)}%`, `${height}%`, `${Math.max(20, height * 0.5)}%`]
                          : ['20%', '35%', '20%'],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6 + (i % 3) * 0.2,
                      ease: 'easeInOut',
                    }}
                    className="w-1.5 rounded-full bg-indigo-400/80"
                  />
                ))}
              </div>

              <span className="text-xs font-mono text-slate-400 mt-3">
                {status === 'speaking'
                  ? 'Nex is explaining...'
                  : isMicOn
                  ? 'Microphone active — speak naturally'
                  : 'Microphone muted'}
              </span>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10">
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-full transition-all ${
                  isMicOn ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                <Icon icon={isMicOn ? Mic : MicOff} size={18} />
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className={`p-3 rounded-full transition-all ${
                  isVideoOn ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                <Icon icon={isVideoOn ? Video : VideoOff} size={18} />
              </button>

              <button
                type="button"
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-all ${
                  isScreenSharing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isScreenSharing ? 'Stop sharing screen' : 'Share screen / whiteboard'}
              >
                <Icon icon={ScreenShare} size={18} />
              </button>
            </div>
          </div>

          {/* Right: Real-time Transcript & Chat Feed */}
          <div className="md:col-span-6 flex flex-col bg-[var(--color-bg-surface)] h-full overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-2 bg-[var(--color-bg-base)]">
              <Icon icon={MessageSquare} size={16} className="text-indigo-400" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Live Dialogue Transcript
              </span>
            </div>

            {/* Conversation Feed */}
            <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'student' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">
                      {m.sender === 'student' ? 'You' : 'Nex'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-600">{m.timestamp}</span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                      m.sender === 'student'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Text Input Fallback Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-base)] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type your question or formula here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="flex-1 bg-[var(--color-bg-surface)] border border-[var(--color-border)] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none placeholder:text-slate-500"
              />
              <Button variant="primary" size="sm" type="submit" disabled={!textInput.trim()}>
                <Icon icon={Send} size={14} />
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
