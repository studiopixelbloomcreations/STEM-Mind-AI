/**
 * Shared Gemini Live WebSocket session.
 * Every product surface (STEM Live, Harmony council, narrator, vision) uses this.
 * No REST generateContent calls.
 */

import {
  LIVE_API_ENDPOINT,
  GEMINI_LIVE_AUDIO_MODELS,
  GEMINI_LIVE_TEXT_MODELS,
  DEFAULT_LIVE_VOICE,
  getGeminiApiKey,
} from './geminiConfig';
import { emitLiveStatus } from './liveStatus';

const parseMaybeJson = async (eventData) => {
  if (eventData instanceof Blob) {
    return JSON.parse(await eventData.text());
  }
  if (typeof eventData === 'string') {
    return JSON.parse(eventData);
  }
  return eventData;
};

export class GeminiLiveSession {
  constructor() {
    this.ws = null;
    this.audioContext = null;
    this.nextPlayTime = 0;
    this.callbacks = {
      onTranscription: null,
      onAudioStart: null,
      onAudioEnd: null,
      onError: null,
      onClose: null,
      onStatusChange: null,
      onText: null,
    };
    this.isConnected = false;
    this.isSetupComplete = false;
    this.activeAudioSources = [];
    this.currentModelIndex = 0;
    this.connectAttemptId = 0;
    this.modality = 'AUDIO';
    this.pendingTurn = null;
    this.turnBuffer = '';
  }

  setCallback(name, fn) {
    this.callbacks[name] = fn;
  }

  isReady() {
    return this.isConnected && this.isSetupComplete && this.ws?.readyState === WebSocket.OPEN;
  }

  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  async connect({
    systemInstruction = '',
    modality = 'AUDIO',
    voice = DEFAULT_LIVE_VOICE,
    temperature = 0.7,
    models = null,
  } = {}) {
    const key = getGeminiApiKey();
    if (!key) {
      const errorMsg =
        'Gemini API Key is not configured. Please define VITE_GEMINI_API_KEY in your .env file.';
      this.callbacks.onError?.(new Error(errorMsg));
      throw new Error(errorMsg);
    }

    this.disconnect();
    const attemptId = ++this.connectAttemptId;
    this.modality = modality === 'TEXT' ? 'TEXT' : 'AUDIO';
    this.modelList = models || (this.modality === 'TEXT' ? GEMINI_LIVE_TEXT_MODELS : GEMINI_LIVE_AUDIO_MODELS);

    if (this.modality === 'AUDIO') {
      await this.initAudioContext();
      this.nextPlayTime = this.audioContext.currentTime;
    }

    emitLiveStatus({ status: 'progress', label: 'Connecting to Gemini Live', progress: 20, task: this.modality });
    this.callbacks.onStatusChange?.('Connecting to Gemini...');

    return this._openSocket({
      key,
      systemInstruction,
      voice,
      temperature,
      attemptId,
    });
  }

