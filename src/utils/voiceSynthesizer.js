/**
 * Voice narration: Puter ElevenLabs TTS with browser speechSynthesis fallback.
 */

const BENIGN_SPEECH_ERRORS = new Set(['interrupted', 'canceled', 'cancelled']);

class VoiceSynthesizer {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.utterance = null;
    this.currentAudio = null;
    this._voicesReady = false;
    this._unlocked = false;
    this._pendingSpeak = null;
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
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  /**
   * Call after a user gesture (mic permission, tap, etc.) so autoplay policies allow TTS.
   */
  unlock() {
    if (this._unlocked) return;
    this._unlocked = true;
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

  speakPuter(text, { onStart = null, onEnd = null } = {}) {
    if (!window.puter?.ai?.txt2speech) {
      return Promise.resolve(false);
    }

    return window.puter.ai
      .txt2speech(text, {
        provider: 'elevenlabs',
        voice: 'Xb7hH8MSUJpSbSDYk0k2',
      })
      .then((audio) => {
        this.currentAudio = audio;
        const cleanup = () => {
          if (this.currentAudio === audio) this.currentAudio = null;
        };
        audio.addEventListener('play', () => onStart?.(), { once: true });
        audio.addEventListener('ended', () => {
          cleanup();
          onEnd?.();
        });
        audio.addEventListener('error', () => {
          cleanup();
          onEnd?.();
        });
        const playResult = audio.play();
        if (playResult?.then) {
          return playResult.then(() => true).catch(() => false);
        }
        return true;
      })
      .catch((err) => {
        console.warn('Puter txt2speech failed:', err);
        return false;
      });
  }

  /**
   * Speak with Puter when available; fall back to browser speech on any failure.
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

    if (window.puter?.ai?.txt2speech) {
      let started = false;
      const safeStart = () => {
        if (started) return;
        started = true;
        callbacks.onStart?.();
      };

      window.puter.ai
        .txt2speech(trimmed, {
          provider: 'elevenlabs',
          voice: 'Xb7hH8MSUJpSbSDYk0k2',
        })
        .then((audio) => {
          this.currentAudio = audio;
          const finish = () => {
            if (this.currentAudio === audio) this.currentAudio = null;
            callbacks.onEnd?.();
          };
          audio.addEventListener('play', safeStart, { once: true });
          audio.addEventListener('ended', finish, { once: true });
          audio.addEventListener(
            'error',
            () => {
              this.currentAudio = null;
              runBrowserFallback('puter audio element error');
            },
            { once: true }
          );

          const playPromise = audio.play();
          if (!playPromise?.then) return;
          playPromise
            .then(() => safeStart())
            .catch((err) => {
              this.currentAudio = null;
              runBrowserFallback(err?.message || 'autoplay blocked');
            });
        })
        .catch((err) => runBrowserFallback(err?.message || 'puter request failed'));
      return;
    }

    runBrowserFallback('puter unavailable');
  }

  pause() {
    if (this.synth?.speaking) this.synth.pause();
    if (this.currentAudio) this.currentAudio.pause();
  }

  resume() {
    if (this.synth?.paused) this.synth.resume();
    if (this.currentAudio) this.currentAudio.play().catch(() => undefined);
  }
}

export const voiceSynthesizer = new VoiceSynthesizer();
export default voiceSynthesizer;
