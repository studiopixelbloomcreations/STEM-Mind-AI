import React, { useState, useEffect, useRef } from 'react';
import { transformersService } from '../ml/TransformersService';
import './AIDashboard.css';

export default function AIDashboard() {
  // Global service states
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [loadingModel, setLoadingModel] = useState(null);

  // 1. TTS State
  const [ttsText, setTtsText] = useState('Welcome to client-side AI. WebGPU acceleration is enabled!');
  const [ttsStatus, setTtsStatus] = useState('idle');

  // 2. STT State
  const [isRecording, setIsRecording] = useState(false);
  const [sttText, setSttText] = useState('');
  const [sttStatus, setSttStatus] = useState('idle');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 3. Object Detection State
  const [imageUrl, setImageUrl] = useState('');
  const [detectionResults, setDetectionResults] = useState([]);
  const [visionStatus, setVisionStatus] = useState('idle');
  const imageRef = useRef(null);

  // 4. Text Embeddings State
  const [inputText, setInputText] = useState('Deep learning on the edge with WebAssembly and WebGPU.');
  const [embeddings, setEmbeddings] = useState(null);
  const [embedStatus, setEmbedStatus] = useState('idle');

  // Listen to background worker download progress
  useEffect(() => {
    const unsubscribe = transformersService.onProgress((progress) => {
      if (progress.status === 'progress') {
        setDownloadProgress({
          task: progress.task,
          model: progress.model,
          percent: progress.progress ? Math.round(progress.progress) : 0,
          file: progress.file
        });
      } else if (progress.status === 'done') {
        setDownloadProgress(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Unlock AudioContext on mount (recommended for iOS/Chrome compatibility)
  const handleUnlockAudio = async () => {
    try {
      await transformersService.unlockAudio();
      alert('Audio Context Unlocked successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 1. TEXT-TO-SPEECH (TTS) IMPLEMENTATION
  // ═══════════════════════════════════════════════════════════════
  const handleTTS = async () => {
    if (!ttsText.trim()) return;
    setTtsStatus('synthesizing');
    try {
      const model = 'Xenova/speecht5_tts';
      setLoadingModel(model);
      const result = await transformersService.synthesizeSpeech(ttsText, model, { useGPU: true });
      
      setTtsStatus('playing');
      await transformersService.playAudioBuffer(result.audio, result.sampling_rate, () => {
        setTtsStatus('idle');
      });
    } catch (err) {
      console.error(err);
      setTtsStatus('error');
    } finally {
      setLoadingModel(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 2. SPEECH-TO-TEXT (STT) RECORDING & TRANSCRIBER
  // ═══════════════════════════════════════════════════════════════
  const startRecording = async () => {
    audioChunksRef.current = [];
    setSttStatus('recording');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudioTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access denied:', err);
      setSttStatus('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop all mic tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const processAudioTranscription = async (audioBlob) => {
    setSttStatus('transcribing');
    try {
      const model = 'Xenova/whisper-tiny.en';
      setLoadingModel(model);

      // Convert AudioBlob to Float32Array PCM for Whisper pipeline
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const rawSamples = audioBuffer.getChannelData(0);

      const result = await transformersService.transcribeAudio(rawSamples, model, { useGPU: true });
      setSttText(result.text || 'No speech detected.');
      setSttStatus('idle');
    } catch (err) {
      console.error(err);
      setSttStatus('error');
    } finally {
      setLoadingModel(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 3. OBJECT DETECTION
  // ═══════════════════════════════════════════════════════════════
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setDetectionResults([]);
    }
  };

  const runObjectDetection = async () => {
    if (!imageUrl) return;
    setVisionStatus('detecting');
    try {
      const model = 'Xenova/detr-resnet-50';
      setLoadingModel(model);
      const results = await transformersService.detectObjects(imageUrl, model, { useGPU: true });
      setDetectionResults(results);
      setVisionStatus('idle');
    } catch (err) {
      console.error(err);
      setVisionStatus('error');
    } finally {
      setLoadingModel(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 4. TEXT EMBEDDINGS
  // ═══════════════════════════════════════════════════════════════
  const handleGetEmbeddings = async () => {
    if (!inputText.trim()) return;
    setEmbedStatus('computing');
    try {
      const model = 'Xenova/all-MiniLM-L6-v2';
      setLoadingModel(model);
      const result = await transformersService.getEmbeddings(inputText, model, { useGPU: true });
      setEmbeddings(result);
      setEmbedStatus('idle');
    } catch (err) {
      console.error(err);
      setEmbedStatus('error');
    } finally {
      setLoadingModel(null);
    }
  };

  return (
    <div className="ai-dashboard">
      <header className="ai-dashboard__header">
        <h1>Multimodal Local AI Dashboard</h1>
        <p>Run Computer Vision, Embeddings, STT, and TTS directly in WebAssembly/WebGPU.</p>
        <button className="btn btn--unlock" onClick={handleUnlockAudio}>
          🔓 Unlock Browser Audio API
        </button>
      </header>

      {/* Model Loading State Overlay */}
      {downloadProgress && (
        <div className="ai-progress-overlay">
          <div className="ai-progress-card">
            <h3>Downloading Neural Network Model Weights</h3>
            <p><strong>Model:</strong> {downloadProgress.model}</p>
            <p><strong>File:</strong> {downloadProgress.file}</p>
            <div className="progress-bar">
              <div 
                className="progress-bar__fill" 
                style={{ width: `${downloadProgress.percent}%` }}
              ></div>
            </div>
            <span>{downloadProgress.percent}% loaded (stored in client IndexDB browser cache)</span>
          </div>
        </div>
      )}

      <div className="ai-grid">
        {/* 1. TEXT-TO-SPEECH (TTS) */}
        <section className="ai-card">
          <div className="ai-card__badge">Pipeline: TTS</div>
          <h2>1. Text-to-Speech</h2>
          <textarea
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="Type text for TTS synthesis..."
          />
          <div className="ai-card__actions">
            <button 
              className="btn" 
              onClick={handleTTS} 
              disabled={ttsStatus === 'synthesizing' || ttsStatus === 'playing'}
            >
              {ttsStatus === 'synthesizing' && 'Generating...'}
              {ttsStatus === 'playing' && '🔊 Playing...'}
              {ttsStatus === 'idle' && '🔊 Speak (SpeechT5)'}
              {ttsStatus === 'error' && 'Retry Speech'}
            </button>
          </div>
        </section>

        {/* 2. SPEECH-TO-TEXT (STT) */}
        <section className="ai-card">
          <div className="ai-card__badge">Pipeline: STT</div>
          <h2>2. Audio Transcriber (Whisper)</h2>
          <div className="mic-container">
            {!isRecording ? (
              <button className="btn btn--record" onClick={startRecording}>
                🎙️ Start Recording
              </button>
            ) : (
              <button className="btn btn--stop" onClick={stopRecording}>
                🛑 Stop & Transcribe
              </button>
            )}
          </div>
          <div className="stt-output">
            <strong>Status:</strong> {sttStatus === 'recording' ? '🔴 Recording...' : sttStatus === 'transcribing' ? '⚙️ Running Whisper Tiny...' : 'Idle'}<br />
            <strong>Output Text:</strong>
            <p className="stt-text">{sttText || 'Click Start and speak into microphone...'}</p>
          </div>
        </section>

        {/* 3. COMPUTER VISION */}
        <section className="ai-card">
          <div className="ai-card__badge">Pipeline: Vision</div>
          <h2>3. Object Detection (DETR)</h2>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {imageUrl && (
            <div className="vision-preview">
              <img ref={imageRef} src={imageUrl} alt="Prediction Target" />
              {detectionResults.map((box, idx) => {
                // Approximate bounding boxes placement
                const { xmax, xmin, ymax, ymin } = box.box;
                const widthPercent = (xmax - xmin) * 100;
                const heightPercent = (ymax - ymin) * 100;
                return (
                  <div 
                    key={idx}
                    className="vision-bbox"
                    style={{
                      left: `${xmin * 100}%`,
                      top: `${ymin * 100}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`
                    }}
                  >
                    <span>{box.label} ({Math.round(box.score * 100)}%)</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="ai-card__actions">
            <button 
              className="btn" 
              onClick={runObjectDetection} 
              disabled={!imageUrl || visionStatus === 'detecting'}
            >
              {visionStatus === 'detecting' ? 'Analyzing Image...' : 'Detect Objects'}
            </button>
          </div>
        </section>

        {/* 4. FEATURE EMBEDDINGS */}
        <section className="ai-card">
          <div className="ai-card__badge">Pipeline: Embeddings</div>
          <h2>4. Semantic Vectors</h2>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type sentence to embed..."
          />
          <div className="ai-card__actions">
            <button 
              className="btn" 
              onClick={handleGetEmbeddings} 
              disabled={embedStatus === 'computing'}
            >
              {embedStatus === 'computing' ? 'Embedding...' : 'Extract Embeddings'}
            </button>
          </div>
          {embeddings && (
            <div className="embeddings-output">
              <strong>Feature Shape:</strong> [{embeddings.dims.join(', ')}]<br />
              <strong>Vector Preview (Normalized):</strong>
              <div className="vector-preview">
                {Array.from(embeddings.data).slice(0, 10).map((v) => v.toFixed(5)).join(', ')}...
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
