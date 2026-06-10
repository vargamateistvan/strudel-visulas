import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type {
  AiComposerHistoryEntry,
  AiGenerationIntent,
} from "../../hooks/useAiMusicComposer";
import { MUSIC_CHAT_PROMPT_PRESETS } from "../../ai/musicCreationSkill";

type AiComposerPanelProps = {
  enabled: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
  history: AiComposerHistoryEntry[];
  onClearHistory: () => void;
  onGenerate: (intent: AiGenerationIntent) => void;
  isMobile?: boolean;
};

const historyOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 140,
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(5px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
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
  history,
  onClearHistory,
  onGenerate,
  isMobile = false,
}: AiComposerPanelProps) {
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

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
          fontSize: isMobile ? 10 : 11,
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
          fontSize: isMobile ? 10 : 11,
          color: "rgba(255,255,255,0.46)",
          paddingLeft: 8,
        }}
      >
        AI settings are in Settings.
      </div>

      <div
        style={{
          ...composerShellStyle,
          borderRadius: isMobile ? 18 : 28,
          padding: isMobile ? 5 : 6,
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
          style={{
            ...promptInputStyle,
            fontSize: isMobile ? 15 : 17,
            minHeight: isMobile ? 32 : 34,
            padding: isMobile ? "7px 9px" : "8px 10px",
          }}
          aria-label="AI prompt"
        />

        <button
          type="button"
          aria-label="generate code"
          disabled={!canGenerate || isGenerating}
          onClick={() => onGenerate("new")}
          style={{
            width: isMobile ? 38 : 42,
            height: isMobile ? 38 : 42,
            flexShrink: 0,
            borderRadius: isMobile ? 19 : 21,
            border: "none",
            background: canGenerate && !isGenerating ? "#3f4044" : "#2a2b2f",
            color: canGenerate && !isGenerating ? "#0f1115" : "#8b8d95",
            fontSize: isMobile ? 22 : 25,
            lineHeight: isMobile ? "38px" : "42px",
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
              fontSize: isMobile ? 10 : 11,
              padding: isMobile ? "4px 8px" : "4px 10px",
              cursor: "pointer",
            }}
          >
            {preset.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          style={{
            border: "1px solid rgba(122,230,255,0.3)",
            borderRadius: 999,
            background: "rgba(122,230,255,0.1)",
            color: "#b7f3ff",
            fontSize: isMobile ? 10 : 11,
            padding: isMobile ? "4px 8px" : "4px 10px",
            cursor: "pointer",
          }}
        >
          History ({history.length})
        </button>
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

      {historyOpen && (
        <div style={historyOverlayStyle} onClick={() => setHistoryOpen(false)}>
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: isMobile ? "96vw" : "min(900px, 96vw)",
              maxHeight: "84vh",
              overflow: "hidden",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(10,12,18,0.98)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                flexWrap: isMobile ? "wrap" : "nowrap",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 1.2,
                  color: "#7ae6ff",
                  fontWeight: 700,
                }}
              >
                AI CHAT HISTORY
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                {history.length} entries
              </div>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                }}
                style={{
                  marginLeft: isMobile ? 0 : "auto",
                  border: "1px solid rgba(255,122,135,0.4)",
                  borderRadius: 8,
                  background: "rgba(255,122,135,0.12)",
                  color: "#ffb7c0",
                  fontSize: 11,
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                style={{
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 8,
                  background: "transparent",
                  color: "rgba(255,255,255,0.82)",
                  fontSize: 11,
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div
              style={{
                overflowY: "auto",
                padding: 12,
                display: "grid",
                gap: 10,
              }}
            >
              {history.length === 0 && (
                <div
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    padding: 8,
                  }}
                >
                  No history yet. Generate code with AI and entries will appear
                  here.
                </div>
              )}

              {history.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: 10,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    <span
                      style={{
                        border: "1px solid rgba(122,230,255,0.35)",
                        borderRadius: 999,
                        padding: "2px 8px",
                        color: "#b7f3ff",
                      }}
                    >
                      {entry.provider}
                    </span>
                    <span
                      style={{
                        border: "1px solid rgba(0,255,136,0.3)",
                        borderRadius: 999,
                        padding: "2px 8px",
                        color: "#adffd4",
                      }}
                    >
                      {entry.intent}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onPromptChange(entry.prompt);
                        setHistoryOpen(false);
                      }}
                      style={{
                        marginLeft: "auto",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 8,
                        background: "transparent",
                        color: "rgba(255,255,255,0.82)",
                        fontSize: 11,
                        padding: "4px 8px",
                        cursor: "pointer",
                      }}
                    >
                      Reuse Prompt
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: "#dce5f0" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.55)",
                        marginBottom: 4,
                      }}
                    >
                      Prompt
                    </div>
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        marginBottom: 8,
                      }}
                    >
                      {entry.prompt}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.55)",
                        marginBottom: 4,
                      }}
                    >
                      {entry.error ? "Error" : "Output"}
                    </div>
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        color: entry.error ? "#ff9fb0" : "#c7f7db",
                        fontFamily: entry.error
                          ? '"Inter", "Segoe UI", sans-serif'
                          : '"JetBrains Mono", monospace',
                        fontSize: 11,
                      }}
                    >
                      {entry.error || entry.output || "(empty output)"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
