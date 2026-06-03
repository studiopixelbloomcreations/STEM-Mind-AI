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

// Try to resolve the Gemini API Key
export const getGeminiApiKey = () => {
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
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
    this.activeAudioSources = [];
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
    await this.initAudioContext();
    this.nextPlayTime = this.audioContext.currentTime;

    const modelsToTry = [
      'models/gemini-2.5-flash-native-audio-preview-12-2025',
      'models/gemini-2.0-flash-exp',
      'models/gemini-2.0-flash-realtime-exp'
    ];
    const modelIndex = this.currentModelIndex || 0;
    const selectedModel = modelsToTry[modelIndex % modelsToTry.length];
    
    console.log(`[Gemini WebSocket] Connecting using model: ${selectedModel}`);
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${key}`;
    this.callbacks.onStatusChange?.('Connecting to Gemini...');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.callbacks.onStatusChange?.('Connected');
          
          // Send initial Setup payload
          const setupMsg = {
            setup: {
              model: selectedModel,
              generationConfig: {
                responseModalities: ['AUDIO']
              }
            }
          };

          if (!this.useMinimalSetup) {
            setupMsg.setup.systemInstruction = {
              parts: [
                {
                  text: systemInstruction || 
                    'You are a friendly, warm, and highly visual STEM teacher named STEMMind. ' +
                    'You respond concisely in natural spoken language. ' +
                    'When the user shows you items on their webcam, identify them immediately (like a ball, book, etc.) ' +
                    'and guide the conversation around STEM concepts relating to them. Speak concisely to keep the flow.'
                }
              ]
            };
          }

          this.ws.send(JSON.stringify(setupMsg));
          resolve(this);
        };

        this.ws.onmessage = async (event) => {
          try {
            let data;
            if (event.data instanceof Blob) {
              const text = await event.data.text();
              data = JSON.parse(text);
            } else {
              data = JSON.parse(event.data);
            }

            this.handleServerMessage(data);
          } catch (e) {
            console.error('Error parsing Gemini Live WebSocket message:', e);
          }
        };

        this.ws.onerror = (err) => {
          this.callbacks.onError?.(err);
          reject(err);
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          console.warn(`[Gemini WebSocket Close] Code: ${event.code}, Reason: ${event.reason || 'None provided'}`);
          
          // Fallback logic for invalid argument (code 1007)
          if (event.code === 1007) {
            if (modelIndex < modelsToTry.length - 1) {
              console.log(`[Gemini WebSocket Fallback] Retrying with next model...`);
              this.currentModelIndex = modelIndex + 1;
              this.connect(systemInstruction).then(resolve).catch(reject);
              return;
            } else if (!this.useMinimalSetup) {
              console.log(`[Gemini WebSocket Fallback] All models failed. Retrying with minimal setup payload...`);
              this.useMinimalSetup = true;
              this.currentModelIndex = 0;
              this.connect(systemInstruction).then(resolve).catch(reject);
              return;
            }
          }

          this.callbacks.onStatusChange?.('Disconnected');
          this.callbacks.onClose?.(event);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  handleServerMessage(msg) {
    // 1. Check for audio output content
    const parts = msg.serverContent?.modelTurn?.parts || [];
    for (const part of parts) {
      // Handle voice output audio
      if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
        const base64Audio = part.inlineData.data;
        this.playPCMChunk(base64Audio);
      }
    }

    // 2. Check for speech-to-text transcriptions
    const modelTranscriptions = msg.serverContent?.modelTurn?.parts
      ?.map(p => p.text)
      .filter(Boolean)
      .join(' ');
    
    if (modelTranscriptions && modelTranscriptions.trim()) {
      this.callbacks.onTranscription?.(modelTranscriptions.trim(), 'AI');
    }

    // Handle user transcription (what the user said) if available
    const userTranscription = msg.serverContent?.turnComplete?.transcription;
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
    if (!this.isConnected || !this.ws) return;
    
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
    if (!this.isConnected || !this.ws) return;

    const frameMsg = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'image/jpeg',
            data: base64Jpeg
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(frameMsg));
  }

  /**
   * Send microphone audio PCM chunk (Int16 PCM)
   * @param {Int16Array} int16PcmData 
   */
  sendAudioChunk(int16PcmData) {
    if (!this.isConnected || !this.ws) return;

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
        mediaChunks: [
          {
            mimeType: 'audio/pcm',
            data: base64Data
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(audioMsg));
  }

  /**
   * Interrupt model response playback immediately (e.g. if student starts speaking)
   */
  interruptPlayback() {
    this.activeAudioSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
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
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const geminiLiveService = new GeminiLiveService();
export default geminiLiveService;
