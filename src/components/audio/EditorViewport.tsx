import { StrudelEditor } from "../StrudelEditor";
import type { StrudelStatus } from "../../hooks/useStrudel";
import type { SourceLocationRange } from "../editor/StrudelEditorLanguage";

type EditorViewportProps = {
  code: string;
  play: (code: string) => Promise<void>;
  stop: () => void;
  status: StrudelStatus;
  error: string | null;
  loadMsg: string;
  opacity: number;
  colorPreset: "neon" | "amber" | "ice" | "mono";
  fontPreset: "jetbrainsMono" | "bitcountSingle" | "doto" | "firaCode";
  fontSize: number;
  livePulseStrip: boolean;
  livePlayingNoteHighlights: boolean;
  activeNote: string | null;
  activeNotes?: string[];
  activeMiniLocations?: SourceLocationRange[];
  onCodeChange?: (code: string) => void;
};

export function EditorViewport({
  code,
  play,
  stop,
  status,
  error,
  loadMsg,
  opacity,
  colorPreset,
  fontPreset,
  fontSize,
  livePulseStrip,
  livePlayingNoteHighlights,
  activeNote,
  activeNotes,
  activeMiniLocations,
  onCodeChange,
}: EditorViewportProps) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 760,
        height: "70vh",
      }}
    >
      <StrudelEditor
        code={code}
        play={play}
        stop={stop}
        status={status}
        error={error}
        loadMsg={loadMsg}
        opacity={opacity}
        colorPreset={colorPreset}
        fontPreset={fontPreset}
        fontSize={fontSize}
        livePulseStrip={livePulseStrip}
        livePlayingNoteHighlights={livePlayingNoteHighlights}
        activeNote={activeNote}
        activeNotes={activeNotes}
        activeMiniLocations={activeMiniLocations}
        onCodeChange={onCodeChange}
      />
    </div>
  );
}
