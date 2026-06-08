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
};

const badgeStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,255,136,0.13)",
  border: "1px solid rgba(0,255,136,0.28)",
  color: "#00ff88",
  fontFamily: '"JetBrains Mono",monospace',
  fontSize: 11,
  fontWeight: 700,
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
        background: "rgba(0,0,0,0.52)",
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
          borderRadius: 12,
          border: "1px solid rgba(0,255,136,0.24)",
          background: "rgba(6,8,14,0.96)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.5), 0 0 30px rgba(0,255,136,0.14)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
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
              color: "#00ff88",
              fontSize: 12,
            }}
          >
            HOW IT WORKS
          </div>
          <div style={{ color: "#8392a0", fontSize: 12 }}>
            Strudel Studio quick guide
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#9fb0bf",
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
            color: "#d6deea",
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          <div style={rowStyle}>
            <span style={badgeStyle}>1</span>
            <div>
              Write or paste a pattern in the editor. Strudel uses compact
              musical code to describe notes, drums, effects, and timing.
            </div>
          </div>

          <div style={rowStyle}>
            <span style={badgeStyle}>2</span>
            <div>
              Press PLAY to run the pattern and drive the visuals in real time.
              Use PRESETS for fast starting points and SETTINGS to tune visuals.
            </div>
          </div>

          <div style={rowStyle}>
            <span style={badgeStyle}>3</span>
            <div>
              Save your favorite patterns, export them as TXT or HTML, and tweak
              kick sensitivity to make the visuals react harder to drums.
            </div>
          </div>

          <div
            style={{
              marginTop: 4,
              border: "1px solid rgba(0,220,255,0.25)",
              borderRadius: 10,
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
            <div style={{ color: "#bed5e7", fontSize: 13, marginBottom: 10 }}>
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
