import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioData {
  frequencies: Uint8Array;
  waveform: Uint8Array;
  volume: number;
  bass: number;
  mid: number;
  treble: number;
}

const EMPTY: AudioData = {
  frequencies: new Uint8Array(256),
  waveform: new Uint8Array(256),
  volume: 0,
  bass: 0,
  mid: 0,
  treble: 0,
};

export const useAudioContext = () => {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const connectedRef = useRef<Set<AudioNode>>(new Set());
  const rafRef = useRef<number>(0);
  const [audioData, setAudioData] = useState<AudioData>(EMPTY);

  useEffect(() => {
    const AudioCtx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.82;
    analyser.connect(ctx.destination);

    ctxRef.current = ctx;
    analyserRef.current = analyser;

    const freqBuf = new Uint8Array(analyser.frequencyBinCount);
    const waveBuf = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(freqBuf);
      analyser.getByteTimeDomainData(waveBuf);

      const len = freqBuf.length;
      const bassEnd = Math.floor(len * 0.08);
      const midEnd = Math.floor(len * 0.45);

      let volSum = 0,
        bassSum = 0,
        midSum = 0,
        trebleSum = 0;
      for (let i = 0; i < len; i++) volSum += freqBuf[i];
      for (let i = 0; i < bassEnd; i++) bassSum += freqBuf[i];
      for (let i = bassEnd; i < midEnd; i++) midSum += freqBuf[i];
      for (let i = midEnd; i < len; i++) trebleSum += freqBuf[i];

      setAudioData({
        frequencies: new Uint8Array(freqBuf),
        waveform: new Uint8Array(waveBuf),
        volume: volSum / len / 255,
        bass: bassSum / bassEnd / 255,
        mid: midSum / (midEnd - bassEnd) / 255,
        treble: trebleSum / (len - midEnd) / 255,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ctx.close();
    };
  }, []);

  const getAudioContext = useCallback(() => ctxRef.current, []);

  /** Tap any AudioNode (e.g. Strudel's master gain) into our analyser. */
  const connectNode = useCallback((node: AudioNode) => {
    if (!analyserRef.current) return;
    if (connectedRef.current.has(node)) return;
    node.connect(analyserRef.current);
    connectedRef.current.add(node);
  }, []);

  /** Connect a MediaStream (mic / display capture) to the analyser. */
  const connectStream = useCallback((stream: MediaStream) => {
    const ctx = ctxRef.current;
    if (!ctx || !analyserRef.current) return;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyserRef.current);
  }, []);

  const resume = useCallback(async () => {
    if (ctxRef.current?.state === "suspended") {
      await ctxRef.current.resume();
    }
  }, []);

  return {
    audioData,
    getAudioContext,
    connectNode,
    connectStream,
    resume,
  };
};
