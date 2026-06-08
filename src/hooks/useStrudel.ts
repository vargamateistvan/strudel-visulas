import { useCallback, useEffect, useRef, useState } from "react";

export type StrudelStatus = "idle" | "loading" | "playing" | "error";

export interface AudioData {
  frequencies: Uint8Array;
  waveform: Uint8Array;
  volume: number;
  bass: number;
  mid: number;
  treble: number;
}

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

function detectPitchHz(
  waveform: Uint8Array,
  sampleRate: number,
): number | null {
  const size = waveform.length;
  if (size < 2) return null;

  const signal = new Float32Array(size);
  let rms = 0;
  for (let i = 0; i < size; i++) {
    const v = (waveform[i] - 128) / 128;
    signal[i] = v;
    rms += v * v;
  }

  rms = Math.sqrt(rms / size);
  if (rms < 0.015) return null;

  let bestOffset = -1;
  let bestCorrelation = 0;
  const minFreq = 50;
  const maxFreq = 2000;
  const minOffset = Math.max(2, Math.floor(sampleRate / maxFreq));
  const maxOffset = Math.min(size - 1, Math.floor(sampleRate / minFreq));

  for (let offset = minOffset; offset <= maxOffset; offset++) {
    let corr = 0;
    for (let i = 0; i < size - offset; i++) {
      corr += signal[i] * signal[i + offset];
    }
    if (corr > bestCorrelation) {
      bestCorrelation = corr;
      bestOffset = offset;
    }
  }

  if (bestOffset <= 0 || bestCorrelation < 0.02) return null;
  return sampleRate / bestOffset;
}

function frequencyToNoteName(frequency: number): string {
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

const EMPTY: AudioData = {
  frequencies: new Uint8Array(512),
  waveform: new Uint8Array(512),
  volume: 0,
  bass: 0,
  mid: 0,
  treble: 0,
};

export const DEFAULT_PATTERN = `// Strudel Studio — Cmd+Enter to play/stop

stack(
  note("c2 [eb2 g2] bb2 [ab2 c3]")
    .sound("sawtooth")
    .lpf(800)
    .resonance(8)
    .gain(0.5),
  note("<c4 g4> <eb4 bb4> <g4 d4> <ab4 eb4>")
    .sound("triangle")
    .delay(0.4)
    .delaytime(0.375)
    .gain(0.35),
  note("c3 ~ eb3 ~")
    .sound("square")
    .lpf(300)
    .gain(0.3)
).cpm(80)`;

// Singleton promise so evalScope only runs once per page load
let scopePromise: Promise<void> | null = null;

function loadScope(): Promise<void> {
  if (!scopePromise) {
    scopePromise = (async () => {
      const { evalScope } = await import("@strudel/core");
      await evalScope(
        import("@strudel/core"),
        import("@strudel/mini"),
        import("@strudel/tonal"),
        import("@strudel/webaudio"),
      );
    })();
  }
  return scopePromise;
}

export const useStrudel = () => {
  const [status, setStatus] = useState<StrudelStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadMsg, setLoadMsg] = useState<string>("");
  const [audioData, setAudioData] = useState<AudioData>(EMPTY);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const replRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaDestConnectedRef = useRef(false);
  const rafRef = useRef<number>(0);

  const startReadingLoop = (analyser: AnalyserNode) => {
    cancelAnimationFrame(rafRef.current);
    const freqBuf = new Uint8Array(analyser.frequencyBinCount);
    const waveBuf = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(freqBuf);
      analyser.getByteTimeDomainData(waveBuf);

      const len = freqBuf.length;
      const bassEnd = Math.floor(len * 0.08);
      const midEnd = Math.floor(len * 0.45);

      let vol = 0,
        bass = 0,
        mid = 0,
        treble = 0;
      for (let i = 0; i < len; i++) vol += freqBuf[i];
      for (let i = 0; i < bassEnd; i++) bass += freqBuf[i];
      for (let i = bassEnd; i < midEnd; i++) mid += freqBuf[i];
      for (let i = midEnd; i < len; i++) treble += freqBuf[i];

      const pitchHz = detectPitchHz(waveBuf, analyser.context.sampleRate);
      setActiveNote(pitchHz ? frequencyToNoteName(pitchHz) : null);

      setAudioData({
        frequencies: new Uint8Array(freqBuf),
        waveform: new Uint8Array(waveBuf),
        volume: vol / len / 255,
        bass: bass / bassEnd / 255,
        mid: mid / (midEnd - bassEnd) / 255,
        treble: treble / (len - midEnd) / 255,
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const tapMasterBus = async () => {
    try {
      const { getAudioContext, getSuperdoughAudioController } =
        await import("superdough");
      const ctx = getAudioContext();
      const controller = getSuperdoughAudioController();
      const destGain = controller?.output?.destinationGain;
      if (!destGain) return;

      if (!analyserRef.current || analyserRef.current.context !== ctx) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.82;
        analyserRef.current = analyser;
        startReadingLoop(analyser);
      }
      destGain.connect(analyserRef.current);
    } catch (e) {
      console.warn("tapMasterBus failed:", e);
    }
  };

  const getRecordingStream = useCallback(async (): Promise<MediaStream> => {
    const { initAudio, getAudioContext, getSuperdoughAudioController } =
      await import("superdough");

    await initAudio();
    const ctx = getAudioContext();
    const controller = getSuperdoughAudioController();
    const destGain = controller?.output?.destinationGain;

    if (!destGain) {
      throw new Error("Audio output is not ready yet");
    }

    if (!mediaDestRef.current || mediaDestRef.current.context !== ctx) {
      mediaDestRef.current = ctx.createMediaStreamDestination();
      mediaDestConnectedRef.current = false;
    }

    if (!mediaDestConnectedRef.current) {
      destGain.connect(mediaDestRef.current);
      mediaDestConnectedRef.current = true;
    }

    if (!mediaDestRef.current) {
      throw new Error("Recording destination is not available");
    }

    return mediaDestRef.current.stream;
  }, []);

  const play = useCallback(async (code: string) => {
    setError(null);
    setStatus("loading");

    try {
      setLoadMsg("Loading modules…");
      await loadScope();

      const { webaudioRepl } = await import("@strudel/webaudio");
      const { initAudio, registerSynthSounds } = await import("superdough");
      const { transpiler } = await import("@strudel/transpiler");

      setLoadMsg("Initialising audio…");
      await initAudio();
      registerSynthSounds(); // registers sawtooth, triangle, square, sine, etc.

      if (replRef.current) {
        replRef.current.stop();
        replRef.current = null;
      }

      setLoadMsg("Starting pattern…");
      const r = webaudioRepl({ transpiler });
      await r.evaluate(code);
      replRef.current = r;

      setStatus("playing");
      setLoadMsg("");
      setTimeout(tapMasterBus, 400);
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setStatus("error");
      setLoadMsg("");
    }
  }, []);

  const stop = useCallback(() => {
    if (replRef.current) {
      replRef.current.stop();
      replRef.current = null;
    }
    setStatus("idle");
    setActiveNote(null);
    setError(null);
    setLoadMsg("");
  }, []);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      if (replRef.current?.stop) replRef.current.stop();
    },
    [],
  );

  return {
    play,
    stop,
    status,
    error,
    loadMsg,
    audioData,
    activeNote,
    getRecordingStream,
  };
};
