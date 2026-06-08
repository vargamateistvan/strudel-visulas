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
  onHowItWorksOpen: () => void;
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

export const Header: React.FC<HeaderProps> = ({
  status,
  isMobile,
  onMobileAdvancedOpenChange,
  onSettingsOpen,
  onPresetsOpen,
  onHowItWorksOpen,
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
  const controlSize = isMobile ? 10 : 11;
  const [mobileAdvancedOpen, setMobileAdvancedOpen] = useState(false);
  const chromeBg = "rgba(0,0,0,0.94)";
  const surfaceSoft = "rgba(10,10,10,0.9)";
  const surfaceStrong = "rgba(16,16,16,0.95)";
  const borderSoft = "1px solid rgba(255,255,255,0.2)";

  useEffect(() => {
    onMobileAdvancedOpenChange?.(isMobile && mobileAdvancedOpen);
  }, [isMobile, mobileAdvancedOpen, onMobileAdvancedOpenChange]);

  useEffect(() => {
    if (!isMobile) {
      setMobileAdvancedOpen(false);
    }
  }, [isMobile]);

  const baseButtonStyle: React.CSSProperties = {
    borderRadius: 6,
    cursor: "pointer",
    fontSize: controlSize,
    fontFamily: '"JetBrains Mono",monospace',
    fontWeight: 700,
    letterSpacing: 1,
    flexShrink: 0,
    transition: "all 0.18s ease",
  };

  const logo = (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      <img
        src="/brand-mark.svg"
        alt="Strudel Studio"
        style={{
          width: isMobile ? 22 : 28,
          height: isMobile ? 22 : 28,
          objectFit: "contain",
          flexShrink: 0,
        }}
      />
    </div>
  );

  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        minHeight: isMobile ? 100 : 52,
        display: "flex",
        alignItems: "stretch",
        flexDirection: "column",
        gap: isMobile ? 6 : 0,
        padding: isMobile ? "8px 10px" : "0 18px",
        background: chromeBg,
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.42)",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-10%",
          top: -24,
          width: "120%",
          height: 56,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
          backgroundSize: "200% 100%",
          filter: "blur(14px)",
          animation: "none",
        }}
      />

      {!isMobile && (
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
          }}
        >
          {logo}
          <div style={{ flex: 1 }} />

          <button
            onClick={onPresetsOpen}
            style={{
              ...baseButtonStyle,
              background: surfaceStrong,
              border: borderSoft,
              padding: "6px 12px",
              color: "#e5e7eb",
              textShadow: "none",
              boxShadow: "none",
            }}
          >
            PRESETS
          </button>

          <button
            onClick={onHowItWorksOpen}
            style={{
              ...baseButtonStyle,
              background: "rgba(0,220,255,0.12)",
              border: "1px solid rgba(0,220,255,0.3)",
              padding: "6px 12px",
              color: "#9defff",
              textShadow: "none",
              boxShadow: "none",
            }}
          >
            HOW IT WORKS
          </button>

          <select
            value={recordingMode}
            onChange={(e) => onRecordingMode(e.target.value as RecordingMode)}
            disabled={isRecording || isExportingMp3}
            style={{
              background: surfaceStrong,
              border: borderSoft,
              borderRadius: 6,
              padding: "6px 9px",
              color: "#e5e7eb",
              fontSize: controlSize,
              fontFamily: '"JetBrains Mono",monospace',
              flexShrink: 0,
              boxShadow: "none",
            }}
          >
            <option value="audio">AUDIO</option>
            <option value="video">VIDEO</option>
            <option value="midi">MIDI</option>
          </select>

          <select
            value={mp3Quality}
            onChange={(e) => onMp3Quality(e.target.value as Mp3Quality)}
            disabled={
              recordingMode !== "audio" || isRecording || isExportingMp3
            }
            style={{
              background: surfaceStrong,
              border: borderSoft,
              borderRadius: 6,
              padding: "6px 9px",
              color: recordingMode === "audio" ? "#e5e7eb" : "#7c828c",
              fontSize: controlSize,
              fontFamily: '"JetBrains Mono",monospace',
              opacity: recordingMode === "audio" ? 1 : 0.7,
              flexShrink: 0,
              boxShadow: "none",
            }}
          >
            <option value="fast">MP3 FAST</option>
            <option value="good">MP3 GOOD</option>
            <option value="best">MP3 BEST</option>
          </select>

          {isRecording ? (
            <button
              onClick={onRecordStop}
              style={{
                ...baseButtonStyle,
                background: "linear-gradient(135deg,#ff5f70,#ff2f58)",
                border: "none",
                padding: "6px 12px",
                color: "#fff",
                boxShadow: "0 0 13px rgba(255,47,88,0.44)",
                textShadow: "0 0 7px rgba(255,255,255,0.22)",
              }}
            >
              ● STOP REC {recordingLabel}
            </button>
          ) : (
            <button
              onClick={onRecordStart}
              disabled={status !== "playing" || isExportingMp3}
              style={{
                ...baseButtonStyle,
                background:
                  status === "playing" && !isExportingMp3
                    ? "linear-gradient(135deg,#ff7a7a,#ff4d4d)"
                    : "rgba(255,122,122,0.14)",
                border: "none",
                padding: "6px 12px",
                cursor:
                  status === "playing" && !isExportingMp3
                    ? "pointer"
                    : "default",
                color:
                  status === "playing" && !isExportingMp3 ? "#fff" : "#ff9a9a",
                opacity: status === "playing" && !isExportingMp3 ? 1 : 0.6,
                boxShadow:
                  status === "playing" && !isExportingMp3
                    ? "0 0 11px rgba(255,70,70,0.32)"
                    : "none",
              }}
            >
              ● REC
            </button>
          )}

          {status === "playing" ? (
            <button
              onClick={onStop}
              style={{
                ...baseButtonStyle,
                background: surfaceStrong,
                border: borderSoft,
                padding: "6px 16px",
                color: "#e5e7eb",
                boxShadow: "none",
                textShadow: "none",
              }}
            >
              ■ STOP
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={status === "loading"}
              style={{
                ...baseButtonStyle,
                background:
                  status === "loading"
                    ? "rgba(0,255,136,0.15)"
                    : "linear-gradient(135deg,#00ff88,#00ffcc)",
                border: "none",
                padding: "6px 16px",
                cursor: status === "loading" ? "default" : "pointer",
                color: status === "loading" ? "#00ff88" : "#000",
                opacity: status === "loading" ? 0.6 : 1,
                boxShadow:
                  status === "loading"
                    ? "none"
                    : "0 0 14px rgba(0,255,166,0.3), 0 0 4px rgba(255,255,255,0.2) inset",
              }}
            >
              {status === "loading" ? "... LOADING" : "▶ PLAY"}
            </button>
          )}

          <button
            onClick={onSettingsOpen}
            title="Settings"
            style={{
              ...baseButtonStyle,
              background: surfaceStrong,
              border: borderSoft,
              padding: "6px 10px",
              color: "#d1d5db",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "none",
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
            <span>SETTINGS</span>
          </button>
        </div>
      )}

      {isMobile && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              width: "100%",
              flexShrink: 0,
            }}
          >
            {logo}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              overflowX: "auto",
              paddingBottom: 2,
              flexWrap: "nowrap",
            }}
          >
            <button
              onClick={onPresetsOpen}
              style={{
                ...baseButtonStyle,
                background: surfaceStrong,
                border: borderSoft,
                padding: "6px 10px",
                color: "#e5e7eb",
                textShadow: "none",
                boxShadow: "none",
              }}
            >
              PRESETS
            </button>

            <button
              onClick={onHowItWorksOpen}
              style={{
                ...baseButtonStyle,
                background: "rgba(0,220,255,0.12)",
                border: "1px solid rgba(0,220,255,0.3)",
                padding: "6px 10px",
                color: "#9defff",
                boxShadow: "none",
              }}
            >
              HELP
            </button>

            <button
              onClick={() => setMobileAdvancedOpen((v) => !v)}
              style={{
                ...baseButtonStyle,
                background: surfaceSoft,
                border: borderSoft,
                padding: "6px 10px",
                color: "#d1d5db",
              }}
              title="Toggle recording options"
            >
              OPTIONS {mobileAdvancedOpen ? "▴" : "▾"}
            </button>

            {isRecording ? (
              <button
                onClick={onRecordStop}
                style={{
                  ...baseButtonStyle,
                  background: "linear-gradient(135deg,#ff5f70,#ff2f58)",
                  border: "none",
                  padding: "6px 10px",
                  color: "#fff",
                  boxShadow: "0 0 13px rgba(255,47,88,0.44)",
                }}
              >
                ● STOP REC {recordingLabel}
              </button>
            ) : (
              <button
                onClick={onRecordStart}
                disabled={status !== "playing" || isExportingMp3}
                style={{
                  ...baseButtonStyle,
                  background:
                    status === "playing" && !isExportingMp3
                      ? "linear-gradient(135deg,#ff7a7a,#ff4d4d)"
                      : "rgba(255,122,122,0.14)",
                  border: "none",
                  padding: "6px 10px",
                  cursor:
                    status === "playing" && !isExportingMp3
                      ? "pointer"
                      : "default",
                  color:
                    status === "playing" && !isExportingMp3
                      ? "#fff"
                      : "#ff9a9a",
                  opacity: status === "playing" && !isExportingMp3 ? 1 : 0.6,
                  boxShadow:
                    status === "playing" && !isExportingMp3
                      ? "0 0 11px rgba(255,70,70,0.32)"
                      : "none",
                }}
              >
                ● REC
              </button>
            )}

            {status === "playing" ? (
              <button
                onClick={onStop}
                style={{
                  ...baseButtonStyle,
                  background: surfaceStrong,
                  border: borderSoft,
                  padding: "6px 12px",
                  color: "#e5e7eb",
                  boxShadow: "none",
                }}
              >
                ■ STOP
              </button>
            ) : (
              <button
                onClick={onPlay}
                disabled={status === "loading"}
                style={{
                  ...baseButtonStyle,
                  background:
                    status === "loading"
                      ? "rgba(0,255,136,0.15)"
                      : "linear-gradient(135deg,#00ff88,#00ffcc)",
                  border: "none",
                  padding: "6px 12px",
                  cursor: status === "loading" ? "default" : "pointer",
                  color: status === "loading" ? "#00ff88" : "#000",
                  boxShadow:
                    status === "loading"
                      ? "none"
                      : "0 0 14px rgba(0,255,166,0.3), 0 0 4px rgba(255,255,255,0.2) inset",
                  opacity: status === "loading" ? 0.6 : 1,
                }}
              >
                {status === "loading" ? "... LOADING" : "▶ PLAY"}
              </button>
            )}

            <button
              onClick={onSettingsOpen}
              style={{
                ...baseButtonStyle,
                background: surfaceStrong,
                border: borderSoft,
                padding: "6px 8px",
                color: "#d1d5db",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "none",
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
              <span>SETTINGS</span>
            </button>
          </div>
        </>
      )}

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
              background: surfaceStrong,
              border: borderSoft,
              borderRadius: 6,
              padding: "7px 8px",
              color: "#e5e7eb",
              fontSize: controlSize,
              fontFamily: '"JetBrains Mono",monospace',
              boxShadow: "none",
            }}
          >
            <option value="audio">AUDIO</option>
            <option value="video">VIDEO</option>
            <option value="midi">MIDI</option>
          </select>

          <select
            value={mp3Quality}
            onChange={(e) => onMp3Quality(e.target.value as Mp3Quality)}
            disabled={
              recordingMode !== "audio" || isRecording || isExportingMp3
            }
            style={{
              flex: 1,
              background: surfaceStrong,
              border: borderSoft,
              borderRadius: 6,
              padding: "7px 8px",
              color: recordingMode === "audio" ? "#e5e7eb" : "#7c828c",
              fontSize: controlSize,
              fontFamily: '"JetBrains Mono",monospace',
              opacity: recordingMode === "audio" ? 1 : 0.7,
              boxShadow: "none",
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
