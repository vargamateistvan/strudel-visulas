import { EditorViewport } from "./EditorViewport";
import { Mp3ExportOverlay } from "./Mp3ExportOverlay";
import type { StrudelStatus } from "../../hooks/useStrudel";

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
  activeLiterals?: string[];
  activeControls?: string[];
  nPulse?: number;
  onCodeChange?: (code: string) => void;
  isExportingMp3: boolean;
  mp3Quality: "fast" | "good" | "best";
  mp3Status: string;
  mp3Progress: number;
  mp3Speed: string;
  isMobile: boolean;
  mobileHeaderExpanded: boolean;
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
  activeLiterals,
  activeControls,
  nPulse,
  onCodeChange,
  isExportingMp3,
  mp3Quality,
  mp3Status,
  mp3Progress,
  mp3Speed,
  isMobile,
  mobileHeaderExpanded,
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
          top: isMobile ? (mobileHeaderExpanded ? 142 : 96) : 48,
          left: 0,
          right: 0,
          bottom: 0,
          padding: isMobile ? 10 : 24,
          display: "flex",
          alignItems: "center",
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
          activeLiterals={activeLiterals}
          activeControls={activeControls}
          nPulse={nPulse}
          onCodeChange={onCodeChange}
        />
      </div>
    </>
  );
}
