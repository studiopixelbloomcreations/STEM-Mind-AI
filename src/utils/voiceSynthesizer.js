/**
 * Voice Narration utility using Kokoro-82M TTS via Hugging Face Gradio Spaces.
 * Puter.js ElevenLabs TTS is temporarily disabled but can be re-enabled instantly.
 */
import { Client } from "@gradio/client";

// ═══════════════════════════════════════════════════════════════
// TOGGLE: Set to true to re-enable Puter.js ElevenLabs voice
const USE_PUTER_SPEECH = false;
// ═══════════════════════════════════════════════════════════════

// Kokoro-82M Gradio Spaces configurations (free, unlimited, no key needed)
const KOKORO_SPACES = [
  {
    name: "Remsky/Kokoro-TTS-Zero",
    endpoint: "/generate_speech_from_ui",
    getParams: (text) => [text, ["af_heart"], 1.0]
  },
  {
    name: "brainzcode/hexgrad-Kokoro-82M",
    endpoint: "/predict",
    getParams: (text) => [text]
  },
  {
    name: "tgu6/hexgrad-Kokoro-82M",
    endpoint: "/predict",
    getParams: (text) => [text]
  },
  {
    name: "Pendrokar/Kokoro-TTS",
    endpoint: "/generate_first",
    getParams: (text) => [text, "af_heart", 1, "False", "en-us"]
  }
];

let _activeSpaceIndex = 0;
let _gradioClient = null;

async function getGradioClient() {
  if (_gradioClient) return { client: _gradioClient, config: KOKORO_SPACES[_activeSpaceIndex] };

  for (let i = 0; i < KOKORO_SPACES.length; i++) {
    const spaceIdx = (_activeSpaceIndex + i) % KOKORO_SPACES.length;
    const spaceConfig = KOKORO_SPACES[spaceIdx];
    try {
      console.log(`[Kokoro TTS] Connecting to Space: ${spaceConfig.name}...`);
      const client = await Client.connect(spaceConfig.name);
      _gradioClient = client;
      _activeSpaceIndex = spaceIdx;
      console.log(`[Kokoro TTS] Connected to ${spaceConfig.name} ✓`);
      return { client, config: spaceConfig };
    } catch (err) {
      console.warn(`[Kokoro TTS] Failed to connect to ${spaceConfig.name}:`, err);
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

    let attempts = 0;
    while (attempts < KOKORO_SPACES.length) {
      try {
        const { client, config } = await getGradioClient();
        console.log(`[Kokoro TTS] Generating speech using ${config.name} (endpoint: ${config.endpoint}) for: "${text.substring(0, 60)}..."`);
        
        const params = config.getParams(text);
        const result = await client.predict(config.endpoint, params);

        // result.data[0] is the audio file info object with a .url property or a string url
        const audioData = result.data[0];
        const audioUrl = audioData?.url || audioData;

        if (!audioUrl) {
          throw new Error("No audio URL returned from space.");
        }

        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        if (onEndCallback) {
          audio.addEventListener('ended', onEndCallback);
        }

        await audio.play();
        console.log("[Kokoro TTS] Audio playing ✓");
        return; // Success!
      } catch (err) {
        console.error(`[Kokoro TTS] Error with space at index ${_activeSpaceIndex}:`, err);
        
        // Invalidate current client connection
        _gradioClient = null;
        
        // Move to the next space in the list
        _activeSpaceIndex = (_activeSpaceIndex + 1) % KOKORO_SPACES.length;
        attempts++;
      }
    }

    console.error("[Kokoro TTS] All spaces failed. Speech not generated.");
    if (onEndCallback) onEndCallback();
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
