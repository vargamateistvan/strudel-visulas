type SplashOverlayProps = {
  onClick: () => void;
};

export function SplashOverlay({ onClick }: SplashOverlayProps) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(5,5,12,0.88)",
        backdropFilter: "blur(10px)",
        cursor: "pointer",
        gap: 24,
      }}
    >
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1px solid rgba(0,255,136,0.15)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#00ff88",
            animation: "spin 1.2s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
          }}
        >
          ▶
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: 22,
            fontWeight: 700,
            color: "#00ff88",
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 8,
            textShadow: "0 0 20px rgba(0,255,136,0.6)",
          }}
        >
          STRUDEL STUDIO
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#555",
            fontFamily: '"JetBrains Mono",monospace',
          }}
        >
          click anywhere to start
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
