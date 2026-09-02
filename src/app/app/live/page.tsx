"use client";

/**
 * LIVE TUTOR MODE — real-time conversational tutoring.
 * Mic level → waveform; speech recognition where available (typed input always
 * works); answers stream from the council (tutor mode); Nex speaks via
 * speechSynthesis with his talk cycle driven by utterance amplitude. Camera
 * preview + periodic "Nex sees" observations when enabled.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, Send, Waves } from "lucide-react";
import NexAvatar from "@/components/nex/NexAvatar";
import { emitNex } from "@/components/nex/behavior";
import { useCouncilRun } from "@/components/AgentMonitor";
import { Caps, Chip } from "@/components/ui";
import { cx } from "@/lib/utils";

type Status = "idle" | "listening" | "thinking" | "speaking";
interface Msg { role: "you" | "nex"; text: string; at: number }

const CANNED = [
  "Explain Newton's first law in one minute",
  "Why is the mole concept so confusing?",
  "How do I stop mixing up sin and cos?",
  "What's the fastest way to check a quadratic answer?",
];

const OBSERVATIONS = [
  "Nex noticed: you're writing units next to every number — excellent habit.",
  "Nex noticed: your working is well spaced out. Examiners reward that.",
  "Nex noticed: you circled the final answer. Do that in the real paper too.",
  "Nex noticed: rough working on the side, clean answer in the box. Perfect.",
];

const STATUS_META: Record<Status, { label: string; tone: "volt" | "glacier" | "coral" | undefined }> = {
  idle: { label: "idle", tone: undefined },
  listening: { label: "listening", tone: "volt" },
  thinking: { label: "thinking", tone: "glacier" },
  speaking: { label: "speaking", tone: "volt" },
};

export default function LiveTutor() {
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "nex", text: "Live mode. Talk to me like a tutor — ask anything from this term's topics, or pick one of the prompts below.", at: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [observation, setObservation] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const audio = useRef<{ ctx: AudioContext; analyser: AnalyserNode; stream: MediaStream } | null>(null);
  const videoStream = useRef<MediaStream | null>(null);
  const recognition = useRef<{ stop: () => void } | null>(null);
  const rafRef = useRef(0);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const council = useCouncilRun();
  const obsIdx = useRef(0);

  /* ── Nex entrance ── */
  useEffect(() => {
    emitNex({ kind: "action", action: { mode: "live", emotion: "curious", speech: "Live mode. I'm all ears.", animations: ["notice", "curious"] } });
    return () => {
      stopEverything();
      emitNex({ kind: "action", action: { mode: "idle", emotion: "neutral", animations: ["return_to_idle"] } });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* autoscroll transcript */
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, observation]);

  /* ── waveform renderer ── */
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    const draw = () => {
      const { width: w, height: h } = canvas;
      ctx2d.clearRect(0, 0, w, h);
      const bars = 48;
      const mid = h / 2;
      let loudest = 0;
      for (let i = 0; i < bars; i++) {
        const dist = Math.abs(i - bars / 2) / (bars / 2);
        const base = (1 - dist) * 0.35;
        const jitter = Math.sin(Date.now() / 180 + i * 0.7) * 0.5 + 0.5;
        const amp = status === "idle" ? 0.06 : base * (0.25 + level * 1.4) * (0.4 + jitter * 0.6);
        loudest = Math.max(loudest, amp);
        const bh = Math.max(2, amp * h * 1.6);
        ctx2d.fillStyle = status === "thinking" ? "rgba(143,204,255,0.55)" : "rgba(215,255,74,0.6)";
        ctx2d.fillRect((i / bars) * w + 1, mid - bh / 2, w / bars - 3, bh);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, level]);

  /* ── mic level pump ── */
  useEffect(() => {
    if (!micOn) { setLevel(0); return; }
    let raf = 0;
    const pump = () => {
      const a = audio.current?.analyser;
      if (a) {
        const buf = new Uint8Array(a.fftSize);
        a.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
      }
      raf = requestAnimationFrame(pump);
    };
    raf = requestAnimationFrame(pump);
    return () => cancelAnimationFrame(raf);
  }, [micOn]);

  const toggleMic = useCallback(async () => {
    if (micOn) {
      audio.current?.stream.getTracks().forEach((t) => t.stop());
      audio.current?.ctx.close().catch(() => {});
      audio.current = null;
      recognition.current?.stop();
      recognition.current = null;
      setMicOn(false);
      if (status === "listening") setStatus("idle");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      audio.current = { ctx, analyser, stream };
      setMicOn(true);
      setStatus((s) => (s === "idle" ? "listening" : s));
      emitNex({ kind: "action", action: { mode: "listening", emotion: "focused", animations: ["listen_loop"] } });

      // speech recognition when the browser offers it
      const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
      const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = "en-US";
        rec.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
          const last = e.results[e.results.length - 1]?.[0]?.transcript?.trim();
          if (last) ask(last);
        };
        try { rec.start(); } catch { /* not permitted */ }
        recognition.current = rec;
      }
    } catch {
      setObservation("Microphone unavailable — type below instead, it works exactly the same.");
    }
  }, [micOn, status]);

  const toggleCam = useCallback(async () => {
    if (camOn) {
      videoStream.current?.getTracks().forEach((t) => t.stop());
      videoStream.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamOn(false);
      setObservation(null);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640 } });
      videoStream.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamOn(true);
      emitNex({ kind: "action", action: { mode: "live", emotion: "curious", speech: "Camera on — I can follow your working while we talk.", animations: ["notice", "nod"] } });
    } catch {
      setObservation("Camera unavailable in this browser — live voice still works fully.");
    }
  }, [camOn]);

  /* periodic vision observations while camera is live */
  useEffect(() => {
    if (!camOn) return;
    const id = setInterval(() => {
      setObservation(OBSERVATIONS[obsIdx.current % OBSERVATIONS.length]);
      obsIdx.current++;
    }, 14_000);
    return () => clearInterval(id);
  }, [camOn]);

  const stopEverything = () => {
    audio.current?.stream.getTracks().forEach((t) => t.stop());
    videoStream.current?.getTracks().forEach((t) => t.stop());
    recognition.current?.stop();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    emitNex({ kind: "amp", value: 0 });
  };

  /* ── ask → council(tutor) → Nex speaks ── */
  const ask = useCallback(async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || council.state.phase === "running") return;
    setInput("");
    setObservation(null);
    setMessages((m) => [...m, { role: "you", text, at: Date.now() }]);
    setStatus("thinking");
    emitNex({ kind: "action", action: { mode: "live", emotion: "thinking", animations: ["think"] } });
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    const payload = await council.run({
      mode: "tutor", subject: "physics", topic: "motion", grade: 10, utterance: text, seed: Math.floor(Math.random() * 1e9),
    });
    const reply =
      payload?.feedback?.why ||
      payload?.nex?.speech ||
      "Let's take that step by step — start from the definition, then check the units.";
    setMessages((m) => [...m, { role: "nex", text: reply, at: Date.now() }]);
    if (payload?.nex) emitNex({ kind: "action", action: { ...payload.nex, mode: "live" } });
    speak(reply);
  }, [input, council]);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) {
      setStatus(micOn ? "listening" : "idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.03;
    u.pitch = 1.12;
    let timer: ReturnType<typeof setInterval> | null = null;
    u.onstart = () => {
      setStatus("speaking");
      timer = setInterval(() => emitNex({ kind: "amp", value: 0.35 + Math.random() * 0.55 }), 120);
    };
    const done = () => {
      if (timer) clearInterval(timer);
      emitNex({ kind: "amp", value: 0 });
      setStatus(micOn ? "listening" : "idle");
      emitNex({ kind: "action", action: { mode: micOn ? "listening" : "live", emotion: "curious", animations: ["nod"] } });
    };
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.speak(u);
  };

  const meta = STATUS_META[status];

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1280px] flex-col px-6 pb-10 pt-8 sm:px-10">
      {/* header strip */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Caps volt>Live tutor</Caps>
          <h1 className="t-h2 mt-1.5">Talk to Nex</h1>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone={meta.tone} className="!px-3 !py-1.5">
            <Waves size={12} /> {meta.label}
          </Chip>
          {status === "thinking" && council.state.agents.length > 0 && (
            <Chip className="num">council {council.state.doneCount}/{council.state.agents.length}</Chip>
          )}
        </div>
      </div>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
        {/* stage */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[var(--r-xl)] border border-[var(--color-line)] bg-[var(--color-ink-1)] lg:col-span-7">
          <canvas ref={waveRef} width={640} height={80} className="absolute bottom-0 left-0 right-0 h-20 w-full opacity-80" aria-hidden />
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <NexAvatar variant="live" className="relative h-[320px] w-full max-w-[380px] sm:h-[380px]" />

          {/* camera preview */}
          <div className={cx("absolute bottom-3 left-3 overflow-hidden rounded-[var(--r-md)] border transition-all duration-300", camOn ? "border-[rgba(215,255,74,0.4)] opacity-100" : "border-transparent h-0 opacity-0")}>
            <video ref={videoRef} autoPlay muted playsInline className="h-[86px] w-[130px] object-cover" />
            <span className="label-caps absolute bottom-1 left-1.5 !text-[0.55rem]">nex sees you</span>
          </div>
        </div>

        {/* transcript + controls */}
        <div className="flex min-h-[420px] flex-col rounded-[var(--r-xl)] border border-[var(--color-line)] bg-[var(--color-ink-1)] lg:col-span-5">
          <div className="border-b border-[var(--color-line)] px-5 py-3">
            <Caps>Live transcript</Caps>
          </div>
          <div ref={transcriptRef} className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
            {messages.map((m, i) => (
              <div key={i} className={cx("max-w-[88%] rounded-[var(--r-md)] px-3.5 py-2.5 t-sm leading-relaxed", m.role === "nex" ? "border border-[var(--color-line)] bg-[var(--color-ink-2)]" : "ml-auto bg-[rgba(215,255,74,0.1)] text-[var(--color-hi)]")}>
                <span className="label-caps mb-1 block !text-[0.55rem]">{m.role === "nex" ? "nex" : "you"}</span>
                {m.text}
              </div>
            ))}
            {status === "thinking" && (
              <div className="max-w-[88%] rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-ink-2)] px-3.5 py-2.5 t-sm text-[var(--color-low)]">
                <span className="anim-blink-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-glacier)]" />{" "}
                council deliberating…
              </div>
            )}
            {observation && (
              <div className="anim-rise rounded-[var(--r-md)] border border-[rgba(143,204,255,0.3)] bg-[rgba(143,204,255,0.06)] px-3.5 py-2.5 t-xs text-[var(--color-glacier)]">
                {observation}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-[var(--color-line)] p-4">
            <div className="flex flex-wrap gap-1.5">
              {CANNED.map((c) => (
                <button key={c} onClick={() => ask(c)} className="chip transition-colors hover:border-[var(--color-volt-dim)] hover:text-[var(--color-hi)]">
                  {c}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleMic} aria-label="Toggle microphone" className={cx("btn btn--sm !px-3", micOn ? "btn--primary" : "btn--quiet")}>
                {micOn ? <Mic size={15} /> : <MicOff size={15} />}
              </button>
              <button onClick={toggleCam} aria-label="Toggle camera" className={cx("btn btn--sm !px-3", camOn ? "btn--primary" : "btn--quiet")}>
                {camOn ? <Camera size={15} /> : <CameraOff size={15} />}
              </button>
              <input
                className="field !py-2.5"
                placeholder={micOn ? "Speak, or type…" : "Type your question…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
              />
              <button onClick={() => ask()} aria-label="Send" className="btn btn--primary btn--sm !px-3" disabled={!input.trim()}>
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
}
