import { useCallback, useRef } from "react";
import { StrudelEditor } from "../StrudelEditor";
import type { StrudelStatus } from "../../hooks/useStrudel";
import { AiComposerPanel } from "./AiComposerPanel";
import { SampleBrowserPanel } from "./SampleBrowserPanel";
import type {
  AiComposerHistoryEntry,
  AiGenerationIntent,
} from "../../hooks/useAiMusicComposer";
import type { SourceLocationRange } from "../editor/StrudelEditorLanguage";
import { useSampleWorkspace } from "../../hooks/useSampleWorkspace";

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
  isMobile: boolean;
  showSampleWorkspace: boolean;
  onInsertCode: (snippet: string) => void;
  onAuditionCode: (snippet: string) => Promise<void>;
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
  activeMiniLocations,
  onCodeChange,
  isMobile,
  showSampleWorkspace,
  onInsertCode,
  onAuditionCode,
  aiComposerProps,
}: EditorViewportProps) {
  const {
    category,
    setCategory,
    query,
    setQuery,
    filteredCatalog,
    recentItems,
    customSources,
    addRecentToken,
    addSource,
    removeSource,
    toggleSource,
  } = useSampleWorkspace();

  const applyFxTailRef = useRef<(fxTail: string) => void>(() => undefined);

  const registerSelectionFxApplier = useCallback(
    (applyFn: (fxTail: string) => void) => {
      applyFxTailRef.current = applyFn;
    },
    [],
  );

  const handleApplyFxToSelection = useCallback((fxTail: string) => {
    applyFxTailRef.current(fxTail);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: showSampleWorkspace ? 1140 : 860,
        height: "100%",
        maxHeight: "100%",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 12,
      }}
    >
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
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
            activeMiniLocations={activeMiniLocations}
            onCodeChange={onCodeChange}
            onRegisterSelectionFxApplier={registerSelectionFxApplier}
          />
        </div>

        <AiComposerPanel {...aiComposerProps} />
      </div>

      {showSampleWorkspace && (
        <div
          style={{
            width: isMobile ? "100%" : 330,
            minWidth: isMobile ? 0 : 280,
            maxWidth: isMobile ? "100%" : "34vw",
            height: isMobile ? 360 : "auto",
            minHeight: 0,
            display: "flex",
          }}
        >
          <SampleBrowserPanel
            category={category}
            onCategoryChange={setCategory}
            query={query}
            onQueryChange={setQuery}
            filteredCatalog={filteredCatalog}
            recentItems={recentItems}
            customSources={customSources}
            onAddRecentToken={addRecentToken}
            onInsertCode={onInsertCode}
            onAuditionCode={onAuditionCode}
            onApplyFxToSelection={handleApplyFxToSelection}
            onAddSource={addSource}
            onRemoveSource={removeSource}
            onToggleSource={toggleSource}
          />
        </div>
      )}
    </div>
  );
}
