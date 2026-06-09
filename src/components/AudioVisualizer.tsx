import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStrudel, DEFAULT_PATTERN } from "../hooks/useStrudel";
import { useLocalPresets } from "../hooks/useLocalPresets";
import { Layout } from "./Layout";
import { Header, type RecordingMode } from "./Header";
import { PresetsDialog } from "./PresetsDialog";
import { HowItWorksDialog } from "./HowItWorksDialog";
import {
  SettingsDrawer,
  type CustomColorPreset,
  type ColorScheme,
  type EditorColorPreset,
  type EditorFontPreset,
  type VizMode,
} from "./SettingsDrawer";
import { BackgroundVisualizer } from "./audio/BackgroundVisualizer";
import { SplashOverlay } from "./audio/SplashOverlay";
import { buildMidiFromCode } from "../utils/midiExport";
import { convertWebmToMp3, type Mp3QualityPreset } from "../utils/mp3Export";
import { AudioWorkspace } from "./audio/AudioWorkspace";

const EDITOR_COLOR_PRESET_KEY = "strudel:editor-color-preset:v1";
const EDITOR_FONT_PRESET_KEY = "strudel:editor-font-preset:v1";
const EDITOR_FONT_SIZE_KEY = "strudel:editor-font-size:v1";
const COLOR_SCHEME_KEY = "strudel:color-scheme:v1";
const VIZ_MODE_KEY = "strudel:viz-mode:v1";
const EDITOR_OPACITY_KEY = "strudel:editor-opacity:v1";
const LIVE_PULSE_STRIP_KEY = "strudel:live-pulse-strip:v1";
const LIVE_PLAYING_NOTE_HIGHLIGHTS_KEY =
  "strudel:live-playing-note-highlights:v1";
const RECORDING_MODE_KEY = "strudel:recording-mode:v1";
const MP3_QUALITY_KEY = "strudel:mp3-quality:v1";
const KICK_SENSITIVITY_KEY = "strudel:kick-sensitivity:v1";
const FRACTAL_QUALITY_KEY = "strudel:fractal-quality:v1";
const VISUAL_SETTINGS_KEY = "strudel:visual-settings:v1";
const CUSTOM_COLOR_PRESETS_KEY = "strudel:custom-color-presets:v1";
const ACTIVE_CUSTOM_COLOR_PRESET_KEY = "strudel:active-custom-color-preset:v1";

const DEFAULT_CUSTOM_COLORS: [string, string, string] = [
  "#00ff88",
  "#00ffff",
  "#ff00ff",
];

type VisualSettings = {
  kickSensitivity: number;
  fractalQuality: number;
  mandelbulbSize: number;
  particleDensity: number;
  spectrumBarCount: number;
  spectrumWaveform: boolean;
};

type VisualSettingsMap = Partial<Record<VizMode, VisualSettings>>;

const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  kickSensitivity: 1,
  fractalQuality: 2,
  mandelbulbSize: 1.28,
  particleDensity: 220,
  spectrumBarCount: 96,
  spectrumWaveform: true,
};

function isColorScheme(value: string): value is ColorScheme {
  return (
    value === "neon" ||
    value === "pastel" ||
    value === "fire" ||
    value === "ocean" ||
    value === "custom"
  );
}

function isVizMode(value: string): value is VizMode {
  if (value === "mandelbrot" || value === "burningShip") {
    return true;
  }
  return (
    value === "particles" ||
    value === "spectrum" ||
    value === "lissajous" ||
    value === "kaleidoscope" ||
    value === "kaleidoTunnel" ||
    value === "mandelbulb" ||
    value === "mandelbox" ||
    value === "ifs" ||
    value === "thueMorse" ||
    value === "lSystem" ||
    value === "julia" ||
    value === "both"
  );
}

function isMp3Quality(value: string): value is Mp3QualityPreset {
  return value === "fast" || value === "good" || value === "best";
}

function parseOpacity(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 1) return null;
  return parsed;
}

function parseBooleanSetting(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value === "true";
}

function parseKickSensitivity(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0.5 || parsed > 3) return null;
  return parsed;
}

function parseFractalQuality(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1 || parsed > 3) return null;
  return Math.round(parsed);
}