  _openSocket({ key, systemInstruction, voice, temperature, attemptId }) {
    const modelIndex = this.currentModelIndex || 0;
    const selectedModel = this.modelList[modelIndex % this.modelList.length];
    const url = `${LIVE_API_ENDPOINT}?key=${encodeURIComponent(key)}`;

    return new Promise((resolve, reject) => {
      let settled = false;
      const resolveOnce = (value) => {
        if (!settled) {
          settled = true;
          resolve(value);
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
          emitLiveStatus({ status: 'progress', label: `Live setup (${selectedModel.split('/').pop()})`, progress: 55, task: this.modality });

          const generationConfig = {
            responseModalities: [this.modality],
            temperature,
          };

          if (this.modality === 'AUDIO') {
            generationConfig.speechConfig = {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice || DEFAULT_LIVE_VOICE,
                },
              },
            };
          }

          const setupMsg = {
            setup: {
              model: selectedModel,
              generationConfig,
              systemInstruction: {
                role: 'system',
                parts: [{ text: systemInstruction || 'You are STEMMind, a friendly STEM teacher.' }],
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
          };

          ws.send(JSON.stringify(setupMsg));
        };

        ws.onmessage = async (event) => {
          if (attemptId !== this.connectAttemptId) return;
          try {
            const data = await parseMaybeJson(event.data);
            if (data.setupComplete || data.setup_complete) {
              this.isSetupComplete = true;
              emitLiveStatus({ status: 'done', label: 'Gemini Live ready', progress: 100, task: this.modality });
              this.callbacks.onStatusChange?.('Connected');
              resolveOnce(this);
              return;
            }
            this.handleServerMessage(data);
          } catch (error) {
            console.error('Error parsing Gemini Live WebSocket message:', error);
          }
        };

        ws.onerror = (err) => {
          if (attemptId !== this.connectAttemptId) return;
          this.callbacks.onError?.(err);
          rejectOnce(err instanceof Error ? err : new Error('Gemini Live socket error'));
        };

        ws.onclose = (event) => {
          if (attemptId !== this.connectAttemptId) return;
          this.isConnected = false;
          this.isSetupComplete = false;
          console.warn(`[Gemini Live Close] Code: ${event.code}, Reason: ${event.reason || 'None provided'}`);

          if (event.code === 1007 && modelIndex < this.modelList.length - 1) {
            this.currentModelIndex = modelIndex + 1;
            this._openSocket({ key, systemInstruction, voice, temperature, attemptId: this.connectAttemptId })
              .then(resolveOnce)
              .catch(rejectOnce);
            return;
          }

          this.failPendingTurn(new Error(event.reason || `Gemini Live closed (${event.code})`));
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
    const serverContent = msg.serverContent || msg.server_content;
    const modelTurn = serverContent?.modelTurn || serverContent?.model_turn;
    const parts = modelTurn?.parts || [];

    if (serverContent?.interrupted) {
      this.interruptPlayback();
    }

    let chunkText = '';

    for (const part of parts) {
      const inlineData = part.inlineData || part.inline_data;
      if (inlineData && String(inlineData.mimeType || inlineData.mime_type || '').startsWith('audio/pcm')) {
        this.playPCMChunk(inlineData.data);
      }
      if (part.text) chunkText += part.text;
    }

    const outputTranscription =
      serverContent?.outputTranscription?.text || serverContent?.output_transcription?.text;
    if (outputTranscription?.trim()) {
      this.callbacks.onTranscription?.(outputTranscription.trim(), 'AI');
      chunkText += (chunkText ? '' : outputTranscription);
    }

    if (chunkText.trim()) {
      this.turnBuffer += chunkText;
      this.callbacks.onText?.(chunkText);
      this.callbacks.onTranscription?.(chunkText.trim(), 'AI');
      this.bumpIdleResolve();
    }

    const userTranscription =
      serverContent?.inputTranscription?.text || serverContent?.input_transcription?.text;
    if (userTranscription?.trim()) {
      this.callbacks.onTranscription?.(userTranscription.trim(), 'User');
    }

    const turnComplete = Boolean(
      serverContent?.turnComplete ||
        serverContent?.turn_complete ||
        serverContent?.generationComplete ||
        serverContent?.generation_complete
    );

    if (turnComplete) {
      this.resolvePendingTurn();
    }
  }

  async playPCMChunk(base64Data) {
    if (!this.audioContext || !base64Data) return;

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i += 1) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

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
      this.activeAudioSources = this.activeAudioSources.filter((item) => item !== source);
      if (this.activeAudioSources.length === 0) {
        this.callbacks.onAudioEnd?.();
      }
    };

    source.start(playTime);
    this.nextPlayTime = playTime + audioBuffer.duration;
  }

  sendTextMessage(text, { images = [], turnComplete = true } = {}) {
    if (!this.isReady() || !String(text || '').trim() && images.length === 0) return;

    const parts = [];
    if (String(text || '').trim()) {
      parts.push({ text: String(text) });
    }
    images.forEach((image) => {
      if (!image?.data) return;
      parts.push({
        inlineData: {
          mimeType: image.mimeType || 'image/jpeg',
          data: image.data,
        },
      });
    });

    this.ws.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts }],
          turnComplete,
        },
      })
    );
  }

  sendVideoFrame(base64Jpeg) {
    if (!this.isReady() || !base64Jpeg) return;
    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          video: {
            mimeType: 'image/jpeg',
            data: base64Jpeg,
          },
        },
      })
    );
  }

  sendAudioChunk(int16PcmData) {
    if (!this.isReady() || !int16PcmData) return;
    const uint8View = new Uint8Array(int16PcmData.buffer);
    let binary = '';
    for (let i = 0; i < uint8View.byteLength; i += 1) {
      binary += String.fromCharCode(uint8View[i]);
    }

    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: btoa(binary),
          },
        },
      })
    );
  }

  ask(text, { images = [], timeoutMs = 45000 } = {}) {
    if (!this.isReady()) {
      return Promise.reject(new Error('Gemini Live session is not ready.'));
    }

    this.failPendingTurn(new Error('Superseded by a new Live turn.'));
    this.turnBuffer = '';

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pendingTurn = null;
        reject(new Error('Gemini Live turn timed out.'));
      }, timeoutMs);

      this.pendingTurn = {
        resolve: (value) => {
          window.clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      };

      this.sendTextMessage(text, { images, turnComplete: true });
    });
  }

  bumpIdleResolve() {
    if (!this.pendingTurn) return;
    window.clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => this.resolvePendingTurn(), 1600);
  }

  resolvePendingTurn() {
    if (!this.pendingTurn) return;
    window.clearTimeout(this.idleTimer);
    const text = this.turnBuffer.trim();
    const pending = this.pendingTurn;
    this.pendingTurn = null;
    pending.resolve({ text });
  }

  failPendingTurn(error) {
    if (!this.pendingTurn) return;
    const pending = this.pendingTurn;
    this.pendingTurn = null;
    pending.reject(error);
  }

  interruptPlayback() {
    this.activeAudioSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    });
    this.activeAudioSources = [];
    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    }
  }

  disconnect() {
    this.interruptPlayback();
    this.failPendingTurn(new Error('Gemini Live session disconnected.'));
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

export async function liveAsk({
  systemInstruction,
  prompt,
  images = [],
  modality = 'TEXT',
  temperature = 0.7,
  timeoutMs = 45000,
  voice = DEFAULT_LIVE_VOICE,
}) {
  const session = new GeminiLiveSession();
  try {
    await session.connect({ systemInstruction, modality, temperature, voice });
    const result = await session.ask(prompt, { images, timeoutMs });
    return result.text || '';
  } finally {
    session.disconnect();
  }
}

export default GeminiLiveSession;
