import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OverlayDialogs } from "./OverlayDialogs";

vi.mock("../PresetsDialog", () => ({
  PresetsDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="presets-dialog" /> : null,
}));
vi.mock("../HowItWorksDialog", () => ({
  HowItWorksDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="help-dialog" /> : null,
}));
vi.mock("./SplashOverlay", () => ({
  SplashOverlay: () => <div data-testid="splash-overlay" />,
}));

const noop = vi.fn();

describe("OverlayDialogs", () => {
  it("renders open overlays and splash", () => {
    render(
      <OverlayDialogs
        presetsOpen
        helpOpen
        splashDone={false}
        currentCode={'note("c4")'}
        presets={[]}
        onClosePresets={noop}
        onCloseHelp={noop}
        onSaveAsNew={noop}
        onOverwrite={noop}
        onRename={noop}
        onDelete={noop}
        onLoadPreset={noop}
        onSplashClick={noop}
      />,
    );

    expect(screen.getByTestId("presets-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("help-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("splash-overlay")).toBeInTheDocument();
  });
});
