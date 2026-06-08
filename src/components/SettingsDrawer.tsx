import React from "react";
import type { AudioData } from "../hooks/useStrudel";

export type ColorScheme = "neon" | "pastel" | "fire" | "ocean";
export type VizMode =
  | "particles"
  | "spectrum"
  | "lissajous"
  | "julia"
  | "kaleidoscope"
  | "kaleidoTunnel"
  | "both";
export type EditorColorPreset = "neon" | "amber" | "ice" | "mono";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  colorScheme: ColorScheme;
  onColorScheme: (s: ColorScheme) => void;
  vizMode: VizMode;
  onVizMode: (m: VizMode) => void;
  kickSensitivity: number;
  onKickSensitivity: (v: number) => void;
  editorOpacity: number;
  onEditorOpacity: (v: number) => void;
  editorColorPreset: EditorColorPreset;
  onEditorColorPreset: (preset: EditorColorPreset) => void;
  audioData: AudioData;
}

const SCHEMES: { key: ColorScheme; label: string; colors: string[] }[] = [
  { key: "neon", label: "Neon", colors: ["#00ff88", "#00ffff", "#ff00ff"] },
  { key: "pastel", label: "Pastel", colors: ["#87CEEB", "#DDA0DD", "#F0E68C"] },
  { key: "fire", label: "Fire", colors: ["#ff0000", "#ff7700", "#ffff00"] },
  { key: "ocean", label: "Ocean", colors: ["#001a4d", "#0073e6", "#00d9ff"] },
];

const VIZ_MODES: { key: VizMode; label: string; desc: string }[] = [
  {
    key: "particles",
    label: "Particles",
    desc: "Audio-reactive particle field",
  },
  { key: "spectrum", label: "Spectrum", desc: "Frequency bar + waveform" },
  { key: "lissajous", label: "Lissajous", desc: "Phase-space oscilloscope" },
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
  { key: "julia", label: "Julia Set", desc: "Audio-driven fractal" },
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
          color: "#555",
          fontFamily: '"JetBrains Mono",monospace',
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "#444",
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

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  onClose,
  colorScheme,
  onColorScheme,
  vizMode,
  onVizMode,
  kickSensitivity,
  onKickSensitivity,
  editorOpacity,
  onEditorOpacity,
  editorColorPreset,
  onEditorColorPreset,
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
          background: "rgba(8,8,18,0.92)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* drawer header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
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
              color: "#00ff88",
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
              color: "#444",
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
            padding: "16px 16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Color scheme */}
          <section>
            <p
              style={{
                fontSize: 10,
                color: "#333",
                marginBottom: 10,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              Color Scheme
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SCHEMES.map(({ key, label, colors }) => (
                <button
                  key={key}
                  onClick={() => onColorScheme(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 6,
                    border:
                      colorScheme === key
                        ? `1px solid ${colors[0]}66`
                        : "1px solid rgba(255,255,255,0.05)",
                    background:
                      colorScheme === key
                        ? `${colors[0]}18`
                        : "rgba(255,255,255,0.02)",
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
                            colorScheme === key ? `0 0 6px ${c}` : "none",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: '"JetBrains Mono",monospace',
                      color: colorScheme === key ? colors[0] : "#555",
                      fontWeight: colorScheme === key ? 700 : 400,
                    }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Visualization mode */}
          <section>
            <p
              style={{
                fontSize: 10,
                color: "#333",
                marginBottom: 10,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              Visualization
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {VIZ_MODES.map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => onVizMode(key)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    border:
                      vizMode === key
                        ? "1px solid rgba(0,255,136,0.3)"
                        : "1px solid rgba(255,255,255,0.05)",
                    background:
                      vizMode === key
                        ? "rgba(0,255,136,0.08)"
                        : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: '"JetBrains Mono",monospace',
                      color: vizMode === key ? "#00ff88" : "#555",
                      fontWeight: vizMode === key ? 700 : 400,
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 10, color: "#333" }}>{desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Editor opacity */}
          <section>
            <p
              style={{
                fontSize: 10,
                color: "#333",
                marginBottom: 10,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              Kick Sensitivity
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range"
                min={50}
                max={300}
                value={Math.round(kickSensitivity * 100)}
                onChange={(e) =>
                  onKickSensitivity(parseInt(e.target.value, 10) / 100)
                }
                style={{ flex: 1 }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: '"JetBrains Mono",monospace',
                  color: "#444",
                  width: 36,
                  textAlign: "right",
                }}
              >
                {kickSensitivity.toFixed(2)}x
              </span>
            </div>
          </section>

          {/* Editor opacity */}
          <section>
            <p
              style={{
                fontSize: 10,
                color: "#333",
                marginBottom: 10,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              Editor Opacity
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
                  color: "#444",
                  width: 32,
                  textAlign: "right",
                }}
              >
                {Math.round(editorOpacity * 100)}%
              </span>
            </div>
          </section>

          {/* Editor colors */}
          <section>
            <p
              style={{
                fontSize: 10,
                color: "#333",
                marginBottom: 10,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              Editor Colors
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
                        : "1px solid rgba(255,255,255,0.05)",
                    background:
                      editorColorPreset === key
                        ? `${colors[0]}18`
                        : "rgba(255,255,255,0.02)",
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
                            editorColorPreset === key ? `0 0 6px ${c}` : "none",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: '"JetBrains Mono",monospace',
                      color: editorColorPreset === key ? colors[0] : "#555",
                      fontWeight: editorColorPreset === key ? 700 : 400,
                    }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Frequency meters */}
          <section>
            <p
              style={{
                fontSize: 10,
                color: "#333",
                marginBottom: 10,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              Frequency
            </p>
            <FreqBar label="BASS" value={audioData.bass} color="#00ff88" />
            <FreqBar label="MID" value={audioData.mid} color="#00ffff" />
            <FreqBar label="TREBLE" value={audioData.treble} color="#ff00ff" />
            <FreqBar label="VOLUME" value={audioData.volume} color="#ffff00" />
          </section>

          {/* Keyboard hints */}
          <section
            style={{
              borderTop: "1px solid rgba(255,255,255,0.04)",
              paddingTop: 16,
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "#333",
                marginBottom: 8,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              Shortcuts
            </p>
            {[
              ["⌘ + Enter", "Play / Stop"],
              ["Tab", "Indent"],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: '"JetBrains Mono",monospace',
                    color: "#00ff88",
                    background: "rgba(0,255,136,0.08)",
                    padding: "2px 6px",
                    borderRadius: 3,
                  }}
                >
                  {k}
                </span>
                <span style={{ fontSize: 10, color: "#333" }}>{v}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
};
