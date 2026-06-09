import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { AudioVisualizerShell } from "./AudioVisualizerShell";

vi.mock("../Layout", () => ({
  Layout: ({ children }: { children: ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));
vi.mock("../Header", () => ({ Header: () => <div data-testid="header" /> }));
vi.mock("../SettingsDrawer", () => ({
  SettingsDrawer: () => <div data-testid="settings-drawer" />,
}));
vi.mock("./AudioWorkspace", () => ({
  AudioWorkspace: () => <div data-testid="audio-workspace" />,
}));
vi.mock("./OverlayDialogs", () => ({
  OverlayDialogs: () => <div data-testid="overlay-dialogs" />,
}));

describe("AudioVisualizerShell", () => {
  it("renders composition slots", () => {
    render(
      <AudioVisualizerShell
        background={<div>bg</div>}
        headerProps={{} as never}
        audioWorkspaceProps={{} as never}
        settingsDrawerProps={{} as never}
        overlayDialogsProps={{} as never}
      />,
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("audio-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("settings-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("overlay-dialogs")).toBeInTheDocument();
  });
});
