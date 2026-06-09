export type SettingToggleProps = {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
};

export function SettingToggle({
  label,
  description,
  enabled,
  onToggle,
}: SettingToggleProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 6,
        border: enabled
          ? "1px solid rgba(0,255,136,0.3)"
          : "1px solid rgba(255,255,255,0.05)",
        background: enabled
          ? "rgba(0,255,136,0.08)"
          : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontSize: 12,
            fontFamily: '"JetBrains Mono",monospace',
            color: enabled ? "#00ff88" : "#555",
            fontWeight: enabled ? 700 : 400,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 10, color: "#333" }}>{description}</span>
      </div>
      <div
        style={{
          width: 38,
          height: 22,
          borderRadius: 999,
          background: enabled
            ? "rgba(0,255,136,0.22)"
            : "rgba(255,255,255,0.08)",
          border: enabled
            ? "1px solid rgba(0,255,136,0.3)"
            : "1px solid rgba(255,255,255,0.08)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: enabled ? 17 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: enabled ? "#00ff88" : "#888",
            boxShadow: enabled ? "0 0 8px #00ff88" : "none",
            transition: "left 0.2s ease, background 0.2s ease",
          }}
        />
      </div>
    </button>
  );
}
