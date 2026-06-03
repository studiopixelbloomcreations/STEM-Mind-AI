/**
 * Voice narration.
 *
 * Browser speech synthesis is the default because it starts almost instantly.
 * Gemini native audio remains available with VITE_NARRATION_ENGINE=gemini when
 * voice quality matters more than first-audio latency.
 */

import { getGeminiApiKey } from '../services/geminiLiveService';

const GEMINI_TTS_MODEL = import.meta.env.VITE_GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const GEMINI_TTS_VOICE = import.meta.env.VITE_GEMINI_TTS_VOICE || 'Kore';
const NARRATION_ENGINE = import.meta.env.VITE_NARRATION_ENGINE || 'browser';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_TTS_SAMPLE_RATE = 24000;

class VoiceSynthesizer {
  constructor() {
    this.currentSource = null;
    this.currentAudioCtx = null;
    this.currentUtterance = null;
    this._unlocked = false;
    this._requestId = 0;
    this._voices = [];

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this._voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this._voices = window.speechSynthesis.getVoices();
      };
    }
  }

  stop() {
    this._requestId += 1;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped.
      }
      this.currentSource = null;
    }
    if (this.currentAudioCtx) {
      this.currentAudioCtx.close().catch(() => undefined);
      this.currentAudioCtx = null;
    }
  }

  unlock() {
    this._unlocked = true;
  }

  get isUnlocked() {
    return this._unlocked;
  }

  getBrowserVoice() {
    const voices = this._voices.length
      ? this._voices
      : window.speechSynthesis?.getVoices?.() || [];
    return (
      voices.find((voice) => /Google US English|Microsoft Aria|Microsoft Jenny/i.test(voice.name)) ||
      voices.find((voice) => /^en(-|_)/i.test(voice.lang)) ||
      voices[0] ||
      null
    );
  }

  speakBrowser(text, onEndCallback = null, onStartCallback = null) {
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.getBrowserVoice();
    utterance.lang = utterance.voice?.lang || 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => onStartCallback?.();
    utterance.onend = () => {
      if (this.currentUtterance === utterance) this.currentUtterance = null;
      onEndCallback?.();
    };
    utterance.onerror = () => {
      if (this.currentUtterance === utterance) this.currentUtterance = null;
      onEndCallback?.();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
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
        body: JSON.stringify({
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
        }),
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

  async playPcmBase64(base64Audio, requestId, { onStart = null, onEnd = null } = {}) {
    if (requestId !== this._requestId) return;

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

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContextClass({ sampleRate: GEMINI_TTS_SAMPLE_RATE });
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const buffer = audioCtx.createBuffer(1, float32.length, GEMINI_TTS_SAMPLE_RATE);
    buffer.getChannelData(0).set(float32);

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.onended = () => {
      if (this.currentSource === source) this.currentSource = null;
      if (this.currentAudioCtx === audioCtx) this.currentAudioCtx = null;
      audioCtx.close().catch(() => undefined);
      onEnd?.();
    };

    this.currentAudioCtx = audioCtx;
    this.currentSource = source;
    onStart?.();
    source.start();
  }

  speak(text, onEndCallback = null, onStartCallback = null) {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      onEndCallback?.();
      return;
    }

    this.unlock();
    this.stop();

    if (NARRATION_ENGINE !== 'gemini' && this.speakBrowser(trimmed, onEndCallback, onStartCallback)) {
      return;
    }

    const requestId = this._requestId;

    this.generateGeminiAudio(trimmed)
      .then((base64Audio) =>
        this.playPcmBase64(base64Audio, requestId, {
          onStart: onStartCallback,
          onEnd: onEndCallback,
        })
      )
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
