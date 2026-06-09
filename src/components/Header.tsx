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

export const Header: React.FC<HeaderProps> = (props) => {
  const {
    status,
    isMobile,
    onMobileAdvancedOpenChange,
    onSettingsOpen,
    onPresetsOpen,
    onHowItWorksOpen,
    onPlay,
    onStop,
    isRecording,
    recordingMode,
    onRecordingMode,
    isExportingMp3,
    onRecordStart,
    onRecordStop,
  } = props;

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const canRecord = isPlaying && !isExportingMp3;
  const selectedMode: RecordingMode =
    recordingMode === "midi" ? "audio" : recordingMode;
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);

  const withHover = (
    id: string,
    baseStyle: React.CSSProperties,
    hoverStyle: React.CSSProperties,
    enabled = true,
  ): React.CSSProperties => ({
    ...baseStyle,
    transition:
      "border-color 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 120ms ease",
    ...(enabled && hoveredControl === id ? hoverStyle : null),
  });

  const hoverHandlers = (id: string, enabled = true) =>
    enabled
      ? {
          onMouseEnter: () => setHoveredControl(id),
          onMouseLeave: () =>
            setHoveredControl((prev) => (prev === id ? null : prev)),
        }
      : {};

  useEffect(() => {
    onMobileAdvancedOpenChange?.(false);
  }, [onMobileAdvancedOpenChange, isMobile]);

  const buttonBase: React.CSSProperties = {
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(255,255,255,0.02)",
    color: "#a9b2be",
    fontFamily: '"JetBrains Mono",monospace',
    fontSize: isMobile ? 10 : 11,
    letterSpacing: 1,
    fontWeight: 700,
    padding: isMobile ? "7px 9px" : "7px 10px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    whiteSpace: "nowrap",
  };

  const unifiedHoverStyle: React.CSSProperties = {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#d2dae4",
    boxShadow: "0 6px 20px rgba(0,0,0,0.24)",
    transform: "translateY(-1px)",
  };

  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        minHeight: isMobile ? 56 : 50,
        padding: isMobile ? "8px 10px" : "8px 14px",
        background: "rgba(8,8,18,0.92)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 8,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src="/brand-mark.svg"
            alt="Strudel Studio"
            style={{
              width: isMobile ? 20 : 24,
              height: isMobile ? 20 : 24,
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: isMobile ? 10 : 11,
              letterSpacing: 1.4,
              color: "#00ff88",
              fontWeight: 700,
            }}
          >
            STRUDEL STUDIO
          </span>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {isPlaying ? (
            <button
              onClick={onStop}
              {...hoverHandlers("stop")}
              style={withHover("stop", buttonBase, unifiedHoverStyle, true)}
            >
              ■ Stop
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={isLoading}
              {...hoverHandlers("play", !isLoading)}
              style={withHover(
                "play",
                {
                  ...buttonBase,
                  color: isLoading ? "#6bd6ad" : "#00ff88",
                  border: "1px solid rgba(0,255,136,0.3)",
                  background: isLoading
                    ? "rgba(0,255,136,0.08)"
                    : "rgba(0,255,136,0.12)",
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? "default" : "pointer",
                },
                unifiedHoverStyle,
                !isLoading,
              )}
            >
              ▶ {isLoading ? "Loading" : "Play"}
            </button>
          )}

          {isRecording ? (
            <button
              onClick={onRecordStop}
              {...hoverHandlers("rec-stop")}
              style={withHover(
                "rec-stop",
                {
                  ...buttonBase,
                  border: "1px solid rgba(255,122,135,0.45)",
                  background: "rgba(255,122,135,0.14)",
                  color: "#ffb7c0",
                },
                unifiedHoverStyle,
                true,
              )}
            >
              ● Stop Rec
            </button>
          ) : (
            <button
              onClick={onRecordStart}
              disabled={!canRecord}
              {...hoverHandlers("rec", canRecord)}
              style={withHover(
                "rec",
                {
                  ...buttonBase,
                  border: canRecord
                    ? "1px solid rgba(255,122,135,0.45)"
                    : "1px solid rgba(255,122,135,0.22)",
                  background: canRecord
                    ? "rgba(255,122,135,0.14)"
                    : "rgba(255,122,135,0.08)",
                  color: canRecord ? "#ffb7c0" : "#b98c92",
                  opacity: canRecord ? 1 : 0.65,
                  cursor: canRecord ? "pointer" : "default",
                },
                unifiedHoverStyle,
                canRecord,
              )}
            >
              ● Rec
            </button>
          )}

          <select
            value={selectedMode}
            onChange={(e) => onRecordingMode(e.target.value as RecordingMode)}
            disabled={isRecording || isExportingMp3}
            {...hoverHandlers("mode", !(isRecording || isExportingMp3))}
            style={withHover(
              "mode",
              {
                ...buttonBase,
                padding: isMobile ? "7px 8px" : "7px 9px",
                minWidth: 84,
              },
              unifiedHoverStyle,
              !(isRecording || isExportingMp3),
            )}
          >
            <option value="audio">Audio</option>
            <option value="video">Video</option>
          </select>

          <button
            onClick={onPresetsOpen}
            {...hoverHandlers("library")}
            style={withHover("library", buttonBase, unifiedHoverStyle, true)}
            title="Library"
          >
            Library
          </button>

          <button
            onClick={onSettingsOpen}
            {...hoverHandlers("settings")}
            style={withHover(
              "settings",
              {
                ...buttonBase,
                width: 34,
                paddingLeft: 0,
                paddingRight: 0,
              },
              unifiedHoverStyle,
              true,
            )}
            title="Audio settings"
            aria-label="Audio settings"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="2" y1="14" x2="6" y2="14" />
              <line x1="10" y1="8" x2="14" y2="8" />
              <line x1="18" y1="16" x2="22" y2="16" />
            </svg>
          </button>

          <button
            onClick={onHowItWorksOpen}
            {...hoverHandlers("how")}
            style={withHover(
              "how",
              {
                ...buttonBase,
                width: 34,
                paddingLeft: 0,
                paddingRight: 0,
              },
              unifiedHoverStyle,
              true,
            )}
            title="How it works"
            aria-label="How it works"
          >
            ?
          </button>
        </div>
      </div>
    </header>
  );
};
