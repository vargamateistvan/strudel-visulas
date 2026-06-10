type EditorStatusPill = {
  label: string;
  value: string;
  accent: string;
};

type EditorStatusPillsProps = {
  pills: EditorStatusPill[];
  fontFamily: string;
  isMobile?: boolean;
};

export function EditorStatusPills({
  pills,
  fontFamily,
  isMobile = false,
}: EditorStatusPillsProps) {
  if (pills.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: isMobile ? 10 : 14,
        bottom: isMobile ? 10 : 12,
        zIndex: 4,
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        maxWidth: isMobile ? "calc(100% - 20px)" : "calc(100% - 28px)",
        pointerEvents: "none",
      }}
    >
      {pills.map((pill) => (
        <div
          key={`${pill.label}:${pill.value}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: isMobile ? 5 : 6,
            padding: isMobile ? "4px 7px" : "5px 8px",
            borderRadius: 999,
            border: `1px solid ${pill.accent}55`,
            background: "rgba(0,0,0,0.3)",
            boxShadow: `0 0 14px ${pill.accent}22`,
            color: "#dfe9ef",
            fontFamily,
            fontSize: isMobile ? 9 : 10,
            letterSpacing: 0.4,
          }}
        >
          <span style={{ color: pill.accent, textTransform: "uppercase" }}>
            {pill.label}
          </span>
          <span>{pill.value}</span>
        </div>
      ))}
    </div>
  );
}
