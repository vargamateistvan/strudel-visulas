import { EditorViewport } from "./EditorViewport";
import { Mp3ExportOverlay } from "./Mp3ExportOverlay";
import type { StrudelStatus } from "../../hooks/useStrudel";
import type {
  AiComposerHistoryEntry,
  AiGenerationIntent,
} from "../../hooks/useAiMusicComposer";
import type { SourceLocationRange } from "../editor/StrudelEditorLanguage";

type AiComposerProps = {
  enabled: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
  history: AiComposerHistoryEntry[];
  onClearHistory: () => void;
  onGenerate: (intent: AiGenerationIntent) => void;
};

type AudioWorkspaceProps = {
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
  showSampleWorkspace: boolean;
  onInsertCode: (snippet: string) => void;
  onAuditionCode: (snippet: string) => Promise<void>;
  isExportingMp3: boolean;
  mp3Quality: "fast" | "good" | "best";
  mp3Status: string;
  mp3Progress: number;
  mp3Speed: string;
  isMobile: boolean;
  mobileHeaderExpanded: boolean;
  aiComposerProps: AiComposerProps;
};

export function AudioWorkspace({
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
  showSampleWorkspace,
  onInsertCode,
  onAuditionCode,
  isExportingMp3,
  mp3Quality,
  mp3Status,
  mp3Progress,
  mp3Speed,
  isMobile,
  mobileHeaderExpanded,
  aiComposerProps,
}: AudioWorkspaceProps) {
  return (
    <>
      {isExportingMp3 && (
        <Mp3ExportOverlay
          quality={mp3Quality}
          status={mp3Status}
          progress={mp3Progress}
          speed={mp3Speed}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: isMobile
            ? `calc(env(safe-area-inset-top, 0px) + ${
                mobileHeaderExpanded ? 104 : 64
              }px)`
            : 48,
          left: 0,
          right: 0,
          bottom: 0,
          padding: isMobile
            ? "6px 6px calc(env(safe-area-inset-bottom, 0px) + 8px)"
            : 24,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
        }}
      >
        <EditorViewport
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
          isMobile={isMobile}
          showSampleWorkspace={showSampleWorkspace}
          onInsertCode={onInsertCode}
          onAuditionCode={onAuditionCode}
          aiComposerProps={aiComposerProps}
        />
      </div>
    </>
  );
}
