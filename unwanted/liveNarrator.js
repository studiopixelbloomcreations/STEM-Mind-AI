/**
 * Gemini Live narrator — spoken voice via the Live AUDIO socket.
 * Replaces REST TTS / Transformers SpeechT5.
 */

import { GeminiLiveSession } from './geminiLiveSession';
import { DEFAULT_LIVE_VOICE } from './geminiConfig';

const NARRATOR_INSTRUCTION =
  'You are the STEM Mind AI voice narrator. ' +
  'Read the user message aloud as a warm, encouraging STEM teacher speaking to a grade 9-11 student. ' +
  'Speak the provided words naturally. Do not add a long extra lecture. ' +
  'Keep a clear, friendly pace.';

class LiveNarrator {
  constructor() {
    this.session = null;
    this.connecting = null;
    this._requestId = 0;
    this._unlocked = false;
    this._speaking = false;
    this._endCallback = null;
  }

  get isUnlocked() {
    return this._unlocked;
  }

  unlock() {
    this._unlocked = true;
  }

  async ensureSession() {
    if (this.session?.isReady()) return this.session;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      const session = new GeminiLiveSession();
      session.setCallback('onAudioStart', () => {
        this._speaking = true;
      });
      session.setCallback('onAudioEnd', () => {
        this._speaking = false;
        const cb = this._endCallback;
        this._endCallback = null;
        cb?.();
      });
      session.setCallback('onError', (error) => {
        console.error('Gemini Live narrator error:', error);
      });
      await session.connect({
        systemInstruction: NARRATOR_INSTRUCTION,
        modality: 'AUDIO',
        voice: DEFAULT_LIVE_VOICE,
        temperature: 0.4,
      });
      this.session = session;
      return session;
    })();

    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  stop() {
    this._requestId += 1;
    this._endCallback = null;
    this._speaking = false;
    this.session?.interruptPlayback();
  }

  prefetch() {
    // Live audio is generated per turn; prefetch is a no-op kept for call-site compatibility.
  }

  speak(text, onEndCallback = null, onStartCallback = null) {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      onEndCallback?.();
      return;
    }

    this.unlock();
    this.stop();
    const requestId = this._requestId;
    this._endCallback = () => {
      if (requestId === this._requestId) onEndCallback?.();
    };

    this.ensureSession()
      .then(async (session) => {
        if (requestId !== this._requestId) return;
        onStartCallback?.();
        await session.ask(`Please read this aloud now:\n${trimmed}`, { timeoutMs: 60000 });
        if (requestId === this._requestId && !this._speaking) {
          const cb = this._endCallback;
          this._endCallback = null;
          cb?.();
        }
      })
      .catch((error) => {
        console.error('Gemini Live narration failed:', error);
        if (requestId === this._requestId) {
          this._endCallback = null;
          onEndCallback?.();
        }
      });
  }

  pause() {
    if (this.session?.audioContext?.state === 'running') {
      this.session.audioContext.suspend().catch(() => undefined);
    }
  }

  resume() {
    if (this.session?.audioContext?.state === 'suspended') {
      this.session.audioContext.resume().catch(() => undefined);
    }
  }
}

export const voiceSynthesizer = new LiveNarrator();
export const liveNarrator = voiceSynthesizer;
export default voiceSynthesizer;
