type EditorToolbarProps = {
  fontFamily: string;
  onUndo: () => void;
  onRedo: () => void;
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
  onUndo,
  onRedo,
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
      <button
        onClick={onUndo}
        style={buttonStyle}
        title="Undo"
        aria-label="Undo"
      >
        ↶
      </button>
      <button
        onClick={onRedo}
        style={buttonStyle}
        title="Redo"
        aria-label="Redo"
      >
        ↷
      </button>
    </div>
  );
}
