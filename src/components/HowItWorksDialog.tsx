import React from "react";

interface HowItWorksDialogProps {
  open: boolean;
  onClose: () => void;
}

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  gap: 10,
  alignItems: "start",
  padding: "10px 10px 10px 8px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-faint)",
  background: "var(--surface-1)",
};

const badgeStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--surface-active)",
  border: "1px solid var(--border-accent)",
  color: "var(--primary)",
  fontFamily: '"JetBrains Mono",monospace',
  fontSize: 11,
  fontWeight: 700,
};

const commandChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  border: "1px solid var(--border-subtle)",
  background: "var(--surface-2)",
  color: "var(--text-body)",
  fontFamily: '"JetBrains Mono",monospace',
  fontSize: 11,
  padding: "4px 10px",
};

export const HowItWorksDialog: React.FC<HowItWorksDialogProps> = ({
  open,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        background: "var(--bg-overlay)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(760px, 95vw)",
          maxHeight: "86vh",
          overflowY: "auto",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-accent)",
          background: "var(--bg-elevated)",
          boxShadow: "var(--shadow-panel), var(--shadow-accent)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--primary)",
              fontSize: 12,
            }}
          >
            HOW IT WORKS
          </div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 12,
            }}
          >
            Strudel Studio quick guide
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-soft)",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: 11,
            }}
          >
            CLOSE
          </button>
        </div>

        <div
          style={{
            padding: 16,
            display: "grid",
            gap: 14,
            color: "var(--text-body)",
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          <div
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              background: "var(--surface-2)",
            }}
          >
            <div
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: 11,
                letterSpacing: 1.2,
                color: "var(--secondary)",
                marginBottom: 5,
              }}
            >
              QUICK FLOW
            </div>
            <div style={{ fontSize: 13, color: "var(--text-body)" }}>
              Code, play, shape visuals, use AI for new ideas, then save or
              export your best patterns.
            </div>
          </div>

          <div style={rowStyle}>
            <span style={badgeStyle}>1</span>
            <div>
              Write or paste a pattern in the editor. Strudel uses compact
              musical code to describe drums, notes, effects, and timing.
            </div>
          </div>

          <div style={rowStyle}>
            <span style={badgeStyle}>2</span>
            <div>
              Press PLAY to run the pattern and drive visuals in real time. Use
              PRESETS for quick starts and SAMPLE WORKSPACE for code snippets,
              FX, and source tokens.
            </div>
          </div>

          <div style={rowStyle}>
            <span style={badgeStyle}>3</span>
            <div>
              Open SETTINGS to tune visual modes, editor style, audio response,
              and recording/export quality.
            </div>
          </div>

          <div style={rowStyle}>
            <span style={badgeStyle}>4</span>
            <div>
              Enable AI Composer in SETTINGS, choose provider (ChatGPT or
              Gemini), then generate Strudel code directly from prompt text.
            </div>
          </div>

          <div style={rowStyle}>
            <span style={badgeStyle}>5</span>
            <div>
              Use prompt commands for intent control:
              <div
                style={{
                  marginTop: 8,
                  marginBottom: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <span style={commandChipStyle}>/new</span>
                <span style={commandChipStyle}>/rework</span>
                <span style={commandChipStyle}>/variation</span>
              </div>
              You can replace or append generated code and reuse prompts from AI
              history.
            </div>
          </div>

          <div
            style={{
              marginTop: 4,
              border: "1px solid rgba(0,220,255,0.25)",
              borderRadius: "var(--radius-md)",
              background: "rgba(0,220,255,0.08)",
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: 11,
                letterSpacing: 1.2,
                color: "#7ae6ff",
                marginBottom: 6,
              }}
            >
              LEARN STRUDEL LANGUAGE
            </div>
            <div
              style={{
                color: "var(--text-body)",
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              Learn syntax, examples, and live coding techniques at the official
              Strudel website.
            </div>
            <a
              href="https://strudel.cc"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "linear-gradient(135deg,#00d7ff,#00ffb2)",
                color: "#03131a",
                fontFamily: '"JetBrains Mono",monospace',
                fontWeight: 700,
                letterSpacing: 0.8,
                fontSize: 12,
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              OPEN strudel.cc
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