function isEditorColorPreset(value: string): value is EditorColorPreset {
  return (
    value === "neon" || value === "amber" || value === "ice" || value === "mono"
  );
}

function isEditorFontPreset(value: string): value is EditorFontPreset {
  return (
    value === "jetbrainsMono" ||
    value === "bitcountSingle" ||
    value === "doto" ||
    value === "firaCode"
  );
}

function parseEditorFontSize(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 11 || parsed > 22) return null;
  return Math.round(parsed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function sanitizePresetName(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 28) : "Custom";
}

function loadCustomColorPresets(): CustomColorPreset[] {
  const saved = localStorage.getItem(CUSTOM_COLOR_PRESETS_KEY);
  if (!saved) {
    return [
      {
        id: "custom-1",
        name: "Custom 1",
        colors: DEFAULT_CUSTOM_COLORS,
      },
    ];
  }

  try {
    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const presets: CustomColorPreset[] = [];
    for (const entry of parsed) {
      if (!isRecord(entry)) continue;
      const id = entry.id;
      const name = entry.name;
      const colors = entry.colors;
      if (
        typeof id === "string" &&
        typeof name === "string" &&
        Array.isArray(colors) &&
        colors.length === 3 &&
        colors.every((c) => typeof c === "string" && isHexColor(c))
      ) {
        presets.push({
          id,
          name: sanitizePresetName(name),
          colors: [colors[0], colors[1], colors[2]],
        });
      }
    }
    return presets;
  } catch {
    return [];
  }
}

function parseVisualSettings(value: unknown): VisualSettings | null {
  if (!isRecord(value)) return null;

  const kickRaw = value.kickSensitivity;
  const fractalRaw = value.fractalQuality;
  const mandelbulbSizeRaw = value.mandelbulbSize;
  const particleDensityRaw = value.particleDensity;
  const spectrumBarCountRaw = value.spectrumBarCount;
  const spectrumWaveformRaw = value.spectrumWaveform;
  if (
    typeof kickRaw !== "number" ||
    typeof fractalRaw !== "number" ||
    typeof mandelbulbSizeRaw !== "number"
  ) {
    return null;
  }

  const kickSensitivity =
    kickRaw >= 0.5 && kickRaw <= 3
      ? kickRaw
      : DEFAULT_VISUAL_SETTINGS.kickSensitivity;
  const fractalQuality =
    fractalRaw >= 1 && fractalRaw <= 3
      ? Math.round(fractalRaw)
      : DEFAULT_VISUAL_SETTINGS.fractalQuality;
  const mandelbulbSize =
    mandelbulbSizeRaw >= 0.7 && mandelbulbSizeRaw <= 2.2
      ? mandelbulbSizeRaw
      : DEFAULT_VISUAL_SETTINGS.mandelbulbSize;

  const particleDensity =
    typeof particleDensityRaw === "number" &&
    particleDensityRaw >= 80 &&
    particleDensityRaw <= 420
      ? Math.round(particleDensityRaw)
      : DEFAULT_VISUAL_SETTINGS.particleDensity;

  const spectrumBarCount =
    typeof spectrumBarCountRaw === "number" &&
    spectrumBarCountRaw >= 32 &&
    spectrumBarCountRaw <= 180
      ? Math.round(spectrumBarCountRaw)
      : DEFAULT_VISUAL_SETTINGS.spectrumBarCount;

  const spectrumWaveform =
    typeof spectrumWaveformRaw === "boolean"
      ? spectrumWaveformRaw
      : DEFAULT_VISUAL_SETTINGS.spectrumWaveform;

  return {
    kickSensitivity,
    fractalQuality,
    mandelbulbSize,
    particleDensity,
    spectrumBarCount,
    spectrumWaveform,
  };
}

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return String(err ?? "");
}

