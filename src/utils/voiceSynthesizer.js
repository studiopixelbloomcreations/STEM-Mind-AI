/**
 * Voice Narration utility using Kokoro-82M TTS via Hugging Face Gradio Spaces.
 * Puter.js ElevenLabs TTS is temporarily disabled but can be re-enabled instantly.
 */
import { Client } from "@gradio/client";

// ═══════════════════════════════════════════════════════════════
// TOGGLE: Set to true to re-enable Puter.js ElevenLabs voice
const USE_PUTER_SPEECH = false;
// ═══════════════════════════════════════════════════════════════

// Kokoro-82M Gradio Space configuration (free, unlimited, no key needed)
const KOKORO_SPACES = [
  "Pendrokar/Kokoro-TTS",    // Primary — has /generate_first endpoint
  "Remsky/Kokoro-TTS-Zero",  // Fallback
];
const KOKORO_VOICE = "af_heart"; // Female American English voice
const KOKORO_SPEED = 1;

// Reusable Gradio client cache to avoid reconnecting on every call
let _gradioClientCache = null;
let _gradioClientSpaceIndex = 0;

async function getGradioClient() {
  if (_gradioClientCache) return _gradioClientCache;

  for (let i = _gradioClientSpaceIndex; i < KOKORO_SPACES.length; i++) {
    try {
      console.log(`[Kokoro TTS] Connecting to Space: ${KOKORO_SPACES[i]}...`);
      _gradioClientCache = await Client.connect(KOKORO_SPACES[i]);
      _gradioClientSpaceIndex = i;
      console.log(`[Kokoro TTS] Connected to ${KOKORO_SPACES[i]} ✓`);
      return _gradioClientCache;
    } catch (err) {
      console.warn(`[Kokoro TTS] Failed to connect to ${KOKORO_SPACES[i]}:`, err);
      _gradioClientCache = null;
    }
  }
  throw new Error("All Kokoro TTS spaces are unreachable.");
}

class VoiceSynthesizer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.currentAudio = null;
  }

  /**
   * Speak using Kokoro-82M via Gradio Space (primary voice engine).
   * No API key, no limits, free forever.
   */
  async speakKokoro(text, onEndCallback = null) {
    this.stop();

    try {
      const client = await getGradioClient();

      console.log(`[Kokoro TTS] Generating speech for: "${text.substring(0, 60)}..."`);
      const result = await client.predict("/generate_first", {
        text: text,
        voice: KOKORO_VOICE,
        speed: KOKORO_SPEED,
        use_gpu: "False",
        lang: "en-us",
      });

      // result.data[0] is the audio file info object with a .url property
      const audioData = result.data[0];
      const audioUrl = audioData.url || audioData;

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      if (onEndCallback) {
        audio.addEventListener('ended', onEndCallback);
      }

      await audio.play();
      console.log("[Kokoro TTS] Audio playing ✓");
    } catch (err) {
      console.error("[Kokoro TTS] Generation failed:", err);

      // Reset client cache so next call tries fresh connection
      _gradioClientCache = null;

      // Try the next space on failure
      if (_gradioClientSpaceIndex < KOKORO_SPACES.length - 1) {
        _gradioClientSpaceIndex++;
        console.log(`[Kokoro TTS] Retrying with next space...`);
        return this.speakKokoro(text, onEndCallback);
      }

      // Reset to primary space for next attempt
      _gradioClientSpaceIndex = 0;
      console.error("[Kokoro TTS] All spaces failed. Speech not generated.");
      if (onEndCallback) onEndCallback();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PUTER.JS (DISABLED) — Change USE_PUTER_SPEECH to true to re-enable
  // ═══════════════════════════════════════════════════════════════
  speakPuter(text, onEndCallback = null) {
    if (!USE_PUTER_SPEECH) {
      // Puter.js disabled → route to Kokoro-82M via Gradio
      this.speakKokoro(text, onEndCallback);
      return;
    }

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
      console.warn("Puter.js not available.");
      if (onEndCallback) onEndCallback();
    }
  }

  /**
   * Legacy browser TTS — kept for the "Listen to Explanation" button on correct answers.
   */
  speak(text, onEndCallback = null) {
    // Route all speech through Kokoro instead of browser TTS
    this.speakKokoro(text, onEndCallback);
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
