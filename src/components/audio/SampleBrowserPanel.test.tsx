import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SampleBrowserPanel } from "./SampleBrowserPanel";

const noop = vi.fn();

const createProps = () => ({
  category: "all" as const,
  onCategoryChange: noop,
  query: "",
  onQueryChange: noop,
  filteredCatalog: [],
  recentItems: [],
  customSources: [],
  onAddRecentToken: noop,
  onInsertCode: noop,
  onAuditionCode: vi.fn().mockResolvedValue(undefined),
  onApplyFxToSelection: vi.fn(() => "none" as const),
  onApplyMacroToSelection: vi.fn(() => "none" as const),
  onApplyPatternTool: vi.fn(() => "none" as const),
  onAddSource: noop,
  onRemoveSource: noop,
  onToggleSource: noop,
});

describe("SampleBrowserPanel shortcut profile polish", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("saves and restores a custom shortcut profile", () => {
    render(<SampleBrowserPanel {...createProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Keys On" }));
    expect(
      screen.getByRole("button", { name: "Keys Off" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Current" }));
    expect(screen.getByText("Saved profile: My Workflow")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset Shortcuts" }));
    expect(screen.getByRole("button", { name: "Keys On" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "My Workflow" }));
    expect(
      screen.getByRole("button", { name: "Keys Off" }),
    ).toBeInTheDocument();
  });

  it("tracks unsaved changes against the saved custom profile", () => {
    render(<SampleBrowserPanel {...createProps()} />);

    const saveButton = screen.getByRole("button", { name: "Save Current" });
    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Restore" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Keys On" }));

    expect(
      screen.getByText("Saved profile: My Workflow (unsaved changes)"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Current" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Restore" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(screen.getByRole("button", { name: "Save Current" })).toBeDisabled();
  });
});