function loadVisualSettingsMap(): VisualSettingsMap {
  const visualModes: VizMode[] = [
    "particles",
    "spectrum",
    "lissajous",
    "julia",
    "mandelbulb",
    "mandelbox",
    "ifs",
    "thueMorse",
    "lSystem",
    "kaleidoscope",
    "kaleidoTunnel",
    "both",
  ];

  const saved = localStorage.getItem(VISUAL_SETTINGS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as unknown;
      if (isRecord(parsed)) {
        const out: VisualSettingsMap = {};
        for (const mode of visualModes) {
          const modeSettings = parseVisualSettings(parsed[mode]);
          if (modeSettings) out[mode] = modeSettings;
        }
        if (Object.keys(out).length > 0) {
          return out;
        }
      }
    } catch {
      // ignore invalid JSON and fall back to legacy keys
    }
  }

  // Migration fallback for users coming from global settings keys.
  const legacyKick =
    parseKickSensitivity(localStorage.getItem(KICK_SENSITIVITY_KEY)) ??
    DEFAULT_VISUAL_SETTINGS.kickSensitivity;
  const legacyFractal =
    parseFractalQuality(localStorage.getItem(FRACTAL_QUALITY_KEY)) ??
    DEFAULT_VISUAL_SETTINGS.fractalQuality;
  const legacyMandelbulbSize = DEFAULT_VISUAL_SETTINGS.mandelbulbSize;

  const fallback: VisualSettingsMap = {};
  for (const mode of visualModes) {
    fallback[mode] = {
      kickSensitivity: legacyKick,
      fractalQuality: legacyFractal,
      mandelbulbSize: legacyMandelbulbSize,
      particleDensity: DEFAULT_VISUAL_SETTINGS.particleDensity,
      spectrumBarCount: DEFAULT_VISUAL_SETTINGS.spectrumBarCount,
      spectrumWaveform: DEFAULT_VISUAL_SETTINGS.spectrumWaveform,
    };
  }
  return fallback;
}

