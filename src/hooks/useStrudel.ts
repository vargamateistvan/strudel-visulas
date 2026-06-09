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

export interface ActiveMiniLocation {
  start: number;
  end: number;
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

function frequencyToNoteName(frequency: number): string {
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function firstValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePitchClass(value: string): string {
  const key = value.toLowerCase().replace(/\d+/g, "");
  const aliases: Record<string, string> = {
    cb: "b",
    db: "c#",
    eb: "d#",
    fb: "e",
    gb: "f#",
    ab: "g#",
    bb: "a#",
    "e#": "f",
    "b#": "c",
  };
  return aliases[key] ?? key;
}

function pushLiteralTokens(token: unknown, out: string[]) {
  const scalars = unwrapScalars(token);
  for (const scalar of scalars) {
    if (typeof scalar === "number" && Number.isFinite(scalar)) {
      out.push(String(scalar));
      continue;
    }
    if (typeof scalar !== "string") continue;
    const matches = scalar.match(/[A-Za-z_][A-Za-z0-9_#-]*|-?\d+(?:\.\d+)?/g);
    if (!matches) continue;
    for (const m of matches) {
      out.push(m.toLowerCase());
    }
  }
}

function pushTokenAsNote(token: unknown, out: string[]) {
  const scalars = unwrapScalars(token);
  for (const scalar of scalars) {
    if (typeof scalar === "number" && Number.isFinite(scalar)) {
      out.push(midiToNoteName(Math.round(scalar)));
      continue;
    }
    if (typeof scalar !== "string") continue;
    const matches = scalar.match(/[A-Ga-g](?:b|#)?-?\d*/g);
    if (!matches) continue;
    for (const m of matches) {
      if (m.length > 0) out.push(m);
    }
  }
}

function unwrapScalars(input: unknown, depth = 0): Array<string | number> {
  if (depth > 4 || input == null) return [];

  if (typeof input === "string" || typeof input === "number") {
    return [input];
  }

  if (Array.isArray(input)) {
    return input.flatMap((v) => unwrapScalars(v, depth + 1));
  }

  if (typeof input !== "object") return [];

  const out: Array<string | number> = [];
  const obj = input as Record<string, unknown>;

  if ("value" in obj) {
    out.push(...unwrapScalars(obj.value, depth + 1));
  }

  const valueOfResult =
    typeof (input as { valueOf?: () => unknown }).valueOf === "function"
      ? (input as { valueOf: () => unknown }).valueOf()
      : undefined;
  if (
    valueOfResult != null &&
    valueOfResult !== input &&
    (typeof valueOfResult === "string" || typeof valueOfResult === "number")
  ) {
    out.push(valueOfResult);
  }

  const str = String(input);
  if (str && str !== "[object Object]") {
    out.push(str);
  }

  return out;
}

function extractTriggeredActivity(hap: unknown): {
  notes: string[];
  literals: string[];
  controls: string[];
} {
  let value =
    typeof hap === "object" && hap !== null && "value" in hap
      ? (hap as Record<string, unknown>).value
      : undefined;
  if (value == null) return { notes: [], literals: [], controls: [] };
  if (typeof value !== "object") {
    value = { value };
  }

  const valueObj = value as Record<string, unknown>;
  const notes: string[] = [];
  const literals: string[] = [];
  const controls: string[] = [];

  const freqValue = valueObj.freq;
  const freqCandidates = Array.isArray(freqValue)
    ? freqValue
    : [firstValue(freqValue)];
  for (const f of freqCandidates) {
    if (typeof f === "number" && Number.isFinite(f) && f > 0) {
      notes.push(frequencyToNoteName(f));
    }
  }

  const noteCandidates = [
    valueObj.note,
    valueObj.n,
    valueObj.freq,
    valueObj.value,
    valueObj.degree,
    valueObj.chord,
  ];
  for (const candidate of noteCandidates) {
    pushTokenAsNote(candidate, notes);
  }

  const literalCandidates = [
    valueObj.n,
    valueObj.s,
    valueObj.bank,
    valueObj.value,
    valueObj.note,
    valueObj.degree,
    valueObj.chord,
    valueObj.octave,
  ];
  for (const candidate of literalCandidates) {
    pushLiteralTokens(candidate, literals);
  }

  for (const key of Object.keys(valueObj)) {
    if (key === "_begin" || key === "_duration") continue;
    controls.push(key.toLowerCase());
  }

  // Heuristics for transformed payloads where source control names may be omitted.
  if (
    valueObj.n != null ||
    valueObj.degree != null ||
    (valueObj.note != null && literals.some((v) => /^-?\d+(?:\.\d+)?$/.test(v)))
  ) {
    controls.push("n");
  }
  if (valueObj.bank != null) {
    controls.push("bank");
  }

  const uniqueByPitch = new Map<string, string>();
  for (const note of notes) {
    const key = normalizePitchClass(note);
    if (key) uniqueByPitch.set(key, note);
  }

  const uniqueLiterals = Array.from(new Set(literals));
  const uniqueControls = Array.from(new Set(controls));

  return {
    notes: Array.from(uniqueByPitch.values()),
    literals: uniqueLiterals,
    controls: uniqueControls,
  };
}

function extractMiniLocations(hap: unknown): ActiveMiniLocation[] {
  if (typeof hap !== "object" || hap == null) return [];
  const context = (hap as Record<string, unknown>).context;
  if (typeof context !== "object" || context == null) return [];
  const rawLocations = (context as Record<string, unknown>).locations;
  if (!Array.isArray(rawLocations)) return [];

  const out: ActiveMiniLocation[] = [];
  const seen = new Set<string>();

  for (const location of rawLocations) {
    let start: number | null = null;
    let end: number | null = null;

    if (Array.isArray(location) && location.length >= 2) {
      const rawStart = Number(location[0]);
      const rawEnd = Number(location[1]);
      if (Number.isFinite(rawStart) && Number.isFinite(rawEnd)) {
        start = Math.floor(rawStart);
        end = Math.floor(rawEnd);
      }
    } else if (typeof location === "object" && location != null) {
      const rawStart = Number((location as Record<string, unknown>).start);
      const rawEnd = Number((location as Record<string, unknown>).end);
      if (Number.isFinite(rawStart) && Number.isFinite(rawEnd)) {
        start = Math.floor(rawStart);
        end = Math.floor(rawEnd);
      }
    }

    if (start == null || end == null || end <= start) continue;
    const key = `${start}:${end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ start, end });
  }

  return out;
}

function hasNonFiniteNumber(
  value: unknown,
  depth = 0,
  seen?: WeakSet<object>,
): boolean {
  if (depth > 7 || value == null) return false;
  if (typeof value === "number") return !Number.isFinite(value);
  if (typeof value !== "object") return false;

  if (Array.isArray(value)) {
    for (const item of value) {
      if (hasNonFiniteNumber(item, depth + 1, seen)) return true;
    }
    return false;
  }

  const localSeen = seen ?? new WeakSet<object>();
  if (localSeen.has(value as object)) return false;
  localSeen.add(value as object);

  const obj = value as Record<string, unknown>;
  try {
    const valueOf =
      typeof (value as { valueOf?: () => unknown }).valueOf === "function"
        ? (value as { valueOf: () => unknown }).valueOf()
        : undefined;
    if (typeof valueOf === "number" && !Number.isFinite(valueOf)) {
      return true;
    }
  } catch {
    // ignore valueOf edge-cases
  }

  for (const key of Object.keys(obj)) {
    if (hasNonFiniteNumber(obj[key], depth + 1, localSeen)) return true;
  }
  return false;
}

function isNonFiniteAudioParamError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return (
    message.includes("AudioParam") &&
    (message.includes("non-finite") || message.includes("non finite"))
  );
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? "");
}

type ReplInstance = {
  stop: () => void;
  evaluate: (code: string) => Promise<void>;
};

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
let soundDepsPromise: Promise<void> | null = null;
let audioInitPromise: Promise<void> | null = null;
let loggerConfigured = false;

const NOISY_RUNTIME_PATTERNS = [
  "[superdough] Deprecation warning: it seems your code path is setting 'node.onended = callback' instead of using the onceEnded helper",
  "[cyclist] start",
  "[cyclist] stop",
  "skip query: too late",
  "[eval] code updated",
];

const MASTER_VOLUME_KEY = "strudel:master-volume:v1";

function clampMasterVolume(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}

function parseMasterVolume(value: string | null): number {
  if (!value) return 1;
  const parsed = Number(value);
  return clampMasterVolume(parsed);
}

function isNoisyRuntimeLog(args: unknown[]): boolean {
  const first = args[0];
  if (typeof first !== "string") return false;
  return NOISY_RUNTIME_PATTERNS.some((pattern) => first.includes(pattern));
}

async function configureSuperdoughLogger(): Promise<void> {
  if (loggerConfigured || import.meta.env.PROD) return;
  const { setLogger } = await import("superdough");
  setLogger((...args: unknown[]) => {
    if (isNoisyRuntimeLog(args)) return;
    console.log(...args);
  });
  loggerConfigured = true;
}

function loadScope(): Promise<void> {
  if (!scopePromise) {
    scopePromise = (async () => {
      const { evalScope } = await import("@strudel/core");
      await evalScope(
        import("@strudel/core"),
        import("@strudel/mini"),
        import("@strudel/tonal"),
        import("@strudel/webaudio"),
        import("@strudel/soundfonts"),
      );
    })();
  }
  return scopePromise;
}

function loadSoundDependencies(): Promise<void> {
  if (!soundDepsPromise) {
    soundDepsPromise = (async () => {
      await configureSuperdoughLogger();
      const { registerSynthSounds, samples } = await import("superdough");
      const { registerSoundfonts } = await import("@strudel/soundfonts");

      // Built-in waveforms (sawtooth, square, triangle, sine)
      registerSynthSounds();

      // General MIDI keys like gm_lead_1_square, gm_synth_strings_1, ...
      registerSoundfonts();

      // Main sample ecosystem used by strudel patterns
      await samples("github:tidalcycles/dirt-samples");

      // Compatibility aliases for legacy bank("RolandTR909") patterns
      await samples({
        _base:
          "https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/",
        RolandTR909_bd: "bd/BT0A0A7.wav",
        RolandTR909_sd: "sd/rytm-00-hard.wav",
        RolandTR909_hh: "hh/000_hh3closedhh.wav",
        RolandTR909_oh: "ho/HHOD0.wav",
        RolandTR909_cp: "cp/HANDCLP0.wav",
        RolandTR909_cr: "cr/RIDED0.wav",
      });
    })();
  }
  return soundDepsPromise;
}

function initAudioOnce(): Promise<void> {
  if (!audioInitPromise) {
    audioInitPromise = (async () => {
      const { initAudio } = await import("superdough");
      await initAudio();
    })();
  }
  return audioInitPromise;
}

export const useStrudel = () => {
  const [status, setStatus] = useState<StrudelStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadMsg, setLoadMsg] = useState<string>("");
  const [audioData, setAudioData] = useState<AudioData>(EMPTY);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [activeMiniLocations, setActiveMiniLocations] = useState<
    ActiveMiniLocation[]
  >([]);
  const [activeLiterals, setActiveLiterals] = useState<string[]>([]);
  const [activeControls, setActiveControls] = useState<string[]>([]);
  const [masterVolume, setMasterVolume] = useState<number>(() =>
    parseMasterVolume(localStorage.getItem(MASTER_VOLUME_KEY)),
  );

  const replRef = useRef<ReplInstance | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const tappedMasterRef = useRef<AudioNode | null>(null);
  const mediaDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaDestConnectedRef = useRef(false);
  const rafRef = useRef<number>(0);
  const activeNoteTimeoutRef = useRef<number | null>(null);
  const activeNoteTimeoutsRef = useRef<Map<string, number>>(new Map());
  const activeMiniLocationTimeoutsRef = useRef<Map<string, number>>(new Map());
  const activeLiteralTimeoutsRef = useRef<Map<string, number>>(new Map());
  const activeControlTimeoutsRef = useRef<Map<string, number>>(new Map());
  const lastBadTriggerWarnRef = useRef(0);
  const lastAudioDataCommitRef = useRef(0);

  const stopReadingLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    lastAudioDataCommitRef.current = 0;
  }, []);

  const clearAllActiveNotes = () => {
    if (activeNoteTimeoutRef.current) {
      window.clearTimeout(activeNoteTimeoutRef.current);
      activeNoteTimeoutRef.current = null;
    }
    for (const timeoutId of activeNoteTimeoutsRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    activeNoteTimeoutsRef.current.clear();

    for (const timeoutId of activeMiniLocationTimeoutsRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    activeMiniLocationTimeoutsRef.current.clear();

    for (const timeoutId of activeLiteralTimeoutsRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    activeLiteralTimeoutsRef.current.clear();

    for (const timeoutId of activeControlTimeoutsRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    activeControlTimeoutsRef.current.clear();

    setActiveNote(null);
    setActiveNotes([]);
    setActiveMiniLocations([]);
    setActiveLiterals([]);
    setActiveControls([]);
  };

  const startReadingLoop = useCallback(
    (analyser: AnalyserNode) => {
      stopReadingLoop();
      const freqBuf = new Uint8Array(analyser.frequencyBinCount);
      const waveBuf = new Uint8Array(analyser.frequencyBinCount);
      const MIN_AUDIO_DATA_FRAME_MS = 33;

      const tick = (timestamp: number) => {
        analyser.getByteFrequencyData(freqBuf);
        analyser.getByteTimeDomainData(waveBuf);

        if (
          timestamp - lastAudioDataCommitRef.current <
          MIN_AUDIO_DATA_FRAME_MS
        ) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        lastAudioDataCommitRef.current = timestamp;

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
    },
    [stopReadingLoop],
  );

  const untapMasterBus = useCallback(() => {
    if (tappedMasterRef.current && analyserRef.current) {
      try {
        tappedMasterRef.current.disconnect(analyserRef.current);
      } catch {
        // Ignore disconnect errors from stale audio graphs.
      }
    }
    tappedMasterRef.current = null;
  }, []);

  const tapMasterBus = useCallback(async () => {
    try {
      const { getAudioContext, getSuperdoughAudioController } =
        await import("superdough");
      const ctx = getAudioContext();
      const controller = getSuperdoughAudioController();
      const destGain = controller?.output?.destinationGain;
      if (!destGain) return;

      if (!analyserRef.current || analyserRef.current.context !== ctx) {
        untapMasterBus();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.82;
        analyserRef.current = analyser;
      }

      if (analyserRef.current && !rafRef.current) {
        startReadingLoop(analyserRef.current);
      }

      if (tappedMasterRef.current === destGain) {
        return;
      }

      untapMasterBus();
      destGain.connect(analyserRef.current);
      tappedMasterRef.current = destGain;
    } catch (e) {
      console.warn("tapMasterBus failed:", e);
    }
  }, [startReadingLoop, untapMasterBus]);

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

  const applyMasterVolume = useCallback(async (volume: number) => {
    try {
      const { getAudioContext, getSuperdoughAudioController } =
        await import("superdough");
      const ctx = getAudioContext();
      const controller = getSuperdoughAudioController();
      const destGain = controller?.output?.destinationGain;
      if (!destGain) return;
      const next = clampMasterVolume(volume);
      destGain.gain.setValueAtTime(next, ctx.currentTime);
    } catch {
      // Audio graph may not be initialised yet; volume is applied on next start.
    }
  }, []);

  const play = useCallback(
    async (code: string) => {
      setError(null);
      setStatus("loading");

      try {
        setLoadMsg("Loading modules…");
        await loadScope();

        const { webaudioRepl, webaudioOutput } =
          await import("@strudel/webaudio");
        const { transpiler } = await import("@strudel/transpiler");

        setLoadMsg("Initialising audio…");
        await initAudioOnce();

        setLoadMsg("Loading sounds…");
        await loadSoundDependencies();

        await applyMasterVolume(masterVolume);

        if (replRef.current) {
          replRef.current.stop();
          replRef.current = null;
        }

        if (activeNoteTimeoutRef.current) {
          window.clearTimeout(activeNoteTimeoutRef.current);
          activeNoteTimeoutRef.current = null;
        }
        clearAllActiveNotes();

        setLoadMsg("Starting pattern…");
        const r = webaudioRepl({
          transpiler,
          defaultOutput: (
            hap: unknown,
            deadline: unknown,
            hapDuration: unknown,
            cps: unknown,
            t: unknown,
          ) => {
            if (
              typeof deadline !== "number" ||
              !Number.isFinite(deadline) ||
              typeof hapDuration !== "number" ||
              !Number.isFinite(hapDuration) ||
              typeof cps !== "number" ||
              !Number.isFinite(cps) ||
              typeof t !== "number" ||
              !Number.isFinite(t) ||
              hasNonFiniteNumber(hap)
            ) {
              const now = Date.now();
              if (now - lastBadTriggerWarnRef.current > 2000) {
                console.warn(
                  "[useStrudel] skipped invalid trigger with non-finite values",
                );
                lastBadTriggerWarnRef.current = now;
              }
              return;
            }

            const {
              notes: nextNotes,
              literals: nextLiterals,
              controls: nextControls,
            } = extractTriggeredActivity(hap);
            const nextMiniLocations = extractMiniLocations(hap);
            if (
              nextNotes.length > 0 ||
              nextMiniLocations.length > 0 ||
              nextLiterals.length > 0 ||
              nextControls.length > 0
            ) {
              if (nextNotes.length > 0) {
                const primaryNote = nextNotes[0] ?? null;
                setActiveNote((prev) =>
                  prev === primaryNote ? prev : primaryNote,
                );
              }

              const expiresInMs = 340;

              setActiveMiniLocations((prev) => {
                const next = new Map(
                  prev.map((range) => [`${range.start}:${range.end}`, range]),
                );
                let hasNewLocations = false;

                for (const range of nextMiniLocations) {
                  const key = `${range.start}:${range.end}`;
                  if (!next.has(key)) {
                    next.set(key, range);
                    hasNewLocations = true;
                  }

                  const prevTimeout =
                    activeMiniLocationTimeoutsRef.current.get(key);
                  if (prevTimeout) {
                    window.clearTimeout(prevTimeout);
                  }

                  const timeoutId = window.setTimeout(() => {
                    activeMiniLocationTimeoutsRef.current.delete(key);
                    setActiveMiniLocations((curr) => {
                      const filtered = curr.filter(
                        (r) => `${r.start}:${r.end}` !== key,
                      );
                      return filtered.length === curr.length ? curr : filtered;
                    });
                  }, expiresInMs);
                  activeMiniLocationTimeoutsRef.current.set(key, timeoutId);
                }

                return hasNewLocations ? Array.from(next.values()) : prev;
              });

              setActiveNotes((prev) => {
                const next = new Set(prev);
                let hasNewNotes = false;
                for (const note of nextNotes) {
                  if (!next.has(note)) {
                    next.add(note);
                    hasNewNotes = true;
                  }
                  const key = normalizePitchClass(note);
                  const prevTimeout = activeNoteTimeoutsRef.current.get(key);
                  if (prevTimeout) {
                    window.clearTimeout(prevTimeout);
                  }
                  const timeoutId = window.setTimeout(() => {
                    activeNoteTimeoutsRef.current.delete(key);
                    setActiveNotes((curr) => {
                      const filtered = curr.filter(
                        (n) => normalizePitchClass(n) !== key,
                      );
                      return filtered.length === curr.length ? curr : filtered;
                    });
                  }, expiresInMs);
                  activeNoteTimeoutsRef.current.set(key, timeoutId);
                }
                return hasNewNotes ? Array.from(next) : prev;
              });

              setActiveLiterals((prev) => {
                const next = new Set(prev);
                let hasNewLiterals = false;
                for (const literal of nextLiterals) {
                  if (!next.has(literal)) {
                    next.add(literal);
                    hasNewLiterals = true;
                  }
                  const prevTimeout =
                    activeLiteralTimeoutsRef.current.get(literal);
                  if (prevTimeout) {
                    window.clearTimeout(prevTimeout);
                  }
                  const timeoutId = window.setTimeout(() => {
                    activeLiteralTimeoutsRef.current.delete(literal);
                    setActiveLiterals((curr) => {
                      const filtered = curr.filter((v) => v !== literal);
                      return filtered.length === curr.length ? curr : filtered;
                    });
                  }, expiresInMs);
                  activeLiteralTimeoutsRef.current.set(literal, timeoutId);
                }
                return hasNewLiterals ? Array.from(next) : prev;
              });

              setActiveControls((prev) => {
                const next = new Set(prev);
                let hasNewControls = false;
                for (const control of nextControls) {
                  if (!next.has(control)) {
                    next.add(control);
                    hasNewControls = true;
                  }
                  const prevTimeout =
                    activeControlTimeoutsRef.current.get(control);
                  if (prevTimeout) {
                    window.clearTimeout(prevTimeout);
                  }
                  const timeoutId = window.setTimeout(() => {
                    activeControlTimeoutsRef.current.delete(control);
                    setActiveControls((curr) => {
                      const filtered = curr.filter((v) => v !== control);
                      return filtered.length === curr.length ? curr : filtered;
                    });
                  }, expiresInMs);
                  activeControlTimeoutsRef.current.set(control, timeoutId);
                }
                return hasNewControls ? Array.from(next) : prev;
              });

              if (activeNoteTimeoutRef.current) {
                window.clearTimeout(activeNoteTimeoutRef.current);
              }
              activeNoteTimeoutRef.current = window.setTimeout(() => {
                setActiveNote(null);
                activeNoteTimeoutRef.current = null;
              }, 380);
            }
            const handleOutputError = (err: unknown) => {
              if (isNonFiniteAudioParamError(err)) {
                const now = Date.now();
                if (now - lastBadTriggerWarnRef.current > 2000) {
                  console.warn(
                    "[useStrudel] skipped trigger due to invalid AudioParam value",
                  );
                  lastBadTriggerWarnRef.current = now;
                }
                return;
              }
              throw err;
            };

            try {
              const output = webaudioOutput(hap, deadline, hapDuration, cps, t);
              if (
                output &&
                typeof output === "object" &&
                "then" in output &&
                typeof (output as Promise<unknown>).then === "function"
              ) {
                return (output as Promise<unknown>).catch(handleOutputError);
              }
              return output;
            } catch (err) {
              return handleOutputError(err);
            }
          },
        });
        await r.evaluate(code);
        replRef.current = r;

        setStatus("playing");
        setLoadMsg("");
        setTimeout(tapMasterBus, 400);
      } catch (err: unknown) {
        setError(errorMessage(err));
        setStatus("error");
        setLoadMsg("");
      }
    },
    [applyMasterVolume, masterVolume, tapMasterBus],
  );

  const stop = useCallback(() => {
    if (replRef.current) {
      replRef.current.stop();
      replRef.current = null;
    }
    stopReadingLoop();
    clearAllActiveNotes();
    untapMasterBus();
    setAudioData(EMPTY);
    setStatus("idle");
    setError(null);
    setLoadMsg("");
  }, [stopReadingLoop, untapMasterBus]);

  const updatePattern = useCallback(
    async (code: string) => {
      if (!replRef.current || status !== "playing") return;
      try {
        await replRef.current.evaluate(code);
        setError(null);
      } catch (err: unknown) {
        // Keep currently running audio alive when a live edit is temporarily invalid.
        setError(`Live edit error: ${errorMessage(err)}`);
      }
    },
    [status],
  );

  useEffect(
    () => () => {
      stopReadingLoop();
      clearAllActiveNotes();
      untapMasterBus();
      if (replRef.current?.stop) replRef.current.stop();
    },
    [stopReadingLoop, untapMasterBus],
  );

  useEffect(() => {
    const next = clampMasterVolume(masterVolume);
    localStorage.setItem(MASTER_VOLUME_KEY, String(next));
    void applyMasterVolume(next);
  }, [applyMasterVolume, masterVolume]);

  return {
    play,
    updatePattern,
    stop,
    status,
    error,
    loadMsg,
    audioData,
    activeNote,
    activeNotes,
    activeMiniLocations,
    activeLiterals,
    activeControls,
    masterVolume,
    setMasterVolume,
    getRecordingStream,
  };
};
