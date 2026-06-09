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
    isExportingMp3,
    onRecordStart,
    onRecordStop,
  } = props;

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const canRecord = isPlaying && !isExportingMp3;
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

  const iconButtonBase: React.CSSProperties = {
    ...buttonBase,
    width: isMobile ? 38 : 40,
    height: isMobile ? 38 : 40,
    padding: 0,
  };

  const iconStyle = {
    width: 16,
    height: 16,
    display: "block",
  } as const;

  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        minHeight: isMobile ? 54 : 52,
        padding: isMobile ? "8px 10px" : "8px 14px",
        background:
          "linear-gradient(180deg, rgba(10,10,14,0.96), rgba(10,10,14,0.9))",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
        </div>

        <div
          style={{
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
              style={withHover("stop", iconButtonBase, unifiedHoverStyle, true)}
              title="Stop"
              aria-label="Stop"
            >
              <svg {...iconStyle} viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={isLoading}
              {...hoverHandlers("play", !isLoading)}
              style={withHover(
                "play",
                {
                  ...iconButtonBase,
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
              title={isLoading ? "Loading" : "Play"}
              aria-label={isLoading ? "Loading" : "Play"}
            >
              <svg {...iconStyle} viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l11-6.5-11-6.5z" />
              </svg>
            </button>
          )}

          {isRecording ? (
            <button
              onClick={onRecordStop}
              {...hoverHandlers("rec-stop")}
              style={withHover(
                "rec-stop",
                {
                  ...iconButtonBase,
                  border: "1px solid rgba(255,122,135,0.45)",
                  background: "rgba(255,122,135,0.14)",
                  color: "#ffb7c0",
                },
                unifiedHoverStyle,
                true,
              )}
              title="Stop recording"
              aria-label="Stop recording"
            >
              <svg {...iconStyle} viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onRecordStart}
              disabled={!canRecord}
              {...hoverHandlers("rec", canRecord)}
              style={withHover(
                "rec",
                {
                  ...iconButtonBase,
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
              title={canRecord ? "Record" : "Start playback to record"}
              aria-label={canRecord ? "Record" : "Start playback to record"}
            >
              <svg {...iconStyle} viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="5" />
              </svg>
            </button>
          )}

          <button
            onClick={onPresetsOpen}
            {...hoverHandlers("library")}
            style={withHover(
              "library",
              iconButtonBase,
              unifiedHoverStyle,
              true,
            )}
            title="Library"
            aria-label="Library"
          >
            <svg
              {...iconStyle}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 5h16v14H4z" />
              <path d="M8 5v14" />
            </svg>
          </button>

          <button
            onClick={onSettingsOpen}
            {...hoverHandlers("settings")}
            style={withHover(
              "settings",
              iconButtonBase,
              unifiedHoverStyle,
              true,
            )}
            title="Audio settings"
            aria-label="Audio settings"
          >
            <svg
              {...iconStyle}
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
            style={withHover("how", iconButtonBase, unifiedHoverStyle, true)}
            title="How it works"
            aria-label="How it works"
          >
            <svg
              {...iconStyle}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" />
              <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
