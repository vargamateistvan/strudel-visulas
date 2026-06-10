import type { Mp3QualityPreset } from "../../utils/mp3Export";
import type {
  ColorScheme,
  CustomColorPreset,
  EditorColorPreset,
  EditorFontPreset,
  VizMode,
} from "../SettingsDrawer";

export const EDITOR_COLOR_PRESET_KEY = "strudel:editor-color-preset:v1";
export const EDITOR_FONT_PRESET_KEY = "strudel:editor-font-preset:v1";
export const EDITOR_FONT_SIZE_KEY = "strudel:editor-font-size:v1";
export const COLOR_SCHEME_KEY = "strudel:color-scheme:v1";
export const VIZ_MODE_KEY = "strudel:viz-mode:v1";
export const EDITOR_OPACITY_KEY = "strudel:editor-opacity:v1";
export const LIVE_PULSE_STRIP_KEY = "strudel:live-pulse-strip:v1";
export const LIVE_PLAYING_NOTE_HIGHLIGHTS_KEY =
  "strudel:live-playing-note-highlights:v1";
export const RECORDING_MODE_KEY = "strudel:recording-mode:v1";
export const MP3_QUALITY_KEY = "strudel:mp3-quality:v1";
export const KICK_SENSITIVITY_KEY = "strudel:kick-sensitivity:v1";
export const FRACTAL_QUALITY_KEY = "strudel:fractal-quality:v1";
export const VISUAL_SETTINGS_KEY = "strudel:visual-settings:v1";
export const CUSTOM_COLOR_PRESETS_KEY = "strudel:custom-color-presets:v1";
export const ACTIVE_CUSTOM_COLOR_PRESET_KEY =
  "strudel:active-custom-color-preset:v1";

export const DEFAULT_CUSTOM_COLORS: [string, string, string] = [
  "#00ff88",
  "#00ffff",
  "#ff00ff",
];

export type VisualSettings = {
  kickSensitivity: number;
  fractalQuality: number;
  mandelbulbSize: number;
  particleDensity: number;
  spectrumBarCount: number;
  spectrumWaveform: boolean;
};

export type VisualSettingsMap = Partial<Record<VizMode, VisualSettings>>;

export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  kickSensitivity: 1,
  fractalQuality: 2,
  mandelbulbSize: 1.28,
  particleDensity: 220,
  spectrumBarCount: 96,
  spectrumWaveform: true,
};

export function isColorScheme(value: string): value is ColorScheme {
  return (
    value === "neon" ||
    value === "pastel" ||
    value === "fire" ||
    value === "ocean" ||
    value === "custom"
  );
}

export function isVizMode(value: string): value is VizMode {
  return (
    value === "particles" ||
    value === "spectrum" ||
    value === "lissajous" ||
    value === "spectrumHalo" ||
    value === "oscilloscopeTunnel" ||
    value === "auroraWaves" ||
    value === "starfieldWarp" ||
    value === "noisePlasma" ||
    value === "wireframeMountain" ||
    value === "auroraRings" ||
    value === "kaleidoscope" ||
    value === "kaleidoTunnel" ||
    value === "mandelbrot" ||
    value === "mandelbulb" ||
    value === "mandelbox" ||
    value === "ifs" ||
    value === "thueMorse" ||
    value === "lSystem" ||
    value === "julia" ||
    value === "both"
  );
}

export function isMp3Quality(value: string): value is Mp3QualityPreset {
  return value === "fast" || value === "good" || value === "best";
}

export function parseOpacity(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 1) return null;
  return parsed;
}

export function parseBooleanSetting(
  value: string | null,
  fallback: boolean,
): boolean {
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

export function isEditorColorPreset(value: string): value is EditorColorPreset {
  return (
    value === "neon" || value === "amber" || value === "ice" || value === "mono"
  );
}

export function isEditorFontPreset(value: string): value is EditorFontPreset {
  return (
    value === "jetbrainsMono" ||
    value === "bitcountSingle" ||
    value === "doto" ||
    value === "firaCode"
  );
}

export function parseEditorFontSize(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 11 || parsed > 22) return null;
  return Math.round(parsed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function sanitizePresetName(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 28) : "Custom";
}

export function loadCustomColorPresets(): CustomColorPreset[] {
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

export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return String(err ?? "");
}

export function loadVisualSettingsMap(): VisualSettingsMap {
  const visualModes: VizMode[] = [
    "particles",
    "spectrum",
    "lissajous",
    "spectrumHalo",
    "oscilloscopeTunnel",
    "auroraWaves",
    "starfieldWarp",
    "noisePlasma",
    "wireframeMountain",
    "auroraRings",
    "julia",
    "mandelbrot",
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
