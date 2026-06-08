import React, { useEffect, useState } from "react";
import type { StrudelStatus } from "../hooks/useStrudel";

export type RecordingMode = "audio" | "video" | "midi";
export type Mp3Quality = "fast" | "good" | "best";

interface HeaderProps {
  status: StrudelStatus;
  isMobile: boolean;
  onMobileAdvancedOpenChange?: (open: boolean) => void;
  onSettingsOpen: () => void;
  onPresetsOpen: () => void;
  onPlay: () => void;
  onStop: () => void;
  isRecording: boolean;
  recordingLabel: string;
  recordingMode: RecordingMode;
  onRecordingMode: (mode: RecordingMode) => void;
  mp3Quality: Mp3Quality;
  onMp3Quality: (quality: Mp3Quality) => void;
  isExportingMp3: boolean;
  onRecordStart: () => void;
  onRecordStop: () => void;
}

const STATUS_COLOR: Record<StrudelStatus, string> = {
  idle: "#333",
  loading: "#ffcc00",
  playing: "#00ff88",
  error: "#ff3366",
};

const STATUS_LABEL: Record<StrudelStatus, string> = {
  idle: "IDLE",
  loading: "LOADING",
  playing: "LIVE",
  error: "ERROR",
};

export const Header: React.FC<HeaderProps> = ({
  status,
  isMobile,
  onMobileAdvancedOpenChange,
  onSettingsOpen,
  onPresetsOpen,
  onPlay,
  onStop,
  isRecording,
  recordingLabel,
  recordingMode,
  onRecordingMode,
  mp3Quality,
  onMp3Quality,
  isExportingMp3,
  onRecordStart,
  onRecordStop,
}) => {
  const dotColor = STATUS_COLOR[status];
  const controlSize = isMobile ? 10 : 11;
  const [mobileAdvancedOpen, setMobileAdvancedOpen] = useState(false);

  useEffect(() => {
    onMobileAdvancedOpenChange?.(isMobile && mobileAdvancedOpen);
  }, [isMobile, mobileAdvancedOpen, onMobileAdvancedOpenChange]);

  useEffect(() => {
    if (!isMobile) {
      setMobileAdvancedOpen(false);
    }
  }, [isMobile]);

  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        minHeight: isMobile ? 96 : 48,
        display: "flex",
        alignItems: isMobile ? "stretch" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 6 : 0,
        padding: isMobile ? "8px 10px" : "0 20px",
        background: "rgba(5,5,12,0.7)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo / title + status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: isMobile ? 22 : 28,
            height: isMobile ? 22 : 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#00ff88,#00ffff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isMobile ? 12 : 14,
            fontWeight: 900,
            color: "#000",
            flexShrink: 0,
          }}
        >
          S
        </div>
        <span
          style={{
            fontFamily: '"JetBrains Mono",monospace',
            fontWeight: 700,
            fontSize: isMobile ? 11 : 13,
            letterSpacing: isMobile ? 1.5 : 3,
            color: "#00ff88",
            textTransform: "uppercase",
          }}
        >
          STRUDEL STUDIO
        </span>
        </div>

        {/* Status pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            borderRadius: 20,
            background: `${dotColor}18`,
            border: `1px solid ${dotColor}44`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: dotColor,
              boxShadow: status === "playing" ? `0 0 8px ${dotColor}` : "none",
              animation:
                status === "loading"
                  ? "pulse 0.8s ease-in-out infinite"
                  : "none",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontFamily: '"JetBrains Mono",monospace',
              fontWeight: 700,
              letterSpacing: 1.5,
              color: dotColor,
            }}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      {/* Controls row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          overflowX: isMobile ? "auto" : "visible",
          paddingBottom: isMobile ? 2 : 0,
        }}
      >

      {/* Presets button */}
      <button
        onClick={onPresetsOpen}
        style={{
          background: "rgba(122,230,255,0.1)",
          border: "1px solid rgba(122,230,255,0.35)",
          borderRadius: 6,
          padding: isMobile ? "6px 10px" : "6px 12px",
          cursor: "pointer",
          color: "#7ae6ff",
          fontSize: controlSize,
          fontFamily: '"JetBrains Mono",monospace',
          fontWeight: 700,
          letterSpacing: 1,
          flexShrink: 0,
        }}
      >
        PRESETS
      </button>

      {/* Recording advanced controls */}
      {!isMobile && (
        <>
          <select
            value={recordingMode}
            onChange={(e) => onRecordingMode(e.target.value as RecordingMode)}
            disabled={isRecording || isExportingMp3}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "6px 9px",
              color: "#c7d2dd",
              fontSize: controlSize,
              fontFamily: '"JetBrains Mono",monospace',
              flexShrink: 0,
            }}
          >
            <option value="audio">AUDIO</option>
            <option value="video">VIDEO</option>
            <option value="midi">MIDI</option>
          </select>

          <select
            value={mp3Quality}
            onChange={(e) => onMp3Quality(e.target.value as Mp3Quality)}
            disabled={recordingMode !== "audio" || isRecording || isExportingMp3}
            title={
              recordingMode === "audio"
                ? "MP3 quality preset"
                : "MP3 quality applies to AUDIO mode"
            }
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "6px 9px",
              color: recordingMode === "audio" ? "#c7d2dd" : "#7b8792",
              fontSize: controlSize,
              fontFamily: '"JetBrains Mono",monospace',
              opacity: recordingMode === "audio" ? 1 : 0.7,
              flexShrink: 0,
            }}
          >
            <option value="fast">MP3 FAST</option>
            <option value="good">MP3 GOOD</option>
            <option value="best">MP3 BEST</option>
          </select>
        </>
      )}

      {isMobile && (
        <button
          onClick={() => setMobileAdvancedOpen((v) => !v)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 6,
            padding: "6px 10px",
            cursor: "pointer",
            color: "#c7d2dd",
            fontSize: controlSize,
            fontFamily: '"JetBrains Mono",monospace',
            letterSpacing: 0.8,
            flexShrink: 0,
          }}
          title="Toggle recording options"
        >
          OPTIONS {mobileAdvancedOpen ? "▴" : "▾"}
        </button>
      )}

      {isRecording ? (
        <button
          onClick={onRecordStop}
          style={{
            background: "linear-gradient(135deg,#ff5f70,#ff2f58)",
            border: "none",
            borderRadius: 6,
            padding: isMobile ? "6px 10px" : "6px 12px",
            cursor: "pointer",
            color: "#fff",
            fontSize: controlSize,
            fontFamily: '"JetBrains Mono",monospace',
            fontWeight: 700,
            letterSpacing: 1,
            boxShadow: "0 0 12px rgba(255,47,88,0.35)",
            flexShrink: 0,
          }}
        >
          ● STOP REC {recordingLabel}
        </button>
      ) : (
        <button
          onClick={onRecordStart}
          disabled={status !== "playing" || isExportingMp3}
          style={{
            background:
              status === "playing" && !isExportingMp3
                ? "linear-gradient(135deg,#ff7a7a,#ff4d4d)"
                : "rgba(255,122,122,0.14)",
            border: "none",
            borderRadius: 6,
            padding: isMobile ? "6px 10px" : "6px 12px",
            cursor:
              status === "playing" && !isExportingMp3 ? "pointer" : "default",
            color: status === "playing" && !isExportingMp3 ? "#fff" : "#ff9a9a",
            opacity: status === "playing" && !isExportingMp3 ? 1 : 0.6,
            fontSize: controlSize,
            fontFamily: '"JetBrains Mono",monospace',
            fontWeight: 700,
            letterSpacing: 1,
            flexShrink: 0,
          }}
          title={
            status === "playing" && !isExportingMp3
              ? "Record audio (WebM)"
              : isExportingMp3
                ? "MP3 export in progress"
                : "Start playback first to record"
          }
        >
          ● REC
        </button>
      )}

      {/* Play / Stop button */}
      {status === "playing" ? (
        <button
          onClick={onStop}
          style={{
            background: "linear-gradient(135deg,#ff3366,#ff0088)",
            border: "none",
            borderRadius: 6,
            padding: isMobile ? "6px 12px" : "6px 16px",
            cursor: "pointer",
            color: "#fff",
            fontSize: controlSize,
            fontFamily: '"JetBrains Mono",monospace',
            fontWeight: 700,
            letterSpacing: 1,
            boxShadow: "0 0 12px rgba(255,0,136,0.35)",
            flexShrink: 0,
          }}
        >
          ■ STOP
        </button>
      ) : (
        <button
          onClick={onPlay}
          disabled={status === "loading"}
          style={{
            background:
              status === "loading"
                ? "rgba(0,255,136,0.15)"
                : "linear-gradient(135deg,#00ff88,#00ffcc)",
            border: "none",
            borderRadius: 6,
            padding: isMobile ? "6px 12px" : "6px 16px",
            cursor: status === "loading" ? "default" : "pointer",
            color: status === "loading" ? "#00ff88" : "#000",
            fontSize: controlSize,
            fontFamily: '"JetBrains Mono",monospace',
            fontWeight: 700,
            letterSpacing: 1,
            boxShadow:
              status === "loading" ? "none" : "0 0 12px rgba(0,255,136,0.3)",
            opacity: status === "loading" ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          {status === "loading" ? "… LOADING" : "▶ PLAY"}
        </button>
      )}

      {/* Settings button */}
      <button
        onClick={onSettingsOpen}
        title="Settings"
        style={{
          background: "none",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          padding: isMobile ? "6px 8px" : "6px 10px",
          cursor: "pointer",
          color: "#888",
          fontSize: isMobile ? 14 : 16,
          lineHeight: 1,
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#00ff88";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(0,255,136,0.4)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#888";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(255,255,255,0.1)";
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span
          style={{
            fontSize: controlSize,
            fontFamily: '"JetBrains Mono",monospace',
            letterSpacing: 1,
          }}
        >
          SETTINGS
        </span>
      </button>
      </div>

      {isMobile && mobileAdvancedOpen && (
        <div
          style={{
            width: "100%",
            display: "flex",
            gap: 8,
            marginTop: 2,
          }}
        >
          <select
            value={recordingMode}
            onChange={(e) => onRecordingMode(e.target.value as RecordingMode)}
            disabled={isRecording || isExportingMp3}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "7px 8px",
              color: "#c7d2dd",
              fontSize: controlSize,
              fontFamily: '"JetBrains Mono",monospace',
            }}
          >
            <option value="audio">AUDIO</option>
            <option value="video">VIDEO</option>
            <option value="midi">MIDI</option>
          </select>

          <select
            value={mp3Quality}
            onChange={(e) => onMp3Quality(e.target.value as Mp3Quality)}
            disabled={recordingMode !== "audio" || isRecording || isExportingMp3}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "7px 8px",
              color: recordingMode === "audio" ? "#c7d2dd" : "#7b8792",
              fontSize: controlSize,
              fontFamily: '"JetBrains Mono",monospace',
              opacity: recordingMode === "audio" ? 1 : 0.7,
            }}
          >
            <option value="fast">MP3 FAST</option>
            <option value="good">MP3 GOOD</option>
            <option value="best">MP3 BEST</option>
          </select>
        </div>
      )}
    </header>
  );
};
