/**
 * Service for direct client-side connection to the Gemini Multimodal Live API over WebSockets.
 * Handles:
 * - WebSocket connection management and authentication.
 * - Outbound streaming of microphone PCM audio.
 * - Outbound streaming of webcam frames.
 * - Inbound streaming and back-to-back queue playback of 24kHz PCM audio response.
 * - Inbound speech-to-text transcriptions for live captioning.
 */

import { API_KEYS } from '../config/config';

const LIVE_API_ENDPOINT =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const GEMINI_LIVE_MODELS = [
  'models/gemini-2.5-flash-native-audio-preview-12-2025',
  'models/gemini-live-2.5-flash-preview',
  'models/gemini-2.0-flash-live-001',
];

const DEFAULT_SYSTEM_INSTRUCTION =
  'You are STEMMind, a friendly STEM teacher for grade 9, grade 10, and grade 11 students. ' +
  'Teach science, technology, engineering, and math in clear, age-appropriate spoken language. ' +
  'When visual intelligence is on, treat webcam frames as live current evidence. ' +
  'If the student asks what they are holding or showing, look at the latest camera frame and name the actual visible object first, such as a ball, phone, book, pen, or cup. ' +
  'Do not answer with generic pretrained examples or guesses. If the object is not visible or unclear, say you cannot see it clearly and ask them to hold it in front of the camera. ' +
  'Then connect the object to a useful grade 9-11 STEM idea in one or two concise sentences.';

// Try to resolve the Gemini API Key
export const getGeminiApiKey = () => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (envKey) {
    return envKey;
  }
  
  // Look in the Harmony configuration JSON keys
  const keys = API_KEYS || {};
  if (keys.google?.apiKey) return keys.google.apiKey;
  if (keys.gemini?.apiKey) return keys.gemini.apiKey;
  
  // Look in openrouter as fallback in case a direct Google key is stored there
  if (keys.openrouter?.apiKey && keys.openrouter.apiKey.startsWith('AIzaSy')) {
    return keys.openrouter.apiKey;
  }
  
  return null;
};

class GeminiLiveService {
  constructor() {
    this.ws = null;
    this.audioContext = null;
    this.nextPlayTime = 0;
    this.callbacks = {
      onTranscription: null, // (text, sender)
      onAudioStart: null,
      onAudioEnd: null,
      onError: null,
      onClose: null,
      onStatusChange: null, // (statusText)
    };
    this.isConnected = false;
    this.isSetupComplete = false;
    this.activeAudioSources = [];
    this.currentModelIndex = 0;
    this.connectAttemptId = 0;
  }

