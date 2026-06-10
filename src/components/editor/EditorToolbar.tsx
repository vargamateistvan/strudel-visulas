type EditorToolbarProps = {
  fontFamily: string;
  onUndo: () => void;
  onRedo: () => void;
  isMobile?: boolean;
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
  isMobile = false,
}: EditorToolbarProps) {
  const buttonStyle = {
    ...iconButtonStyle,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
    color: "#c8ffd8",
    fontFamily,
    fontSize: isMobile ? 11 : 10,
    padding: isMobile ? "4px 9px 6px" : "3px 7px 6px",
  } as const;

  return (
    <div
      style={{
        position: "absolute",
        left: isMobile ? 10 : 12,
        top: isMobile ? 6 : 8,
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
