import React, { useState } from "react";
import type { AudioData } from "../hooks/useStrudel";
import type { RecordingMode } from "./Header";
import type { Mp3Quality } from "./Header";
import { ColorSchemeSection } from "./settings/ColorSchemeSection";
import { LiveFeedbackSection } from "./settings/LiveFeedbackSection";
import { RecordingSection } from "./settings/RecordingSection";
import { AiComposerSettingsSection } from "./settings/AiComposerSettingsSection";
import { SettingToggle } from "./settings/SettingToggle";
import type { AiApplyMode, AiProvider } from "../hooks/useAiMusicComposer";

export type ColorScheme = "neon" | "pastel" | "fire" | "ocean" | "custom";
export type VizMode =
  | "particles"
  | "spectrum"
  | "lissajous"
  | "spectrumHalo"
  | "oscilloscopeTunnel"
  | "auroraWaves"
  | "starfieldWarp"
  | "noisePlasma"
  | "wireframeMountain"
  | "auroraRings"
  | "julia"
  | "mandelbrot"
  | "mandelbulb"
  | "mandelbox"
  | "ifs"
  | "thueMorse"
  | "lSystem"
  | "kaleidoscope"
  | "kaleidoTunnel"
  | "both";
export type EditorColorPreset = "neon" | "amber" | "ice" | "mono";
export type EditorFontPreset =
  | "jetbrainsMono"
  | "bitcountSingle"
  | "doto"
  | "firaCode";
export type IfsShape = "fern" | "spiral" | "crystal";

export interface CustomColorPreset {
  id: string;
  name: string;
  colors: [string, string, string];
}

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  colorScheme: ColorScheme;
  onColorScheme: (s: ColorScheme) => void;
  customColorPresets: CustomColorPreset[];
  activeCustomColorPresetId: string | null;
  onSelectCustomColorPreset: (id: string) => void;
  onCreateCustomColorPreset: () => void;
  onUpdateCustomColorPresetColor: (
    id: string,
    index: 0 | 1 | 2,
    color: string,
  ) => void;
  onRenameCustomColorPreset: (id: string, name: string) => void;
  onDeleteCustomColorPreset: (id: string) => void;
  vizMode: VizMode;
  onVizMode: (m: VizMode) => void;
  kickSensitivity: number;
  onKickSensitivity: (v: number) => void;
  particleDensity: number;
  onParticleDensity: (v: number) => void;
  spectrumBarCount: number;
  onSpectrumBarCount: (v: number) => void;
  spectrumWaveform: boolean;
  onSpectrumWaveform: (enabled: boolean) => void;
  ifsShape: IfsShape;
  onIfsShape: (shape: IfsShape) => void;
  ifsSize: number;
  onIfsSize: (v: number) => void;
  lissajousSize: number;
  onLissajousSize: (v: number) => void;
  kaleidoscopeSize: number;
  onKaleidoscopeSize: (v: number) => void;
  fractalQuality: number;
  onFractalQuality: (v: number) => void;
  mandelbulbSize: number;
  onMandelbulbSize: (v: number) => void;
  editorOpacity: number;
  onEditorOpacity: (v: number) => void;
  livePulseStrip: boolean;
  onLivePulseStrip: (enabled: boolean) => void;
  livePlayingNoteHighlights: boolean;
  onLivePlayingNoteHighlights: (enabled: boolean) => void;
  sampleWorkspaceOpen: boolean;
  onSampleWorkspaceOpenChange: (open: boolean) => void;
  recordingMode: RecordingMode;
  onRecordingMode: (mode: RecordingMode) => void;
  mp3Quality: Mp3Quality;
  onMp3Quality: (quality: Mp3Quality) => void;
  editorColorPreset: EditorColorPreset;
  onEditorColorPreset: (preset: EditorColorPreset) => void;
  editorFontPreset: EditorFontPreset;
  onEditorFontPreset: (preset: EditorFontPreset) => void;
  editorFontSize: number;
  onEditorFontSize: (size: number) => void;
  aiComposerEnabled: boolean;
  onAiComposerEnabled: (enabled: boolean) => void;
  aiProvider: AiProvider;
  onAiProvider: (provider: AiProvider) => void;
  aiApplyMode: AiApplyMode;
  onAiApplyMode: (mode: AiApplyMode) => void;
  aiApiKey: string;
  onAiApiKey: (value: string) => void;
  onAiClearApiKey: () => void;
  aiRememberApiKey: boolean;
  onAiRememberApiKey: (remember: boolean) => void;
  audioData: AudioData;
}

