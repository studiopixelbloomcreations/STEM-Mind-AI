/**
 * Voice narration: Transformers.js SpeechT5 TTS with browser speechSynthesis fallback.
 */

import { playSpeechSamples, preloadSpeechModels, synthesizeSpeech } from '../ml/transformersClient';

const BENIGN_SPEECH_ERRORS = new Set(['interrupted', 'canceled', 'cancelled']);

class VoiceSynthesizer {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.utterance = null;
    this.currentAudio = null;
    this.currentAudioCtx = null;
    this._voicesReady = false;
    this._unlocked = false;
    this._pendingSpeak = null;
    this._ttsWarmStarted = false;
    if (this.synth) {
      const primeVoices = () => {
        if (this.synth.getVoices().length > 0) this._voicesReady = true;
      };
      primeVoices();
      this.synth.addEventListener('voiceschanged', primeVoices, { once: true });
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.utterance = null;
    if (this.currentAudio) {
      try {
        this.currentAudio.stop?.();
        this.currentAudio.pause?.();
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
    if (this.currentAudioCtx) {
      this.currentAudioCtx.close().catch(() => undefined);
      this.currentAudioCtx = null;
    }
  }

  /**
   * Call after a user gesture (mic permission, tap, etc.) so autoplay policies allow TTS.
   */
  unlock() {
    if (this._unlocked) return;
    this._unlocked = true;
    if (!this._ttsWarmStarted) {
      this._ttsWarmStarted = true;
      preloadSpeechModels();
    }
    if (this.synth?.paused) {
      try {
        this.synth.resume();
      } catch {
        // ignore
      }
    }
    const pending = this._pendingSpeak;
    if (pending) {
      this._pendingSpeak = null;
      this.speak(pending.text, pending.onEnd, pending.onStart);
    }
  }

  get isUnlocked() {
    return this._unlocked;
  }

  speakBrowser(text, { onStart = null, onEnd = null } = {}) {
    if (!this.synth || !text?.trim()) {
      onEnd?.();
      return false;
    }

    try {
      if (this.synth.paused) this.synth.resume();
    } catch {
      // ignore
    }

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = 1;
    this.utterance.pitch = 1;
    const voices = this.synth.getVoices();
    const preferred =
      voices.find((v) => v.lang?.startsWith('en') && /google|natural|samantha|zira/i.test(v.name)) ||
      voices.find((v) => v.lang?.startsWith('en'));
    if (preferred) this.utterance.voice = preferred;

    this.utterance.onstart = () => onStart?.();
    this.utterance.onend = () => {
      this.utterance = null;
      onEnd?.();
    };
    this.utterance.onerror = (event) => {
      const code = event?.error || '';
      this.utterance = null;
      if (BENIGN_SPEECH_ERRORS.has(code)) {
        onEnd?.();
        return;
      }
      console.warn('Browser speech synthesis error:', code || event);
      onEnd?.();
    };

    const start = () => {
      try {
        this.synth.speak(this.utterance);
      } catch (err) {
        console.warn('speechSynthesis.speak failed:', err);
        onEnd?.();
      }
    };

    if (!this._voicesReady && this.synth.getVoices().length === 0) {
      this.synth.addEventListener('voiceschanged', start, { once: true });
    } else {
      start();
    }
    return true;
  }

  async speakTransformers(text, { onStart = null, onEnd = null } = {}) {
    try {
      const result = await synthesizeSpeech(text);
      if (!result?.audio?.length) return false;
      const playback = await playSpeechSamples(result.audio, result.sampling_rate, {
        onStart,
        onEnd: () => {
          if (this.currentAudio === playback?.source) this.currentAudio = null;
          if (this.currentAudioCtx === playback?.audioCtx) this.currentAudioCtx = null;
          onEnd?.();
        },
      });
      this.currentAudio = playback.source;
      this.currentAudioCtx = playback.audioCtx;
      return true;
    } catch (err) {
      console.warn('Transformers TTS failed:', err);
      return false;
    }
  }

  /**
   * Speak with Transformers.js TTS when available; fall back to browser speech on any failure.
   */
  speak(text, onEndCallback = null, onStartCallback = null) {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      onEndCallback?.();
      return;
    }

    if (!this._unlocked) {
      this._pendingSpeak = { text: trimmed, onEnd: onEndCallback, onStart: onStartCallback };
      return;
    }

    this.stop();

    const callbacks = { onStart: onStartCallback, onEnd: onEndCallback };
    const runBrowserFallback = (reason) => {
      if (reason) console.warn('TTS fallback:', reason);
      window.setTimeout(() => {
        this.speakBrowser(trimmed, callbacks);
      }, 40);
    };

    this.speakTransformers(trimmed, callbacks).then((ok) => {
      if (!ok) runBrowserFallback('transformers unavailable');
    });
  }

  pause() {
    if (this.synth?.speaking) this.synth.pause();
    if (this.currentAudioCtx?.state === 'running') {
      this.currentAudioCtx.suspend().catch(() => undefined);
    }
  }

  resume() {
    if (this.synth?.paused) this.synth.resume();
    if (this.currentAudioCtx?.state === 'suspended') {
      this.currentAudioCtx.resume().catch(() => undefined);
    }
  }
}

export const voiceSynthesizer = new VoiceSynthesizer();
export default voiceSynthesizer;
