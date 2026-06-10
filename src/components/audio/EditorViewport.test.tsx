import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditorViewport } from "./EditorViewport";

vi.mock("../StrudelEditor", () => ({
  StrudelEditor: () => <div data-testid="strudel-editor" />,
}));
vi.mock("./AiComposerPanel", () => ({
  AiComposerPanel: () => <div data-testid="ai-composer-panel" />,
}));
vi.mock("./SampleBrowserPanel", () => ({
  SampleBrowserPanel: () => <div data-testid="sample-browser-panel" />,
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

describe("EditorViewport", () => {
  it("renders editor and ai panel", () => {
    render(
      <EditorViewport
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
        isMobile={false}
        showSampleWorkspace
        onInsertCode={noop}
        onAuditionCode={async () => undefined}
        aiComposerProps={aiComposerProps}
      />,
    );

    expect(screen.getByTestId("strudel-editor")).toBeInTheDocument();
    expect(screen.getByTestId("ai-composer-panel")).toBeInTheDocument();
    expect(screen.getByTestId("sample-browser-panel")).toBeInTheDocument();
  });
});