const VIZ_MODES: { key: VizMode; label: string; desc: string }[] = [
  {
    key: "particles",
    label: "Particles",
    desc: "Audio-reactive particle field",
  },
  { key: "spectrum", label: "Spectrum", desc: "Frequency bar + waveform" },
  { key: "lissajous", label: "Lissajous", desc: "Phase-space oscilloscope" },
  {
    key: "spectrumHalo",
    label: "Spectrum Halo",
    desc: "Circular frequency rings with glowing bloom",
  },
  {
    key: "oscilloscopeTunnel",
    label: "Oscilloscope Tunnel",
    desc: "Layered waveform tunnel with depth motion",
  },
  {
    key: "auroraWaves",
    label: "Aurora Waves",
    desc: "Stacked flowing wave curtains",
  },
  {
    key: "starfieldWarp",
    label: "3D Starfield Warp",
    desc: "Depth stars warp with kick energy",
  },
  {
    key: "noisePlasma",
    label: "Noise Plasma Clouds",
    desc: "Animated plasma fog with audio ripples",
  },
  {
    key: "wireframeMountain",
    label: "Wireframe Mountain",
    desc: "Beat-reactive terrain flyover",
  },
  {
    key: "auroraRings",
    label: "Aurora Rings",
    desc: "Layered rings and spokes driven by spectrum",
  },
  {
    key: "kaleidoscope",
    label: "Kaleidoscope",
    desc: "Mirrored petals synced to rhythm",
  },
  {
    key: "kaleidoTunnel",
    label: "Kaleido Tunnel",
    desc: "Fractal tunnel with mirrored rings",
  },
  {
    key: "mandelbulb",
    label: "Mandelbulb",
    desc: "3D-like fractal slice with audio morph",
  },
  {
    key: "mandelbox",
    label: "Mandelbox",
    desc: "Box-fold fractal field",
  },
  { key: "ifs", label: "IFS", desc: "Iterated function system attractor" },
  {
    key: "thueMorse",
    label: "Thue-Morse",
    desc: "Binary morphic stripe matrix",
  },
  {
    key: "lSystem",
    label: "L-System",
    desc: "Lindenmayer turtle growth",
  },
  { key: "julia", label: "Julia Set", desc: "Audio-driven fractal" },
  {
    key: "mandelbrot",
    label: "Mandelbrot",
    desc: "Classic zooming fractal with music modulation",
  },
  { key: "both", label: "Layered", desc: "Particles + spectrum blend" },
];

const EDITOR_PRESETS: {
  key: EditorColorPreset;
  label: string;
  colors: string[];
}[] = [
  {
    key: "neon",
    label: "Neon Matrix",
    colors: ["#00ff88", "#7ae6ff", "#b7f7d3"],
  },
  {
    key: "amber",
    label: "Amber CRT",
    colors: ["#ffb347", "#ffd88c", "#ffefc4"],
  },
  { key: "ice", label: "Ice Blue", colors: ["#66e0ff", "#b6f0ff", "#dff9ff"] },
  {
    key: "mono",
    label: "Mono Slate",
    colors: ["#c0c7d1", "#9fa7b3", "#e2e7ef"],
  },
];

const EDITOR_FONTS: {
  key: EditorFontPreset;
  label: string;
  family: string;
}[] = [
  {
    key: "jetbrainsMono",
    label: "JetBrains Mono",
    family: '"JetBrains Mono", ui-monospace, monospace',
  },
  {
    key: "bitcountSingle",
    label: "Bitcount Single",
    family: '"Bitcount Single", ui-monospace, monospace',
  },
  {
    key: "doto",
    label: "Doto",
    family: '"Doto", ui-monospace, monospace',
  },
  {
    key: "firaCode",
    label: "Fira Code",
    family: '"Fira Code", ui-monospace, monospace',
  },
];

