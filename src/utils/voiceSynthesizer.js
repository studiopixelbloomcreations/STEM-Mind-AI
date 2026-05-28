/**
 * Voice Narration utility using Puter.js ElevenLabs TTS.
 */

class VoiceSynthesizer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.currentAudio = null;
  }

  speakPuter(text, onEndCallback = null) {
    this.stop();

    if (window.puter && window.puter.ai && window.puter.ai.txt2speech) {
      window.puter.ai.txt2speech(text, {
        provider: "elevenlabs",
        voice: "Xb7hH8MSUJpSbSDYk0k2" // Voice ID for ElevenLabs "Alice"
      })
      .then(audio => {
        this.currentAudio = audio;
        if (onEndCallback) {
          audio.addEventListener('ended', onEndCallback);
        }
        audio.play().catch(err => {
          console.error("Puter audio playback failed:", err);
          if (onEndCallback) onEndCallback();
        });
      })
      .catch(err => {
        console.error("Puter txt2speech error:", err);
        if (onEndCallback) onEndCallback();
      });
    } else {
      console.warn("Puter.js not available, falling back to browser speech synthesis.");
      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.onend = () => {
        this.utterance = null;
        if (onEndCallback) onEndCallback();
      };
      this.synth.speak(this.utterance);
    }
  }

  /**
   * Speak using Puter voice, with browser speech synthesis as a fallback when Puter is unavailable.
   */
  speak(text, onEndCallback = null) {
    this.speakPuter(text, onEndCallback);
  }

  pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
    if (this.currentAudio) {
      this.currentAudio.play();
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}

export const voiceSynthesizer = new VoiceSynthesizer();
export default voiceSynthesizer;
