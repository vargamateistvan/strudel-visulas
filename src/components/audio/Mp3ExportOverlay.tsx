type Mp3ExportOverlayProps = {
  quality: "fast" | "good" | "best";
  status: string;
  progress: number;
  speed: string;
};

export function Mp3ExportOverlay({
  quality,
  status,
  progress,
  speed,
}: Mp3ExportOverlayProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(2,4,8,0.72)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "min(420px, 86vw)",
          background: "rgba(7,12,20,0.92)",
          border: "1px solid rgba(0,255,136,0.28)",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 0 30px rgba(0,255,136,0.18)",
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: 12,
            letterSpacing: 1,
            color: "#00ff88",
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Exporting MP3
        </div>
        <div
          style={{
            color: "#6cd4b8",
            fontSize: 11,
            marginBottom: 6,
            fontFamily: '"JetBrains Mono",monospace',
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          quality: {quality}
        </div>
        <div
          style={{
            color: "#9bb3a3",
            fontSize: 12,
            marginBottom: 10,
            fontFamily: '"JetBrains Mono",monospace',
          }}
        >
          {status || "Converting..."}
        </div>
        <div
          style={{
            width: "100%",
            height: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(4, Math.round(progress * 100))}%`,
              height: "100%",
              background: "linear-gradient(90deg,#00ff88,#00d7ff)",
              boxShadow: "0 0 12px rgba(0,255,136,0.35)",
              transition: "width 0.18s ease",
            }}
          />
        </div>
        <div
          style={{
            marginTop: 8,
            textAlign: "right",
            color: "#8db9a9",
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: 11,
          }}
        >
          {Math.round(progress * 100)}%{speed ? ` • ${speed}` : ""}
        </div>
      </div>
    </div>
  );
}
