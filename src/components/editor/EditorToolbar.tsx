type EditorToolbarProps = {
  fontFamily: string;
  onFormat: () => void;
  onWrapRev: () => void;
  onWrapGain: () => void;
  onDuplicateStack: () => void;
  onQuickActions: () => void;
  onInsertBeat: () => void;
  onInsertAmbient: () => void;
};

const iconButtonStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.22)",
  fontSize: 10,
  letterSpacing: 0.5,
  borderRadius: 5,
  padding: "3px 7px 6px",
  cursor: "pointer",
  zIndex: 3,
};

export function EditorToolbar({
  fontFamily,
  onFormat,
  onWrapRev,
  onWrapGain,
  onDuplicateStack,
  onQuickActions,
  onInsertBeat,
  onInsertAmbient,
}: EditorToolbarProps) {
  const buttonStyle = {
    ...iconButtonStyle,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
    color: "#c8ffd8",
    fontFamily,
  } as const;

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        top: 8,
        zIndex: 3,
        display: "flex",
        gap: 6,
        alignItems: "center",
      }}
    >
      <button onClick={onFormat} style={buttonStyle}>
        Format
      </button>
      <button onClick={onWrapRev} style={buttonStyle}>
        rev
      </button>
      <button onClick={onWrapGain} style={buttonStyle}>
        gain
      </button>
      <button onClick={onDuplicateStack} style={buttonStyle}>
        stack
      </button>
      <button onClick={onQuickActions} style={buttonStyle}>
        Actions
      </button>
      <button onClick={onInsertBeat} style={buttonStyle}>
        + Beat
      </button>
      <button onClick={onInsertAmbient} style={buttonStyle}>
        + Ambient
      </button>
    </div>
  );
}
