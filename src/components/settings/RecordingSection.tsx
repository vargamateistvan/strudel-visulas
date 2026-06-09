import type { Mp3Quality, RecordingMode } from "../Header";

type RecordingSectionProps = {
  recordingMode: RecordingMode;
  onRecordingMode: (mode: RecordingMode) => void;
  mp3Quality: Mp3Quality;
  onMp3Quality: (quality: Mp3Quality) => void;
};

export function RecordingSection({
  recordingMode,
  onRecordingMode,
  mp3Quality,
  onMp3Quality,
}: RecordingSectionProps) {
  return (
    <>
      <section>
        <p
          style={{
            fontSize: 10,
            color: "#333",
            marginBottom: 10,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontFamily: '"JetBrains Mono",monospace',
          }}
        >
          Recording Mode
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          {(["audio", "video", "midi"] as RecordingMode[]).map((mode) => {
            const active = recordingMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onRecordingMode(mode)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: active
                    ? "1px solid rgba(0,255,136,0.24)"
                    : "1px solid rgba(255,255,255,0.05)",
                  background: active
                    ? "rgba(0,255,136,0.08)"
                    : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  color: active ? "#00ff88" : "#8da1af",
                  fontFamily: '"JetBrains Mono",monospace',
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p
          style={{
            fontSize: 10,
            color: "#333",
            marginBottom: 10,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontFamily: '"JetBrains Mono",monospace',
          }}
        >
          MP3 Quality
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          {(["fast", "good", "best"] as Mp3Quality[]).map((quality) => {
            const active = mp3Quality === quality;
            return (
              <button
                key={quality}
                onClick={() => onMp3Quality(quality)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: active
                    ? "1px solid rgba(0,255,136,0.24)"
                    : "1px solid rgba(255,255,255,0.05)",
                  background: active
                    ? "rgba(0,255,136,0.08)"
                    : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  color: active ? "#00ff88" : "#8da1af",
                  fontFamily: '"JetBrains Mono",monospace',
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {quality}
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
