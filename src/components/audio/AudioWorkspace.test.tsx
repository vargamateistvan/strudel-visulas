import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AudioWorkspace } from "./AudioWorkspace";

vi.mock("./EditorViewport", () => ({
  EditorViewport: () => <div data-testid="editor-viewport" />,
}));
vi.mock("./Mp3ExportOverlay", () => ({
  Mp3ExportOverlay: () => <div data-testid="mp3-overlay" />,
}));

const noop = vi.fn();
const aiComposerProps = {
  enabled: true,
  prompt: "",
  onPromptChange: noop,
  isGenerating: false,
  canGenerate: true,
  error: null,
  lastUpdatedAt: null,
  history: [],
  onClearHistory: noop,
  onGenerate: noop,
};

describe("AudioWorkspace", () => {
  it("renders editor viewport and mp3 overlay", () => {
    render(
      <AudioWorkspace
        code={'note("c4")'}
        play={async () => undefined}
        stop={noop}
        status="idle"
        error={null}
        loadMsg=""
        opacity={1}
        colorPreset="neon"
        fontPreset="jetbrainsMono"
        fontSize={14}
        livePulseStrip
        livePlayingNoteHighlights
        activeNote={null}
        activeNotes={[]}
        activeMiniLocations={[]}
        onCodeChange={noop}
        onInsertCode={noop}
        onAuditionCode={async () => undefined}
        isExportingMp3
        mp3Quality="good"
        mp3Status="Converting"
        mp3Progress={0.5}
        mp3Speed="1.1x"
        isMobile={false}
        mobileHeaderExpanded={false}
        aiComposerProps={aiComposerProps}
      />,
    );

    expect(screen.getByTestId("mp3-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("editor-viewport")).toBeInTheDocument();
  });
});
