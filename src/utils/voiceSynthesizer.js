/**
 * Voice narration.
 *
 * Gemini native audio only. This file optimizes creation latency with:
 * - streaming playback when Gemini returns audio chunks
 * - promise-based audio caching for repeats
 * - persistent AudioContext reuse after the first user gesture
 */

import { getGeminiApiKey } from '../services/geminiLiveService';

const GEMINI_TTS_MODEL = import.meta.env.VITE_GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const GEMINI_TTS_VOICE = import.meta.env.VITE_GEMINI_TTS_VOICE || 'Kore';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_TTS_SAMPLE_RATE = 24000;
const MAX_CACHE_ENTRIES = 40;

class VoiceSynthesizer {
  constructor() {
    this.currentSource = null;
    this.currentAudioCtx = null;
    this._unlocked = false;
    this._requestId = 0;
    this._audioPromiseCache = new Map();
    this._activeSources = new Set();
    this._nextPlayTime = 0;
  }

  stop() {
    this._requestId += 1;
    for (const source of this._activeSources) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
    }
    this._activeSources.clear();
    this.currentSource = null;
    if (this.currentAudioCtx) {
      this._nextPlayTime = this.currentAudioCtx.currentTime;
    }
  }

  unlock() {
    this._unlocked = true;
  }

  get isUnlocked() {
    return this._unlocked;
  }

  async getAudioContext() {
    if (!this.currentAudioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.currentAudioCtx = new AudioContextClass({ sampleRate: GEMINI_TTS_SAMPLE_RATE });
      this._nextPlayTime = this.currentAudioCtx.currentTime;
    }
    if (this.currentAudioCtx.state === 'suspended') {
      await this.currentAudioCtx.resume();
    }
    return this.currentAudioCtx;
  }

  buildGeminiBody(text) {
    return {
      contents: [
        {
          parts: [
            {
              text:
                'Read this as a warm STEM teacher speaking to a grade 9-11 student. ' +
                'Use a clear, encouraging, natural pace: ' +
                text,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: GEMINI_TTS_VOICE,
            },
          },
        },
      },
    };
  }

  getCacheKey(text) {
    return `${GEMINI_TTS_MODEL}:${GEMINI_TTS_VOICE}:${String(text || '').trim()}`;
  }

  rememberAudioPromise(key, promise) {
    this._audioPromiseCache.set(key, promise);
    if (this._audioPromiseCache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = this._audioPromiseCache.keys().next().value;
      this._audioPromiseCache.delete(oldestKey);
    }
    return promise;
  }

  async generateGeminiAudio(text) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured for voice narration.');
    }

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_TTS_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.buildGeminiBody(text)),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini native audio failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const inlineData = data?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;
    const base64Audio = inlineData?.data;
    if (!base64Audio) {
      throw new Error('Gemini native audio returned no audio data.');
    }
    return base64Audio;
  }

  getOrCreateAudioPromise(text) {
    const key = this.getCacheKey(text);
    const cached = this._audioPromiseCache.get(key);
    if (cached) return cached;

    const promise = this.generateGeminiAudio(text).catch((error) => {
      this._audioPromiseCache.delete(key);
      throw error;
    });
    return this.rememberAudioPromise(key, promise);
  }

  prefetch(texts) {
    const list = Array.isArray(texts) ? texts : [texts];
    list
      .map((text) => String(text || '').trim())
      .filter(Boolean)
      .forEach((text) => {
        this.getOrCreateAudioPromise(text).catch((error) => {
          console.warn('Gemini native audio prefetch failed:', error);
        });
      });
  }

  pcmBase64ToFloat32(base64Audio) {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    return float32;
  }

  async playPcmBase64(base64Audio, requestId, { onStart = null, onEnd = null, append = false } = {}) {
    if (requestId !== this._requestId) return;

    const audioCtx = await this.getAudioContext();
    const float32 = this.pcmBase64ToFloat32(base64Audio);
    const buffer = audioCtx.createBuffer(1, float32.length, GEMINI_TTS_SAMPLE_RATE);
    buffer.getChannelData(0).set(float32);

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.onended = () => {
      this._activeSources.delete(source);
      if (this.currentSource === source) this.currentSource = null;
      if (this._activeSources.size === 0) onEnd?.();
    };

    this.currentSource = source;
    this._activeSources.add(source);

    const now = audioCtx.currentTime;
    const playTime = append ? Math.max(now, this._nextPlayTime) : now;
    this._nextPlayTime = playTime + buffer.duration;
    if (this._activeSources.size === 1) onStart?.();
    source.start(playTime);
  }

  async streamGeminiAudio(text, requestId, { onStart = null, onEnd = null } = {}) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured for voice narration.');
    }

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_TTS_MODEL)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.buildGeminiBody(text)),
      }
    );

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Gemini streaming native audio failed: ${response.status} - ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let playedAnyChunk = false;

    const flushEvent = async (rawEvent) => {
      const dataLines = rawEvent
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .filter((line) => line && line !== '[DONE]');

      for (const dataLine of dataLines) {
        if (requestId !== this._requestId) return;
        const data = JSON.parse(dataLine);
        const parts = data?.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          const inlineData = part.inlineData || part.inline_data;
          const base64Audio = inlineData?.data;
          if (base64Audio) {
            playedAnyChunk = true;
            await this.playPcmBase64(base64Audio, requestId, {
              onStart,
              onEnd,
              append: true,
            });
          }
        }
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const events = buffer.split(/\n\n+/);
      buffer = events.pop() || '';
      for (const event of events) {
        await flushEvent(event);
      }
      if (done) break;
    }
    if (buffer.trim()) await flushEvent(buffer);

    if (!playedAnyChunk) {
      throw new Error('Gemini streaming native audio returned no audio chunks.');
    }
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

    this.streamGeminiAudio(trimmed, requestId, {
      onStart: onStartCallback,
      onEnd: onEndCallback,
    })
      .catch((streamError) => {
        console.warn('Gemini streaming narration unavailable, using cached generateContent audio:', streamError);
        return this.getOrCreateAudioPromise(trimmed)
      .then((base64Audio) =>
        this.playPcmBase64(base64Audio, requestId, {
          onStart: onStartCallback,
          onEnd: onEndCallback,
        })
        );
      })
      .catch((error) => {
        console.error('Gemini native audio narration failed:', error);
        onEndCallback?.();
      });
  }

  pause() {
    if (this.currentAudioCtx?.state === 'running') {
      this.currentAudioCtx.suspend().catch(() => undefined);
    }
  }

  resume() {
    if (this.currentAudioCtx?.state === 'suspended') {
      this.currentAudioCtx.resume().catch(() => undefined);
    }
  }
}

export const voiceSynthesizer = new VoiceSynthesizer();
export default voiceSynthesizer;
