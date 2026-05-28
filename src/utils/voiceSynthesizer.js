/**
 * Voice Narration utility using browser Speech Synthesis API and Puter.js ElevenLabs TTS.
 */
class VoiceSynthesizer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.currentAudio = null;
  }

  speak(text, onEndCallback = null) {
    if (!this.synth) {
      console.warn('Speech synthesis is not supported on this browser.');
      return;
    }

    this.stop();

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;

    // Pick a high-quality English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (voice) => voice.lang.startsWith('en-') && voice.name.includes('Google')
    ) || voices.find((voice) => voice.lang.startsWith('en-'));

    if (preferredVoice) {
      this.utterance.voice = preferredVoice;
    }

    if (onEndCallback) {
      this.utterance.onend = onEndCallback;
    }

    this.synth.speak(this.utterance);
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
          console.error("Puter audio playback failed, falling back to local TTS:", err);
          this.speak(text, onEndCallback);
        });
      })
      .catch(err => {
        console.error("Puter txt2speech error, falling back to local TTS:", err);
        this.speak(text, onEndCallback);
      });
    } else {
      // Fallback
      this.speak(text, onEndCallback);
    }
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

