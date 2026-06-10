type EditorChromeProps = {
  fontFamily: string;
  liveEditError: string | null;
  isMobile?: boolean;
};

export function EditorChrome({
  fontFamily,
  liveEditError,
  isMobile = false,
}: EditorChromeProps) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          right: isMobile ? 10 : 14,
          top: isMobile ? 7 : 10,
          zIndex: 3,
          fontFamily,
          fontSize: isMobile ? 9 : 10,
          color: "rgba(196,208,220,0.75)",
          letterSpacing: 0.4,
          pointerEvents: "none",
          maxWidth: isMobile ? "58%" : "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {isMobile
          ? "Cmd/Ctrl+Enter Play"
          : "Cmd/Ctrl+Enter Play • Ctrl/Cmd+Space IntelliSense • Tab Indent"}
      </div>

      {liveEditError && (
        <div
          style={{
            position: "absolute",
            right: isMobile ? 10 : 14,
            bottom: isMobile ? 10 : 12,
            zIndex: 4,
            maxWidth: isMobile ? 220 : 460,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid rgba(255,182,118,0.4)",
            background: "rgba(68,42,19,0.82)",
            color: "#ffd9a8",
            fontFamily,
            fontSize: 10,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={liveEditError}
        >
          Live edit error: {liveEditError}
        </div>
      )}
    </>
  );
}
