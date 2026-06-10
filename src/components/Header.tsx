import React, { useCallback, useEffect, useMemo, useRef } from "react";
import type { StrudelStatus } from "../hooks/useStrudel";
import { HeaderIconButton } from "./header/HeaderIconButton";

export type RecordingMode = "audio" | "video" | "midi";
export type Mp3Quality = "fast" | "good" | "best";

interface HeaderProps {
  status: StrudelStatus;
  isMobile: boolean;
  onMobileAdvancedOpenChange?: (open: boolean) => void;
  onSettingsOpen: () => void;
  onPresetsOpen: () => void;
  sampleWorkspaceOpen: boolean;
  onSampleWorkspaceToggle: () => void;
  onHowItWorksOpen: () => void;
  onPlay: () => void;
  onStop: () => void;
  isRecording: boolean;
  isExportingMp3: boolean;
  onRecordStart: () => void;
  onRecordStop: () => void;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

interface VolumePotmeterProps {
  value: number;
  isMobile: boolean;
  onChange: (volume: number) => void;
}

const VolumePotmeter: React.FC<VolumePotmeterProps> = ({
  value,
  isMobile,
  onChange,
}) => {
  const knobRef = useRef<HTMLDivElement | null>(null);
  const suppressClickRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const pct = Math.round(value * 100);
  const sweep = 270;
  const angle = -135 + clamp01(value) * sweep;

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = knobRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let nextAngle =
        (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
      if (nextAngle > 180) nextAngle -= 360;
      const clampedAngle = Math.max(-135, Math.min(135, nextAngle));
      onChange((clampedAngle + 135) / sweep);
    },
    [onChange],
  );

  const startMouseDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    suppressClickRef.current = false;
    updateFromPoint(event.clientX, event.clientY);

