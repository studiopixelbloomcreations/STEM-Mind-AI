/**
 * Voice Narration utility using browser Speech Synthesis API.
 */
class VoiceSynthesizer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
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

  pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const voiceSynthesizer = new VoiceSynthesizer();
export default voiceSynthesizer;
