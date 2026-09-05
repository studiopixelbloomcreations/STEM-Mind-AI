/**
 * STEM Live tutor socket — thin wrapper around the shared Gemini Live session.
 */

import { GeminiLiveSession } from '../live/geminiLiveSession';
import { getGeminiApiKey } from '../live/geminiConfig';

class StemLiveTutor {
  constructor() {
    this.session = new GeminiLiveSession();
  }

  setCallback(name, fn) {
    this.session.setCallback(name, fn);
  }

  async connect(systemInstruction = '') {
    return this.session.connect({
      systemInstruction,
      modality: 'AUDIO',
      voice: 'Aoede',
      temperature: 0.6,
    });
  }

  sendTextMessage(text) {
    this.session.sendTextMessage(text);
  }

  sendVideoFrame(base64Jpeg) {
    this.session.sendVideoFrame(base64Jpeg);
  }

  sendAudioChunk(int16PcmData) {
    this.session.sendAudioChunk(int16PcmData);
  }

  isReady() {
    return this.session.isReady();
  }

  interruptPlayback() {
    this.session.interruptPlayback();
  }

  disconnect() {
    this.session.disconnect();
  }
}

export { getGeminiApiKey };
export const geminiLiveService = new StemLiveTutor();
export default geminiLiveService;