  setCallback(name, fn) {
    this.callbacks[name] = fn;
  }

  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000, // Playback at 24kHz matching Gemini Live output
      });
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Connect to Gemini Live WebSocket
   * @param {string} systemInstruction 
   */
  async connect(systemInstruction = '') {
    const key = getGeminiApiKey();
    if (!key) {
      const errorMsg = 'Gemini API Key is not configured. Please define VITE_GEMINI_API_KEY in your .env file.';
      this.callbacks.onError?.(new Error(errorMsg));
      throw new Error(errorMsg);
    }

    this.disconnect();
    const attemptId = ++this.connectAttemptId;
    await this.initAudioContext();
    this.nextPlayTime = this.audioContext.currentTime;

    const modelIndex = this.currentModelIndex || 0;
    const selectedModel = GEMINI_LIVE_MODELS[modelIndex % GEMINI_LIVE_MODELS.length];
    
    console.log(`[Gemini WebSocket] Connecting using model: ${selectedModel}`);
    const url = `${LIVE_API_ENDPOINT}?key=${encodeURIComponent(key)}`;
    this.callbacks.onStatusChange?.('Connecting to Gemini...');

    return new Promise((resolve, reject) => {
      let settled = false;

      const resolveOnce = () => {
        if (!settled) {
          settled = true;
          resolve(this);
        }
      };

      const rejectOnce = (err) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      };

      try {
        const ws = new WebSocket(url);
        this.ws = ws;
        
        ws.onopen = () => {
          if (attemptId !== this.connectAttemptId) return;
          this.isConnected = true;
          
          // The native WebSocket API expects lowerCamelCase JSON field names.
          const setupMsg = {
            setup: {
              model: selectedModel,
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: 'Aoede',
                    },
                  },
                },
              },
              systemInstruction: {
                role: 'system',
                parts: [
                  {
                    text: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
                  },
                ],
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            }
          };

          ws.send(JSON.stringify(setupMsg));
        };

        ws.onmessage = async (event) => {
          if (attemptId !== this.connectAttemptId) return;
          try {
            let data;
            if (event.data instanceof Blob) {
              const text = await event.data.text();
              data = JSON.parse(text);
            } else {
              data = JSON.parse(event.data);
            }

            if (data.setupComplete || data.setup_complete) {
              this.isSetupComplete = true;
              this.callbacks.onStatusChange?.('Connected');
              resolveOnce();
              return;
            }

            this.handleServerMessage(data);
          } catch (e) {
            console.error('Error parsing Gemini Live WebSocket message:', e);
          }
        };

        ws.onerror = (err) => {
          if (attemptId !== this.connectAttemptId) return;
          this.callbacks.onError?.(err);
          rejectOnce(err);
        };

        ws.onclose = (event) => {
          if (attemptId !== this.connectAttemptId) return;
          this.isConnected = false;
          this.isSetupComplete = false;
          console.warn(`[Gemini WebSocket Close] Code: ${event.code}, Reason: ${event.reason || 'None provided'}`);
          
          // Fallback logic for invalid argument (code 1007)
          if (event.code === 1007) {
            if (modelIndex < GEMINI_LIVE_MODELS.length - 1) {
              console.log(`[Gemini WebSocket Fallback] Retrying with next model...`);
              this.currentModelIndex = modelIndex + 1;
              this.connect(systemInstruction).then(resolveOnce).catch(rejectOnce);
              return;
            }
          }

          this.callbacks.onStatusChange?.('Disconnected');
          this.callbacks.onClose?.(event);
          rejectOnce(new Error(event.reason || `Gemini Live WebSocket closed with code ${event.code}.`));
        };
      } catch (err) {
        rejectOnce(err);
      }
    });
  }

  handleServerMessage(msg) {
    // 1. Check for audio output content (support both snake_case and camelCase fallback)
    const serverContent = msg.server_content || msg.serverContent;
    const modelTurn = serverContent?.model_turn || serverContent?.modelTurn;
    const parts = modelTurn?.parts || [];

    if (serverContent?.interrupted) {
      this.interruptPlayback();
    }
    
    for (const part of parts) {
      // Handle voice output audio
      const inlineData = part.inline_data || part.inlineData;
      if (inlineData && (inlineData.mime_type || inlineData.mimeType)?.startsWith('audio/pcm')) {
        const base64Audio = inlineData.data;
        this.playPCMChunk(base64Audio);
      }
    }

    // 2. Check for speech-to-text transcriptions
    const outputTranscription =
      serverContent?.outputTranscription?.text || serverContent?.output_transcription?.text;
    if (outputTranscription?.trim()) {
      this.callbacks.onTranscription?.(outputTranscription.trim(), 'AI');
    }

    const modelTranscriptions = parts
      ?.map(p => p.text)
      .filter(Boolean)
      .join(' ');
    
    if (modelTranscriptions && modelTranscriptions.trim()) {
      this.callbacks.onTranscription?.(modelTranscriptions.trim(), 'AI');
    }

    // Handle user transcription (what the user said) if available
    const userTranscription =
      serverContent?.inputTranscription?.text || serverContent?.input_transcription?.text;
    if (userTranscription && userTranscription.trim()) {
      this.callbacks.onTranscription?.(userTranscription.trim(), 'User');
    }
  }

  /**
   * Decode base64 PCM and queue it in AudioContext for seamless playback.
   */
  async playPCMChunk(base64Data) {
    if (!this.audioContext) return;
    
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Read as 16-bit signed PCM
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    // Create audio buffer (24000Hz mono)
    const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;
    const playTime = Math.max(now, this.nextPlayTime);
    
    if (this.activeAudioSources.length === 0) {
      this.callbacks.onAudioStart?.();
    }
    
    this.activeAudioSources.push(source);
    
    source.onended = () => {
      this.activeAudioSources = this.activeAudioSources.filter(s => s !== source);
      if (this.activeAudioSources.length === 0) {
        this.callbacks.onAudioEnd?.();
      }
    };

    source.start(playTime);
    this.nextPlayTime = playTime + audioBuffer.duration;
  }

  /**
   * Send text input to the session
   * @param {string} text 
   */
  sendTextMessage(text) {
    if (!this.isReady()) return;
    
    const textMsg = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text }]
          }
        ],
        turnComplete: true
      }
    };
    
    this.ws.send(JSON.stringify(textMsg));
  }

  /**
   * Send a video frame to the session
   * @param {string} base64Jpeg Only the base64 characters (exclude data:image/jpeg;base64,)
   */
  sendVideoFrame(base64Jpeg) {
    if (!this.isReady()) return;

    const frameMsg = {
      realtimeInput: {
        video: {
          mimeType: 'image/jpeg',
          data: base64Jpeg,
        },
      }
    };

    this.ws.send(JSON.stringify(frameMsg));
  }

  /**
   * Send microphone audio PCM chunk (Int16 PCM)
   * @param {Int16Array} int16PcmData 
   */
  sendAudioChunk(int16PcmData) {
    if (!this.isReady()) return;

    // Convert Int16Array to base64
    const uint8View = new Uint8Array(int16PcmData.buffer);
    let binary = '';
    const len = uint8View.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8View[i]);
    }
    const base64Data = btoa(binary);

    const audioMsg = {
      realtimeInput: {
        audio: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64Data,
        },
      }
    };

    this.ws.send(JSON.stringify(audioMsg));
  }

  isReady() {
    return this.isConnected && this.isSetupComplete && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Interrupt model response playback immediately (e.g. if student starts speaking)
   */
  interruptPlayback() {
    this.activeAudioSources.forEach(source => {
      try {
        source.stop();
      } catch {
        // Already stopped/ended
      }
    });
    this.activeAudioSources = [];
    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    }
  }

  disconnect() {
    this.interruptPlayback();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.isConnected = false;
    this.isSetupComplete = false;
  }
}

export const geminiLiveService = new GeminiLiveService();
export default geminiLiveService;
