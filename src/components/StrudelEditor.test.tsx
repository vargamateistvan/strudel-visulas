import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StrudelEditor } from "./StrudelEditor";

vi.mock("@monaco-editor/react", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange?: (v: string) => void;
  }) => (
    <textarea
      aria-label="Monaco Mock"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock("./editor/StrudelEditorLanguage", () => ({
  STRUDEL_LANGUAGE_ID: "strudel",
  STRUDEL_MARKER_OWNER: "strudel",
  createStrudelDecorations: () => [],
  createStrudelLocationDecorations: () => [],
  createStrudelMarkers: () => [],
  registerStrudelLanguage: () => [],
}));

const noop = vi.fn();

describe("StrudelEditor", () => {
  it("renders editor and propagates code changes", () => {
    const onCodeChange = vi.fn();

    render(
      <StrudelEditor
        code={'note("c4")'}
        play={async () => undefined}
        stop={noop}
        status="idle"
        error={null}
        loadMsg=""
        opacity={0.9}
        colorPreset="neon"
        fontPreset="jetbrainsMono"
        fontSize={14}
        livePulseStrip
        livePlayingNoteHighlights
        activeNote={null}
        activeNotes={[]}
        activeMiniLocations={[]}
        onCodeChange={onCodeChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Monaco Mock"), {
      target: { value: 'note("d4")' },
    });

    expect(onCodeChange).toHaveBeenCalled();
  });

  it("shows loading overlay while loading", () => {
    render(
      <StrudelEditor
        code={'note("c4")'}
        play={async () => undefined}
        stop={noop}
        status="loading"
        error={null}
        loadMsg="Loading modules"
        opacity={0.9}
        colorPreset="neon"
        fontPreset="jetbrainsMono"
        fontSize={14}
        livePulseStrip
        livePlayingNoteHighlights
        activeNote={null}
        activeNotes={[]}
        activeMiniLocations={[]}
      />,
    );

    expect(screen.getByText("Loading modules")).toBeInTheDocument();
  });
});
