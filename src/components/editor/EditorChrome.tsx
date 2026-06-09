type EditorChromeProps = {
  fontFamily: string;
  liveEditError: string | null;
};

export function EditorChrome({ fontFamily, liveEditError }: EditorChromeProps) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          right: 14,
          top: 10,
          zIndex: 3,
          fontFamily,
          fontSize: 10,
          color: "rgba(196,208,220,0.75)",
          letterSpacing: 0.4,
          pointerEvents: "none",
        }}
      >
        Cmd/Ctrl+Enter Play • Ctrl/Cmd+Space IntelliSense • Tab Indent
      </div>

      {liveEditError && (
        <div
          style={{
            position: "absolute",
            right: 14,
            bottom: 12,
            zIndex: 4,
            maxWidth: 460,
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
