import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { AiGenerationIntent } from "../../hooks/useAiMusicComposer";
import { MUSIC_CHAT_PROMPT_PRESETS } from "../../ai/musicCreationSkill";

type AiComposerPanelProps = {
  enabled: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
  onGenerate: (intent: AiGenerationIntent) => void;
};

const composerShellStyle: CSSProperties = {
  width: "100%",
  marginTop: 10,
  padding: 6,
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(24,24,30,0.96)",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const promptInputStyle: CSSProperties = {
  flex: 1,
  minHeight: 34,
  maxHeight: 150,
  border: "none",
  background: "transparent",
  color: "#f3f5f7",
  outline: "none",
  resize: "none",
  overflowY: "hidden",
  lineHeight: 1.35,
  fontSize: 17,
  padding: "8px 10px",
  fontFamily: '"Inter", "Segoe UI", sans-serif',
};

const PROMPT_MIN_HEIGHT = 34;
const PROMPT_MAX_HEIGHT = 150;

export function AiComposerPanel({
  enabled,
  prompt,
  onPromptChange,
  isGenerating,
  canGenerate,
  error,
  lastUpdatedAt,
  onGenerate,
}: AiComposerPanelProps) {
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const element = promptRef.current;
    if (!element) return;

    // Reset first so shrink also works when text becomes shorter.
    element.style.height = `${PROMPT_MIN_HEIGHT}px`;
    const nextHeight = Math.min(
      PROMPT_MAX_HEIGHT,
      Math.max(PROMPT_MIN_HEIGHT, element.scrollHeight),
    );
    element.style.height = `${nextHeight}px`;
    element.style.overflowY =
      element.scrollHeight > PROMPT_MAX_HEIGHT ? "auto" : "hidden";
  }, [prompt]);

  const freshnessLabel = useMemo(() => {
    if (!lastUpdatedAt) return "No AI updates yet";
    return `Updated ${new Date(lastUpdatedAt).toLocaleTimeString()}`;
  }, [lastUpdatedAt]);

  if (!enabled) {
    return (
      <div
        style={{
          width: "100%",
          marginTop: 10,
          fontSize: 11,
          color: "rgba(255,255,255,0.46)",
          paddingLeft: 8,
        }}
      >
        AI Composer is disabled in Settings.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", marginTop: 10 }}>
      <div
        style={{
          marginBottom: 6,
          fontSize: 11,
          color: "rgba(255,255,255,0.46)",
          paddingLeft: 8,
        }}
      >
        AI settings are in Settings.
      </div>

      <div
        style={{
          ...composerShellStyle,
          opacity: 1,
          pointerEvents: "auto",
        }}
      >
        <textarea
          ref={promptRef}
          value={prompt}
          onChange={(event) => {
            onPromptChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canGenerate && !isGenerating) {
                onGenerate("new");
              }
            }
          }}
          placeholder="Use /new or /rework then describe your track"
          rows={1}
          style={promptInputStyle}
        />

        <button
          type="button"
          aria-label="generate code"
          disabled={!canGenerate || isGenerating}
          onClick={() => onGenerate("new")}
          style={{
            width: 42,
            height: 42,
            flexShrink: 0,
            borderRadius: 21,
            border: "none",
            background: canGenerate && !isGenerating ? "#3f4044" : "#2a2b2f",
            color: canGenerate && !isGenerating ? "#0f1115" : "#8b8d95",
            fontSize: 25,
            lineHeight: "42px",
            fontWeight: 700,
            cursor: canGenerate && !isGenerating ? "pointer" : "default",
            padding: 0,
          }}
        >
          {isGenerating ? "…" : "↑"}
        </button>
      </div>

      <div
        style={{
          marginTop: 8,
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          paddingLeft: 8,
          opacity: 1,
          pointerEvents: "auto",
        }}
      >
        {MUSIC_CHAT_PROMPT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPromptChange(preset.prompt)}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.8)",
              fontSize: 11,
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          color: error ? "#ff8ea7" : "rgba(255,255,255,0.46)",
          paddingLeft: 8,
        }}
      >
        {error ?? freshnessLabel}
      </div>
    </div>
  );
}