const IFS_SHAPES: { key: IfsShape; label: string; desc: string }[] = [
  { key: "fern", label: "Fern", desc: "Classic organic attractor" },
  { key: "spiral", label: "Spiral", desc: "Swirling spiral petals" },
  { key: "crystal", label: "Crystal", desc: "Symmetric crystalline branches" },
];

const FreqBar = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div style={{ marginBottom: 8 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 3,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "var(--text-soft)",
          fontFamily: '"JetBrains Mono",monospace',
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          fontFamily: '"JetBrains Mono",monospace',
        }}
      >
        {Math.round(value * 100)}
      </span>
    </div>
    <div
      style={{
        height: 4,
        background: "#111",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(value * 100, 100)}%`,
          background: `linear-gradient(to right, ${color}, ${color}aa)`,
          transition: "width 0.08s ease",
          boxShadow: value > 0.05 ? `0 0 6px ${color}` : "none",
          borderRadius: 2,
        }}
      />
    </div>
  </div>
);

// ─── Accordion helper ──────────────────────────────────────────────────────
const Accordion: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        borderRadius: 7,
        border: "1px solid var(--border-faint)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "9px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: open ? "var(--surface-active)" : "var(--surface-1)",
          border: "none",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: '"JetBrains Mono",monospace',
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: open ? "var(--primary)" : "var(--text-dim)",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            display: "inline-block",
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: "12px",
            borderTop: "1px solid var(--border-faint)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  onClose,
  colorScheme,
  onColorScheme,
  customColorPresets,
  activeCustomColorPresetId,
  onSelectCustomColorPreset,
  onCreateCustomColorPreset,
  onUpdateCustomColorPresetColor,
  onRenameCustomColorPreset,
  onDeleteCustomColorPreset,
  vizMode,
  onVizMode,
  kickSensitivity,
  onKickSensitivity,
  particleDensity,
  onParticleDensity,
  spectrumBarCount,
  onSpectrumBarCount,
  spectrumWaveform,
  onSpectrumWaveform,
  ifsShape,
  onIfsShape,
  ifsSize,
  onIfsSize,
  lissajousSize,
  onLissajousSize,
  kaleidoscopeSize,
  onKaleidoscopeSize,
  fractalQuality,
  onFractalQuality,
  mandelbulbSize,
  onMandelbulbSize,
  editorOpacity,
  onEditorOpacity,
  livePulseStrip,
  onLivePulseStrip,
  livePlayingNoteHighlights,
  onLivePlayingNoteHighlights,
  sampleWorkspaceOpen,
  onSampleWorkspaceOpenChange,
  recordingMode,
  onRecordingMode,
  mp3Quality,
  onMp3Quality,
  editorColorPreset,
  onEditorColorPreset,
  editorFontPreset,
  onEditorFontPreset,
  editorFontSize,
  onEditorFontSize,
  aiComposerEnabled,
  onAiComposerEnabled,
  aiProvider,
  onAiProvider,
  aiApplyMode,
  onAiApplyMode,
  aiApiKey,
  onAiApiKey,
  onAiClearApiKey,
  aiRememberApiKey,
  onAiRememberApiKey,
  audioData,
}) => {
  return (
    <>
      {/* backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 45,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(320px, 88vw)",
          zIndex: 50,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          background: "var(--bg-panel)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* drawer header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-faint)",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: '"JetBrains Mono",monospace',
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--primary)",
              textTransform: "uppercase",
            }}
          >
            Settings
          </span>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: 18,
              cursor: "pointer",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: "12px 12px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {/* ── Colors ── */}
          <Accordion title="Colors" defaultOpen>
            <ColorSchemeSection
              colorScheme={colorScheme}
              onColorScheme={onColorScheme}
              customColorPresets={customColorPresets}
              activeCustomColorPresetId={activeCustomColorPresetId}
              onSelectCustomColorPreset={onSelectCustomColorPreset}
              onCreateCustomColorPreset={onCreateCustomColorPreset}
              onUpdateCustomColorPresetColor={onUpdateCustomColorPresetColor}
              onRenameCustomColorPreset={onRenameCustomColorPreset}
              onDeleteCustomColorPreset={onDeleteCustomColorPreset}
            />
          </Accordion>

          {/* ── Visualization ── */}
          <Accordion title="Visualization" defaultOpen>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {VIZ_MODES.map(({ key, label, desc }) => (
                <div
                  key={key}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <button
                    onClick={() => onVizMode(key)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: vizMode === key ? "6px 6px 0 0" : 6,
                      border:
                        vizMode === key
                          ? "1px solid var(--border-accent)"
                          : "1px solid var(--border-faint)",
                      borderBottom: vizMode === key ? "none" : undefined,
                      background:
                        vizMode === key
                          ? "var(--surface-active)"
                          : "var(--surface-1)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: '"JetBrains Mono",monospace',
                        color:
                          vizMode === key
                            ? "var(--primary)"
                            : "var(--text-soft)",
                        fontWeight: vizMode === key ? 700 : 400,
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)" }}>
                      {desc}
                    </div>
                  </button>

                  {vizMode === key && (
                    <div
                      style={{
                        padding: "10px 10px 12px",
                        border: "1px solid var(--border-accent)",
                        borderTop: "none",
                        borderRadius: "0 0 6px 6px",
                        background: "var(--surface-active)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: 9,
                            color: "var(--text-dim)",
                            margin: "0 0 5px",
                            letterSpacing: 1.2,
                            textTransform: "uppercase",
                            fontFamily: '"JetBrains Mono",monospace',
                          }}
                        >
                          Kick Sensitivity
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <input
                            type="range"
                            min={50}
                            max={300}
                            value={Math.round(kickSensitivity * 100)}
                            onChange={(e) =>
                              onKickSensitivity(
                                parseInt(e.target.value, 10) / 100,
                              )
                            }
                            style={{ flex: 1 }}
                          />
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: '"JetBrains Mono",monospace',
                              color: "var(--text-muted)",
                              width: 34,
                              textAlign: "right",
                            }}
                          >
                            {kickSensitivity.toFixed(2)}x
                          </span>
                        </div>
                      </div>

                      {(key === "particles" || key === "both") && (
                        <div>
                          <p
                            style={{
                              fontSize: 9,
                              color: "var(--text-dim)",
                              margin: "0 0 5px",
                              letterSpacing: 1.2,
                              textTransform: "uppercase",
                              fontFamily: '"JetBrains Mono",monospace',
                            }}
                          >
                            Particle Density
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <input
                              type="range"
                              min={80}
                              max={420}
                              value={particleDensity}
                              onChange={(e) =>
                                onParticleDensity(parseInt(e.target.value, 10))
                              }
                              style={{ flex: 1 }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: '"JetBrains Mono",monospace',
                                color: "var(--text-muted)",
                                width: 38,
                                textAlign: "right",
                              }}
                            >
                              {particleDensity}
                            </span>
                          </div>
                        </div>
                      )}

                      {(key === "spectrum" || key === "both") && (
                        <div>
                          <p
                            style={{
                              fontSize: 9,
                              color: "var(--text-dim)",
                              margin: "0 0 5px",
                              letterSpacing: 1.2,
                              textTransform: "uppercase",
                              fontFamily: '"JetBrains Mono",monospace',
                            }}
                          >
                            Spectrum Detail
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <input
                              type="range"
                              min={32}
                              max={180}
                              value={spectrumBarCount}
                              onChange={(e) =>
                                onSpectrumBarCount(parseInt(e.target.value, 10))
                              }
                              style={{ flex: 1 }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: '"JetBrains Mono",monospace',
                                color: "var(--text-muted)",
                                width: 32,
                                textAlign: "right",
                              }}
                            >
                              {spectrumBarCount}
                            </span>
                          </div>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: 7,
                              fontFamily: '"JetBrains Mono",monospace',
                              fontSize: 11,
                              color: "var(--text-soft)",
                            }}
                          >
                            Waveform Overlay
                            <input
                              type="checkbox"
                              checked={spectrumWaveform}
                              onChange={(e) =>
                                onSpectrumWaveform(e.target.checked)
                              }
                            />
                          </label>
                        </div>
                      )}

                      {key === "ifs" && (
                        <div>
                          <p
                            style={{
                              fontSize: 9,
                              color: "var(--text-dim)",
                              margin: "0 0 5px",
                              letterSpacing: 1.2,
                              textTransform: "uppercase",
                              fontFamily: '"JetBrains Mono",monospace',
                            }}
                          >
                            IFS Shape
                          </p>
                          <div style={{ display: "flex", gap: 5 }}>
                            {IFS_SHAPES.map((s) => (
                              <button
                                key={s.key}
                                onClick={() => onIfsShape(s.key)}
                                title={s.desc}
                                style={{
                                  flex: 1,
                                  padding: "6px 4px",
                                  borderRadius: 5,
                                  border:
                                    ifsShape === s.key
                                      ? "1px solid var(--border-accent)"
                                      : "1px solid var(--border-faint)",
                                  background:
                                    ifsShape === s.key
                                      ? "var(--surface-1)"
                                      : "transparent",
                                  cursor: "pointer",
                                  fontSize: 10,
                                  fontFamily: '"JetBrains Mono",monospace',
                                  color:
                                    ifsShape === s.key
                                      ? "var(--primary)"
                                      : "var(--text-dim)",
                                  fontWeight: ifsShape === s.key ? 700 : 400,
                                  transition: "all 0.15s",
                                }}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                          <p
                            style={{
                              fontSize: 9,
                              color: "var(--text-dim)",
                              margin: "10px 0 5px",
                              letterSpacing: 1.2,
                              textTransform: "uppercase",
                              fontFamily: '"JetBrains Mono",monospace',
                            }}
                          >
                            Size
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <input
                              type="range"
                              min={20}
                              max={400}
                              value={Math.round(ifsSize * 100)}
                              onChange={(e) =>
                                onIfsSize(parseInt(e.target.value, 10) / 100)
                              }
                              style={{ flex: 1 }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: '"JetBrains Mono",monospace',
                                color: "var(--text-muted)",
                                width: 38,
                                textAlign: "right",
                              }}
                            >
                              {ifsSize.toFixed(2)}x
                            </span>
                          </div>
                        </div>
                      )}

                      {(key === "mandelbulb" || key === "mandelbox") && (
                        <div>
                          <p
                            style={{
                              fontSize: 9,
                              color: "var(--text-dim)",
                              margin: "0 0 5px",
                              letterSpacing: 1.2,
                              textTransform: "uppercase",
                              fontFamily: '"JetBrains Mono",monospace',
                            }}
                          >
                            3D Fractal Quality
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <input
                              type="range"
                              min={1}
                              max={3}
                              step={1}
                              value={fractalQuality}
                              onChange={(e) =>
                                onFractalQuality(parseInt(e.target.value, 10))
                              }
                              style={{ flex: 1 }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: '"JetBrains Mono",monospace',
                                color: "var(--text-muted)",
                                width: 60,
                                textAlign: "right",
                              }}
                            >
                              {fractalQuality === 1
                                ? "Low"
                                : fractalQuality === 2
                                  ? "Balanced"
                                  : "High"}
                            </span>
                          </div>
                        </div>
                      )}

                      {key === "mandelbulb" && (
                        <div>
                          <p
                            style={{
                              fontSize: 9,
                              color: "var(--text-dim)",
                              margin: "0 0 5px",
                              letterSpacing: 1.2,
                              textTransform: "uppercase",
                              fontFamily: '"JetBrains Mono",monospace',
                            }}
                          >
                            Mandelbulb Size
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <input
                              type="range"
                              min={70}
                              max={220}
                              value={Math.round(mandelbulbSize * 100)}
                              onChange={(e) =>
                                onMandelbulbSize(
                                  parseInt(e.target.value, 10) / 100,
                                )
                              }
                              style={{ flex: 1 }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: '"JetBrains Mono",monospace',
                                color: "var(--text-muted)",
                                width: 48,
                                textAlign: "right",
                              }}
                            >
                              {mandelbulbSize.toFixed(2)}x
                            </span>
                          </div>
                        </div>
                      )}

                      {key === "lissajous" && (
                        <div>
                          <p
                            style={{
                              fontSize: 9,
                              color: "var(--text-dim)",
                              margin: "0 0 5px",
                              letterSpacing: 1.2,
                              textTransform: "uppercase",
                              fontFamily: '"JetBrains Mono",monospace',
                            }}
                          >
                            Size
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <input
                              type="range"
                              min={20}
                              max={400}
                              value={Math.round(lissajousSize * 100)}
                              onChange={(e) =>
                                onLissajousSize(
                                  parseInt(e.target.value, 10) / 100,
                                )
                              }
                              style={{ flex: 1 }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: '"JetBrains Mono",monospace',
                                color: "var(--text-muted)",
                                width: 38,
                                textAlign: "right",
                              }}
                            >
                              {lissajousSize.toFixed(2)}x
                            </span>
                          </div>
                        </div>
                      )}

                      {key === "kaleidoscope" && (
                        <div>
                          <p
                            style={{
                              fontSize: 9,
                              color: "var(--text-dim)",
                              margin: "0 0 5px",
                              letterSpacing: 1.2,
                              textTransform: "uppercase",
                              fontFamily: '"JetBrains Mono",monospace',
                            }}
                          >
                            Size
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <input
                              type="range"
                              min={20}
                              max={400}
                              value={Math.round(kaleidoscopeSize * 100)}
                              onChange={(e) =>
                                onKaleidoscopeSize(
                                  parseInt(e.target.value, 10) / 100,
                                )
                              }
                              style={{ flex: 1 }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: '"JetBrains Mono",monospace',
                                color: "var(--text-muted)",
                                width: 38,
                                textAlign: "right",
                              }}
                            >
                              {kaleidoscopeSize.toFixed(2)}x
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Accordion>

          {/* ── Editor ── */}
          <Accordion title="Editor">
            <div>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 8,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  fontFamily: '"JetBrains Mono",monospace',
                }}
              >
                Opacity
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(editorOpacity * 100)}
                  onChange={(e) =>
                    onEditorOpacity(parseInt(e.target.value) / 100)
                  }
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: '"JetBrains Mono",monospace',
                    color: "var(--text-muted)",
                    width: 32,
                    textAlign: "right",
                  }}
                >
                  {Math.round(editorOpacity * 100)}%
                </span>
              </div>
            </div>

            <div>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 8,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  fontFamily: '"JetBrains Mono",monospace',
                }}
              >
                Color Theme
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {EDITOR_PRESETS.map(({ key, label, colors }) => (
                  <button
                    key={key}
                    onClick={() => onEditorColorPreset(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border:
                        editorColorPreset === key
                          ? `1px solid ${colors[0]}66`
                          : "1px solid var(--border-faint)",
                      background:
                        editorColorPreset === key
                          ? `${colors[0]}18`
                          : "var(--surface-1)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", gap: 3 }}>
                      {colors.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: c,
                            boxShadow:
                              editorColorPreset === key
                                ? `0 0 6px ${c}`
                                : "none",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: '"JetBrains Mono",monospace',
                        color:
                          editorColorPreset === key
                            ? colors[0]
                            : "var(--text-soft)",
                        fontWeight: editorColorPreset === key ? 700 : 400,
                      }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 8,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  fontFamily: '"JetBrains Mono",monospace',
                }}
              >
                Font
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {EDITOR_FONTS.map(({ key, label, family }) => (
                  <button
                    key={key}
                    onClick={() => onEditorFontPreset(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border:
                        editorFontPreset === key
                          ? "1px solid var(--border-accent)"
                          : "1px solid var(--border-faint)",
                      background:
                        editorFontPreset === key
                          ? "var(--surface-active)"
                          : "var(--surface-1)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: family,
                        color: editorFontPreset === key ? "#b9ffe2" : "#8da1af",
                        fontWeight: editorFontPreset === key ? 700 : 500,
                      }}
                    >
                      {label}
                    </span>
                    {editorFontPreset === key && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: '"JetBrains Mono",monospace',
                          color: "var(--primary)",
                          letterSpacing: 1,
                          textTransform: "uppercase",
                        }}
                      >
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 8,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  fontFamily: '"JetBrains Mono",monospace',
                }}
              >
                Font Size
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="range"
                  min={11}
                  max={22}
                  step={1}
                  value={editorFontSize}
                  onChange={(e) =>
                    onEditorFontSize(parseInt(e.target.value, 10))
                  }
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: '"JetBrains Mono",monospace',
                    color: "var(--text-muted)",
                    width: 42,
                    textAlign: "right",
                  }}
                >
                  {editorFontSize}px
                </span>
              </div>
            </div>
          </Accordion>

          {/* ── Live Feedback ── */}
          <Accordion title="Live Feedback">
            <LiveFeedbackSection
              livePulseStrip={livePulseStrip}
              onLivePulseStrip={onLivePulseStrip}
              livePlayingNoteHighlights={livePlayingNoteHighlights}
              onLivePlayingNoteHighlights={onLivePlayingNoteHighlights}
            />
            <SettingToggle
              label="Sample Workspace"
              description="Show or hide the sample browser panel."
              enabled={sampleWorkspaceOpen}
              onToggle={() => onSampleWorkspaceOpenChange(!sampleWorkspaceOpen)}
            />
          </Accordion>

          {/* ── Recording ── */}
          <Accordion title="Recording">
            <RecordingSection
              recordingMode={recordingMode}
              onRecordingMode={onRecordingMode}
              mp3Quality={mp3Quality}
              onMp3Quality={onMp3Quality}
            />
          </Accordion>

          {/* ── AI Composer ── */}
          <Accordion title="AI Composer">
            <AiComposerSettingsSection
              enabled={aiComposerEnabled}
              onEnabledChange={onAiComposerEnabled}
              provider={aiProvider}
              onProviderChange={onAiProvider}
              applyMode={aiApplyMode}
              onApplyModeChange={onAiApplyMode}
              apiKey={aiApiKey}
              onApiKeyChange={onAiApiKey}
              onClearApiKey={onAiClearApiKey}
              rememberApiKey={aiRememberApiKey}
              onRememberApiKeyChange={onAiRememberApiKey}
            />
          </Accordion>

          {/* ── Frequency ── */}
          <Accordion title="Frequency">
            <FreqBar label="BASS" value={audioData.bass} color="#00ff88" />
            <FreqBar label="MID" value={audioData.mid} color="#00ffff" />
            <FreqBar label="TREBLE" value={audioData.treble} color="#ff00ff" />
            <FreqBar label="VOLUME" value={audioData.volume} color="#ffff00" />
          </Accordion>

          {/* ── Shortcuts ── */}
          <Accordion title="Shortcuts">
            {(
              [
                ["⌘ / Ctrl + Enter", "Play / Stop"],
                ["⌘ / Ctrl + S", "Open Presets"],
                ["⌘ / Ctrl + O", "Open Presets"],
                ["Tab", "Indent line"],
                ["Shift + Tab", "Outdent line"],
                ["⌘ / Ctrl + /", "Toggle comment"],
                ["⌘ / Ctrl + Z", "Undo"],
                ["⌘ / Ctrl + Shift + Z", "Redo"],
                ["⌘ / Ctrl + A", "Select all"],
                ["⌘ / Ctrl + F", "Find in editor"],
                ["⌘ / Ctrl + D", "Select next occurrence"],
                ["Alt + ↑ / ↓", "Move line up / down"],
                ["⌘ / Ctrl + ↑ / ↓", "Scroll editor"],
                ["Home / End", "Jump to line start / end"],
                ["⌘ / Ctrl + Home / End", "Jump to file start / end"],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: '"JetBrains Mono",monospace',
                    color: "var(--primary)",
                    background: "var(--surface-active)",
                    padding: "2px 6px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {k}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-dim)",
                    textAlign: "right",
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
          </Accordion>
        </div>
      </div>
    </>
  );
};
