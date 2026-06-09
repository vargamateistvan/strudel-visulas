import { StrudelEditor } from "../StrudelEditor";
import type { StrudelStatus } from "../../hooks/useStrudel";

type AudioWorkspaceProps = {
  code: string;
  play: (code: string) => Promise<void>;
  stop: () => void;
  status: StrudelStatus;
  error: string | null;
  loadMsg: string;
  opacity: number;
  colorPreset: "neon" | "amber" | "ice" | "mono";
  fontPreset: "jetbrainsMono" | "bitcountSingle" | "doto" | "firaCode";
  fontSize: number;
  livePulseStrip: boolean;
  livePlayingNoteHighlights: boolean;
  activeNote: string | null;
  activeNotes?: string[];
  activeLiterals?: string[];
  activeControls?: string[];
  nPulse?: number;
  onCodeChange?: (code: string) => void;
  isExportingMp3: boolean;
  mp3Quality: "fast" | "good" | "best";
  mp3Status: string;
  mp3Progress: number;
  mp3Speed: string;
  isMobile: boolean;
  mobileHeaderExpanded: boolean;
};

export function AudioWorkspace({
  code,
  play,
  stop,
  status,
  error,
  loadMsg,
  opacity,
  colorPreset,
  fontPreset,
  fontSize,
  livePulseStrip,
  livePlayingNoteHighlights,
  activeNote,
  activeNotes,
  activeLiterals,
  activeControls,
  nPulse,
  onCodeChange,
  isExportingMp3,
  mp3Quality,
  mp3Status,
  mp3Progress,
  mp3Speed,
  isMobile,
  mobileHeaderExpanded,
}: AudioWorkspaceProps) {
  return (
    <>
      {isExportingMp3 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(2,4,8,0.72)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              width: "min(420px, 86vw)",
              background: "rgba(7,12,20,0.92)",
              border: "1px solid rgba(0,255,136,0.28)",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 0 30px rgba(0,255,136,0.18)",
            }}
          >
            <div
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: 12,
                letterSpacing: 1,
                color: "#00ff88",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Exporting MP3
            </div>
            <div
              style={{
                color: "#6cd4b8",
                fontSize: 11,
                marginBottom: 6,
                fontFamily: '"JetBrains Mono",monospace',
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              quality: {mp3Quality}
            </div>
            <div
              style={{
                color: "#9bb3a3",
                fontSize: 12,
                marginBottom: 10,
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              {mp3Status || "Converting..."}
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.max(4, Math.round(mp3Progress * 100))}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#00ff88,#00d7ff)",
                  boxShadow: "0 0 12px rgba(0,255,136,0.35)",
                  transition: "width 0.18s ease",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 8,
                textAlign: "right",
                color: "#8db9a9",
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: 11,
              }}
            >
              {Math.round(mp3Progress * 100)}%{mp3Speed ? ` • ${mp3Speed}` : ""}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: isMobile ? (mobileHeaderExpanded ? 142 : 96) : 48,
          left: 0,
          right: 0,
          bottom: 0,
          padding: isMobile ? 10 : 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 760,
            height: isMobile ? "calc(100vh - 124px)" : "70vh",
          }}
        >
          <StrudelEditor
            code={code}
            play={play}
            stop={stop}
            status={status}
            error={error}
            loadMsg={loadMsg}
            opacity={opacity}
            colorPreset={colorPreset}
            fontPreset={fontPreset}
            fontSize={fontSize}
            livePulseStrip={livePulseStrip}
            livePlayingNoteHighlights={livePlayingNoteHighlights}
            activeNote={activeNote}
            activeNotes={activeNotes}
            activeLiterals={activeLiterals}
            activeControls={activeControls}
            nPulse={nPulse}
            onCodeChange={onCodeChange}
          />
        </div>
      </div>
    </>
  );
}