    const onMove = (moveEvent: MouseEvent) => {
      const start = pointerStartRef.current;
      if (start) {
        const dx = moveEvent.clientX - start.x;
        const dy = moveEvent.clientY - start.y;
        if (Math.hypot(dx, dy) > 4) {
          suppressClickRef.current = true;
        }
      }
      updateFromPoint(moveEvent.clientX, moveEvent.clientY);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startTouchDrag = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;
    pointerStartRef.current = { x: touch.clientX, y: touch.clientY };
    suppressClickRef.current = false;
    updateFromPoint(touch.clientX, touch.clientY);

    const onMove = (moveEvent: TouchEvent) => {
      const next = moveEvent.touches[0];
      if (!next) return;
      const start = pointerStartRef.current;
      if (start) {
        const dx = next.clientX - start.x;
        const dy = next.clientY - start.y;
        if (Math.hypot(dx, dy) > 6) {
          suppressClickRef.current = true;
        }
      }
      updateFromPoint(next.clientX, next.clientY);
    };
    const onEnd = () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };

    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
  };

  const knobSize = isMobile ? 30 : 34;
  const markerDistance = isMobile ? -9 : -11;

  const ringGradient = useMemo(() => {
    const activeDeg = clamp01(value) * sweep;
    return `conic-gradient(from 225deg, #00ff88 0deg, #66e0ff ${activeDeg}deg, rgba(255,255,255,0.15) ${activeDeg}deg, rgba(255,255,255,0.15) ${sweep}deg, transparent ${sweep}deg)`;
  }, [value]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: isMobile ? 42 : 46,
        padding: "0 4px",
        color: "#b8c2d6",
      }}
      title={`Master volume: ${pct}%`}
    >
      <div
        role="slider"
        aria-label="Master volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            onChange(clamp01(value + 0.02));
          } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            onChange(clamp01(value - 0.02));
          } else if (event.key === "Home") {
            event.preventDefault();
            onChange(0);
          } else if (event.key === "End") {
            event.preventDefault();
            onChange(1);
          }
        }}
        style={{
          width: knobSize,
          height: knobSize,
          borderRadius: "50%",
          position: "relative",
          cursor: "grab",
          outline: "none",
        }}
      >
        <div
          ref={knobRef}
          onClick={() => {
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
            }
          }}
          onMouseDown={startMouseDrag}
          onTouchStart={startTouchDrag}
          onWheel={(event) => {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -0.02 : 0.02;
            onChange(clamp01(value + delta));
          }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: ringGradient,
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.2), 0 2px 10px rgba(0,0,0,0.45)",
            touchAction: "none",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 4,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 30%, #2e3949 0%, #151b24 62%, #0c1118 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 4,
              height: isMobile ? 8 : 9,
              borderRadius: 999,
              background: "#d8e2f4",
              boxShadow: "0 0 6px rgba(102,224,255,0.5)",
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(${markerDistance}px)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = (props) => {
  const {
    status,
    isMobile,
    onMobileAdvancedOpenChange,
    onSettingsOpen,
    onPresetsOpen,
    sampleWorkspaceOpen,
    onSampleWorkspaceToggle,
    onHowItWorksOpen,
    onPlay,
    onStop,
    isRecording,
    isExportingMp3,
    onRecordStart,
    onRecordStop,
    masterVolume,
    onMasterVolumeChange,
  } = props;

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const canRecord = isPlaying && !isExportingMp3;

  useEffect(() => {
    onMobileAdvancedOpenChange?.(false);
  }, [onMobileAdvancedOpenChange, isMobile]);

  const iconStyle = {
    width: isMobile ? 14 : 16,
    height: isMobile ? 14 : 16,
    display: "block",
  } as const;
  const headerButtonSize = isMobile ? 34 : 40;

  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        minHeight: isMobile ? 50 : 52,
        padding: isMobile
          ? "calc(env(safe-area-inset-top, 0px) + 6px) 8px 8px"
          : "8px 14px",
        background: "rgba(8,8,18,0.92)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
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
            gap: isMobile ? 6 : 8,
            overflowX: "auto",
            paddingBottom: 2,
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {isPlaying ? (
            <HeaderIconButton
              onClick={onStop}
              active
              buttonSize={headerButtonSize}
              title="Stop"
              aria-label="Stop"
            >
              <svg {...iconStyle} viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </HeaderIconButton>
          ) : (
            <HeaderIconButton
              onClick={onPlay}
              disabled={isLoading}
              active={!isLoading}
              buttonSize={headerButtonSize}
              style={{
                color: isLoading ? "#6fc8a6" : "#00ff88",
                border: "1px solid rgba(0,255,136,0.24)",
                background: isLoading
                  ? "rgba(0,255,136,0.08)"
                  : "rgba(0,255,136,0.08)",
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? "default" : "pointer",
              }}
              title={isLoading ? "Loading" : "Play"}
              aria-label={isLoading ? "Loading" : "Play"}
            >
              <svg {...iconStyle} viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l11-6.5-11-6.5z" />
              </svg>
            </HeaderIconButton>
          )}

          {isRecording ? (
            <HeaderIconButton
              onClick={onRecordStop}
              active
              buttonSize={headerButtonSize}
              style={{
                border: "1px solid rgba(255,94,120,0.24)",
                background: "rgba(255,94,120,0.08)",
                color: "#ff8ea6",
              }}
              title="Stop recording"
              aria-label="Stop recording"
            >
              <svg {...iconStyle} viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </HeaderIconButton>
          ) : (
            <HeaderIconButton
              onClick={onRecordStart}
              disabled={!canRecord}
              active={canRecord}
              buttonSize={headerButtonSize}
              style={{
                border: canRecord
                  ? "1px solid rgba(255,94,120,0.24)"
                  : "1px solid rgba(255,94,120,0.18)",
                background: canRecord
                  ? "rgba(255,94,120,0.08)"
                  : "rgba(255,94,120,0.05)",
                color: canRecord ? "#ff8ea6" : "#b98a93",
                opacity: canRecord ? 1 : 0.65,
                cursor: canRecord ? "pointer" : "default",
              }}
              title={canRecord ? "Record" : "Start playback to record"}
              aria-label={canRecord ? "Record" : "Start playback to record"}
            >
              <svg {...iconStyle} viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="5" />
              </svg>
            </HeaderIconButton>
          )}

          <VolumePotmeter
            value={masterVolume}
            isMobile={isMobile}
            onChange={onMasterVolumeChange}
          />

          <HeaderIconButton
            onClick={onPresetsOpen}
            buttonSize={headerButtonSize}
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
          </HeaderIconButton>

          <HeaderIconButton
            onClick={onSampleWorkspaceToggle}
            active={sampleWorkspaceOpen}
            buttonSize={headerButtonSize}
            title={
              sampleWorkspaceOpen
                ? "Hide sample workspace"
                : "Show sample workspace"
            }
            aria-label="Sample workspace"
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
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M10 4v16" />
            </svg>
          </HeaderIconButton>

          <HeaderIconButton
            onClick={onSettingsOpen}
            buttonSize={headerButtonSize}
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
          </HeaderIconButton>

          <HeaderIconButton
            onClick={onHowItWorksOpen}
            buttonSize={headerButtonSize}
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
          </HeaderIconButton>
        </div>
      </div>
    </header>
  );
};
