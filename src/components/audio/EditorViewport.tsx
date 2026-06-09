import { StrudelEditor } from "../StrudelEditor";
import type { StrudelStatus } from "../../hooks/useStrudel";
import { AiComposerPanel } from "./AiComposerPanel";
import type { AiGenerationIntent } from "../../hooks/useAiMusicComposer";

type AiComposerProps = {
  enabled: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
  onGenerate: (intent: AiGenerationIntent) => void;
};

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
  activeLiterals?: string[];
  activeControls?: string[];
  nPulse?: number;
  onCodeChange?: (code: string) => void;
  aiComposerProps: AiComposerProps;
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
  activeLiterals,
  activeControls,
  nPulse,
  onCodeChange,
  aiComposerProps,
}: EditorViewportProps) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 760,
        height: "82vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: "1 1 auto", minHeight: 0 }}>
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
          activeLiterals={activeLiterals}
          activeControls={activeControls}
          nPulse={nPulse}
          onCodeChange={onCodeChange}
        />
      </div>

      <AiComposerPanel {...aiComposerProps} />
    </div>
  );
}