export const AudioVisualizer: React.FC = () => {
  const {
    audioData,
    play,
    updatePattern,
    stop,
    status,
    error,
    loadMsg,
    activeNote,
    activeNotes,
    activeLiterals,
    activeControls,
    nPulse,
    getRecordingStream,
  } = useStrudel();
  const {
    presets,
    saveAsNew,
    overwrite,
    rename,
    remove,
    getById,
    loadDraft,
    saveDraft,
  } = useLocalPresets();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem(COLOR_SCHEME_KEY);
    return saved && isColorScheme(saved) ? saved : "neon";
  });
  const [vizMode, setVizMode] = useState<VizMode>(() => {
    const saved = localStorage.getItem(VIZ_MODE_KEY);
    return saved && isVizMode(saved) ? saved : "particles";
  });
  const [editorOpacity, setEditorOpacity] = useState(() => {
    return parseOpacity(localStorage.getItem(EDITOR_OPACITY_KEY)) ?? 0.45;
  });
  const [livePulseStrip, setLivePulseStrip] = useState(() => {
    return parseBooleanSetting(
      localStorage.getItem(LIVE_PULSE_STRIP_KEY),
      true,
    );
  });
  const [livePlayingNoteHighlights, setLivePlayingNoteHighlights] = useState(
    () => {
      return parseBooleanSetting(
        localStorage.getItem(LIVE_PLAYING_NOTE_HIGHLIGHTS_KEY),
        true,
      );
    },
  );
  const [customColorPresets, setCustomColorPresets] = useState<
    CustomColorPreset[]
  >(() => loadCustomColorPresets());
  const [activeCustomColorPresetId, setActiveCustomColorPresetId] = useState<
    string | null
  >(() => localStorage.getItem(ACTIVE_CUSTOM_COLOR_PRESET_KEY));
  const [visualSettings, setVisualSettings] = useState<VisualSettingsMap>(() =>
    loadVisualSettingsMap(),
  );
  const [editorColorPreset, setEditorColorPreset] = useState<EditorColorPreset>(
    () => {
      const saved = localStorage.getItem(EDITOR_COLOR_PRESET_KEY);
      return saved && isEditorColorPreset(saved) ? saved : "neon";
    },
  );
  const [editorFontPreset, setEditorFontPreset] = useState<EditorFontPreset>(
    () => {
      const saved = localStorage.getItem(EDITOR_FONT_PRESET_KEY);
      return saved && isEditorFontPreset(saved) ? saved : "jetbrainsMono";
    },
  );
  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    return (
      parseEditorFontSize(localStorage.getItem(EDITOR_FONT_SIZE_KEY)) ?? 13
    );
  });
  const [splashDone, setSplashDone] = useState(false);
  const [code, setCode] = useState(() => loadDraft() ?? DEFAULT_PATTERN);
  const [isMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 900 : false,
  );
  const [mobileHeaderExpanded, setMobileHeaderExpanded] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(() => {
    const saved = localStorage.getItem(RECORDING_MODE_KEY);
    return saved === "video" || saved === "midi" ? saved : "audio";
  });
  const [mp3Quality, setMp3Quality] = useState<Mp3QualityPreset>(() => {
    const saved = localStorage.getItem(MP3_QUALITY_KEY);
    return saved && isMp3Quality(saved) ? saved : "good";
  });
  const [isExportingMp3, setIsExportingMp3] = useState(false);
  const [mp3Progress, setMp3Progress] = useState(0);
  const [mp3Status, setMp3Status] = useState("");
  const [mp3Speed, setMp3Speed] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);

  const clearRecordingTimer = useCallback(() => {}, []);

  const currentVisualSettings =
    visualSettings[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
  const kickSensitivity = currentVisualSettings.kickSensitivity;
  const fractalQuality = currentVisualSettings.fractalQuality;
  const mandelbulbSize = currentVisualSettings.mandelbulbSize;
  const particleDensity = currentVisualSettings.particleDensity;
  const spectrumBarCount = currentVisualSettings.spectrumBarCount;
  const spectrumWaveform = currentVisualSettings.spectrumWaveform;
  const activeCustomPreset =
    customColorPresets.find((p) => p.id === activeCustomColorPresetId) ??
    customColorPresets[0] ??
    null;
  const customColors: [string, string, string] = activeCustomPreset
    ? activeCustomPreset.colors
    : DEFAULT_CUSTOM_COLORS;

  const setKickSensitivityForViz = useCallback(
    (value: number) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            kickSensitivity: value,
          },
        };
      });
    },
    [vizMode],
  );

  const setFractalQualityForViz = useCallback(
    (value: number) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            fractalQuality: Math.max(1, Math.min(3, Math.round(value))),
          },
        };
      });
    },
    [vizMode],
  );

  const setMandelbulbSizeForViz = useCallback(
    (value: number) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            mandelbulbSize: Math.max(0.7, Math.min(2.2, value)),
          },
        };
      });
    },
    [vizMode],
  );

  const setParticleDensityForViz = useCallback(
    (value: number) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            particleDensity: Math.max(80, Math.min(420, Math.round(value))),
          },
        };
      });
    },
    [vizMode],
  );

  const setSpectrumBarCountForViz = useCallback(
    (value: number) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            spectrumBarCount: Math.max(32, Math.min(180, Math.round(value))),
          },
        };
      });
    },
    [vizMode],
  );

  const setSpectrumWaveformForViz = useCallback(
    (value: boolean) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            spectrumWaveform: value,
          },
        };
      });
    },
    [vizMode],
  );

  const selectCustomColorPreset = useCallback((id: string) => {
    setActiveCustomColorPresetId(id);
    setColorScheme("custom");
  }, []);

  const createCustomColorPreset = useCallback(() => {
    setCustomColorPresets((prev) => {
      const nextIndex = prev.length + 1;
      const id = `custom-${Date.now()}-${nextIndex}`;
      const preset: CustomColorPreset = {
        id,
        name: `Custom ${nextIndex}`,
        colors: activeCustomPreset?.colors ?? DEFAULT_CUSTOM_COLORS,
      };
      setActiveCustomColorPresetId(id);
      setColorScheme("custom");
      return [...prev, preset];
    });
  }, [activeCustomPreset]);

  const updateCustomColorPresetColor = useCallback(
    (id: string, index: 0 | 1 | 2, color: string) => {
      if (!isHexColor(color)) return;
      setCustomColorPresets((prev) =>
        prev.map((preset) => {
          if (preset.id !== id) return preset;
          const nextColors: [string, string, string] = [...preset.colors];
          nextColors[index] = color;
          return {
            ...preset,
            colors: nextColors,
          };
        }),
      );
    },
    [],
  );

  const renameCustomColorPreset = useCallback((id: string, name: string) => {
    setCustomColorPresets((prev) =>
      prev.map((preset) =>
        preset.id === id
          ? { ...preset, name: sanitizePresetName(name) }
          : preset,
      ),
    );
  }, []);

  const deleteCustomColorPreset = useCallback(
    (id: string) => {
      setCustomColorPresets((prev) => {
        const next = prev.filter((preset) => preset.id !== id);
        const nextActive =
          next.find((preset) => preset.id === activeCustomColorPresetId) ??
          next[0] ??
          null;
        setActiveCustomColorPresetId(nextActive ? nextActive.id : null);
        if (!nextActive && colorScheme === "custom") {
          setColorScheme("neon");
        }
        return next;
      });
    },
    [activeCustomColorPresetId, colorScheme],
  );

  const onCodeChange = useCallback((c: string) => {
    setCode(c);
  }, []);

  const handleSplashClick = useCallback(() => {
    setSplashDone(true);
    play(code);
  }, [play, code]);

  const pickAudioMimeType = useCallback((): string | undefined => {
    if (typeof MediaRecorder === "undefined") return undefined;
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    return candidates.find((c) => MediaRecorder.isTypeSupported(c));
  }, []);

  const stopAudioRecording = useCallback(() => {
    clearRecordingTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      setIsRecording(false);
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
    }
  }, [clearRecordingTimer]);

  const startAudioRecording = useCallback(async () => {
    try {
      if (status !== "playing") return;
      if (isRecording) return;
      if (isExportingMp3) return;
      if (typeof MediaRecorder === "undefined") {
        window.alert("MediaRecorder is not supported in this browser.");
        return;
      }

      const stream = await getRecordingStream();
      const mimeType = pickAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onerror = () => {
        setIsRecording(false);
        clearRecordingTimer();
      };
      recorder.onstop = async () => {
        const blobType = recorder.mimeType || mimeType || "audio/webm";
        clearRecordingTimer();
        setIsRecording(false);

        const blob = new Blob(chunksRef.current, { type: blobType });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");

        try {
          setIsExportingMp3(true);
          setMp3Progress(0);
          setMp3Status("Preparing MP3 export...");

          const mp3Blob = await convertWebmToMp3(blob, {
            quality: mp3Quality,
            onProgress: (p) => setMp3Progress(p),
            onStatus: (s) => setMp3Status(s),
            onSpeed: (speed) => setMp3Speed(speed),
          });

          const url = URL.createObjectURL(mp3Blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `strudel-recording-${ts}.mp3`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e: unknown) {
          const ext = blobType.includes("ogg") ? "ogg" : "webm";
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `strudel-recording-${ts}.${ext}`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          window.alert(
            `MP3 conversion failed, downloaded original ${ext.toUpperCase()} instead. ${errorMessage(e)}`,
          );
        } finally {
          setIsExportingMp3(false);
          setMp3Status("");
          setMp3Progress(0);
          setMp3Speed("");
        }
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch (e: unknown) {
      window.alert(errorMessage(e) || "Failed to start recording.");
    }
  }, [
    clearRecordingTimer,
    getRecordingStream,
    isExportingMp3,
    isRecording,
    mp3Quality,
    pickAudioMimeType,
    status,
  ]);

  const startVideoRecording = useCallback(async () => {
    try {
      if (status !== "playing") return;
      if (isRecording) return;
      if (!navigator.mediaDevices?.getDisplayMedia) {
        window.alert("Display capture is not supported in this browser.");
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        window.alert("MediaRecorder is not supported in this browser.");
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60 },
        audio: false,
      });
      displayStreamRef.current = displayStream;

      const audioStream = await getRecordingStream();
      const combined = new MediaStream();
      displayStream.getVideoTracks().forEach((t) => combined.addTrack(t));
      audioStream.getAudioTracks().forEach((t) => combined.addTrack(t));

      const candidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];
      const mimeType = candidates.find((c) => MediaRecorder.isTypeSupported(c));
      const recorder = mimeType
        ? new MediaRecorder(combined, { mimeType })
        : new MediaRecorder(combined);

      displayStream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        };
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        clearRecordingTimer();
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `strudel-video-${ts}.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        displayStream.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
        setIsRecording(false);
      };
      recorder.onerror = () => {
        clearRecordingTimer();
        setIsRecording(false);
        displayStream.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch {
      clearRecordingTimer();
      setIsRecording(false);
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      displayStreamRef.current = null;
    }
  }, [clearRecordingTimer, getRecordingStream, isRecording, status]);

  const exportMidi = useCallback(() => {
    const blob = buildMidiFromCode(code);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strudel-pattern-${ts}.mid`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [code]);

  const startRecording = useCallback(() => {
    if (isExportingMp3) return;
    if (recordingMode === "audio") {
      startAudioRecording();
      return;
    }
    if (recordingMode === "video") {
      startVideoRecording();
      return;
    }
    exportMidi();
  }, [
    exportMidi,
    isExportingMp3,
    recordingMode,
    startAudioRecording,
    startVideoRecording,
  ]);

  // Preload modules in the background while idle so first play is instant
  useEffect(() => {
    import("@strudel/core");
    import("@strudel/mini");
    import("@strudel/soundfonts");
    import("@strudel/tonal");
    import("@strudel/transpiler");
    import("@strudel/webaudio");
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveDraft(code);
    }, 900);
    return () => window.clearTimeout(t);
  }, [code, saveDraft]);

  useEffect(() => {
    if (status !== "playing") return;
    const t = window.setTimeout(() => {
      updatePattern(code);
    }, 520);
    return () => window.clearTimeout(t);
  }, [code, status, updatePattern]);

  useEffect(() => {
    localStorage.setItem(EDITOR_COLOR_PRESET_KEY, editorColorPreset);
  }, [editorColorPreset]);

  useEffect(() => {
    localStorage.setItem(EDITOR_FONT_PRESET_KEY, editorFontPreset);
  }, [editorFontPreset]);

  useEffect(() => {
    localStorage.setItem(EDITOR_FONT_SIZE_KEY, String(editorFontSize));
  }, [editorFontSize]);

  useEffect(() => {
    localStorage.setItem(COLOR_SCHEME_KEY, colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    localStorage.setItem(VIZ_MODE_KEY, vizMode);
  }, [vizMode]);

  useEffect(() => {
    localStorage.setItem(EDITOR_OPACITY_KEY, String(editorOpacity));
  }, [editorOpacity]);

  useEffect(() => {
    localStorage.setItem(LIVE_PULSE_STRIP_KEY, String(livePulseStrip));
  }, [livePulseStrip]);

  useEffect(() => {
    localStorage.setItem(
      LIVE_PLAYING_NOTE_HIGHLIGHTS_KEY,
      String(livePlayingNoteHighlights),
    );
  }, [livePlayingNoteHighlights]);

  useEffect(() => {
    localStorage.setItem(RECORDING_MODE_KEY, recordingMode);
  }, [recordingMode]);

  useEffect(() => {
    localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify(visualSettings));
  }, [visualSettings]);

  useEffect(() => {
    localStorage.setItem(
      CUSTOM_COLOR_PRESETS_KEY,
      JSON.stringify(customColorPresets),
    );
  }, [customColorPresets]);

  useEffect(() => {
    if (activeCustomColorPresetId) {
      localStorage.setItem(
        ACTIVE_CUSTOM_COLOR_PRESET_KEY,
        activeCustomColorPresetId,
      );
    } else {
      localStorage.removeItem(ACTIVE_CUSTOM_COLOR_PRESET_KEY);
    }
  }, [activeCustomColorPresetId]);

  useEffect(() => {
    localStorage.setItem(MP3_QUALITY_KEY, mp3Quality);
  }, [mp3Quality]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setPresetsOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setPresetsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [clearRecordingTimer]);

  useEffect(() => {
    if (status !== "playing" && isRecording) {
      stopAudioRecording();
    }
  }, [isRecording, status, stopAudioRecording]);

  const background = (
    <BackgroundVisualizer
      audioData={audioData}
      colorScheme={colorScheme}
      customColors={customColors}
      vizMode={vizMode}
      status={status}
      kickSensitivity={kickSensitivity}
      fractalQuality={fractalQuality}
      mandelbulbSize={mandelbulbSize}
      particleDensity={particleDensity}
      spectrumBarCount={spectrumBarCount}
      spectrumWaveform={spectrumWaveform}
    />
  );

  return (
    <Layout backgroundVisualizer={background}>
      {/* header */}
      <Header
        status={status}
        isMobile={isMobile}
        onMobileAdvancedOpenChange={setMobileHeaderExpanded}
        onSettingsOpen={() => setDrawerOpen(true)}
        onPresetsOpen={() => setPresetsOpen(true)}
        onHowItWorksOpen={() => setHelpOpen(true)}
        onPlay={() => play(code)}
        onStop={stop}
        isRecording={isRecording}
        isExportingMp3={isExportingMp3}
        onRecordStart={startRecording}
        onRecordStop={stopAudioRecording}
      />

      <AudioWorkspace
        code={code}
        play={play}
        stop={stop}
        status={status}
        error={error}
        loadMsg={loadMsg}
        opacity={editorOpacity}
        colorPreset={editorColorPreset}
        fontPreset={editorFontPreset}
        fontSize={editorFontSize}
        livePulseStrip={livePulseStrip}
        livePlayingNoteHighlights={livePlayingNoteHighlights}
        activeNote={activeNote}
        activeNotes={activeNotes}
        activeLiterals={activeLiterals}
        activeControls={activeControls}
        nPulse={nPulse}
        onCodeChange={onCodeChange}
        isExportingMp3={isExportingMp3}
        mp3Quality={mp3Quality}
        mp3Status={mp3Status}
        mp3Progress={mp3Progress}
        mp3Speed={mp3Speed}
        isMobile={isMobile}
        mobileHeaderExpanded={mobileHeaderExpanded}
      />

      {/* settings drawer */}
      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        colorScheme={colorScheme}
        onColorScheme={setColorScheme}
        customColorPresets={customColorPresets}
        activeCustomColorPresetId={activeCustomColorPresetId}
        onSelectCustomColorPreset={selectCustomColorPreset}
        onCreateCustomColorPreset={createCustomColorPreset}
        onUpdateCustomColorPresetColor={updateCustomColorPresetColor}
        onRenameCustomColorPreset={renameCustomColorPreset}
        onDeleteCustomColorPreset={deleteCustomColorPreset}
        vizMode={vizMode}
        onVizMode={setVizMode}
        kickSensitivity={kickSensitivity}
        onKickSensitivity={setKickSensitivityForViz}
        particleDensity={particleDensity}
        onParticleDensity={setParticleDensityForViz}
        spectrumBarCount={spectrumBarCount}
        onSpectrumBarCount={setSpectrumBarCountForViz}
        spectrumWaveform={spectrumWaveform}
        onSpectrumWaveform={setSpectrumWaveformForViz}
        fractalQuality={fractalQuality}
        onFractalQuality={setFractalQualityForViz}
        mandelbulbSize={mandelbulbSize}
        onMandelbulbSize={setMandelbulbSizeForViz}
        editorOpacity={editorOpacity}
        onEditorOpacity={setEditorOpacity}
        livePulseStrip={livePulseStrip}
        onLivePulseStrip={setLivePulseStrip}
        livePlayingNoteHighlights={livePlayingNoteHighlights}
        onLivePlayingNoteHighlights={setLivePlayingNoteHighlights}
        recordingMode={recordingMode}
        onRecordingMode={setRecordingMode}
        mp3Quality={mp3Quality}
        onMp3Quality={setMp3Quality}
        editorColorPreset={editorColorPreset}
        onEditorColorPreset={setEditorColorPreset}
        editorFontPreset={editorFontPreset}
        onEditorFontPreset={setEditorFontPreset}
        editorFontSize={editorFontSize}
        onEditorFontSize={setEditorFontSize}
        audioData={audioData}
      />

      <PresetsDialog
        open={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        currentCode={code}
        presets={presets}
        onSaveAsNew={(name, value) => saveAsNew(name, value)}
        onOverwrite={(id, value, name) => overwrite(id, value, name)}
        onRename={rename}
        onDelete={remove}
        onLoad={(id) => {
          const preset = getById(id);
          if (preset) {
            setCode(preset.code);
            setPresetsOpen(false);
          }
        }}
      />

      <HowItWorksDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      {!splashDone && <SplashOverlay onClick={handleSplashClick} />}
    </Layout>
  );
};
