/**
 * Voice narration: browser speechSynthesis (primary) with Transformers.js MMS TTS fallback.
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

  speakBrowser(text, { onStart = null, onEnd = null, onUnavailable = null } = {}) {
    if (!this.synth || !text?.trim()) {
      onUnavailable?.();
      return false;
    }

    try {
      if (this.synth.paused) this.synth.resume();
    } catch {
      // ignore
    }

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = 0.95;
    this.utterance.pitch = 1.05;
    const voices = this.synth.getVoices();
    const preferred =
      voices.find((v) => v.lang?.startsWith('en') && /google|natural|samantha|zira|microsoft.*natural/i.test(v.name)) ||
      voices.find((v) => v.lang?.startsWith('en-US')) ||
      voices.find((v) => v.lang?.startsWith('en'));
    if (preferred) this.utterance.voice = preferred;

    let started = false;
    this.utterance.onstart = () => {
      started = true;
      onStart?.();
    };
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
      if (!started) onUnavailable?.();
      else onEnd?.();
    };

    const start = () => {
      try {
        this.synth.speak(this.utterance);
      } catch (err) {
        console.warn('speechSynthesis.speak failed:', err);
        onUnavailable?.();
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
   * Speak with Transformers.js SpeechT5 TTS first (natural teacher voice); fall back to browser speechSynthesis on failure.
   */
  speak(text, onEndCallback = null, onStartCallback = null) {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      onEndCallback?.();
      return;
    }

    if (!this._unlocked) this.unlock();

    this.stop();

    const callbacks = { onStart: onStartCallback, onEnd: onEndCallback };
    const browserStarted = this.speakBrowser(trimmed, {
      ...callbacks,
      onUnavailable: () => {
        this.speakTransformers(trimmed, callbacks).then((ok) => {
          if (!ok) {
            console.warn('TTS unavailable: browser and Transformers.js both failed');
            onEndCallback?.();
          }
        });
      },
    });

    if (!browserStarted) {
      this.speakTransformers(trimmed, callbacks).then((ok) => {
        if (!ok) onEndCallback?.();
      });
    }
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
