import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SampleBrowserPanel } from "./SampleBrowserPanel";

const noop = vi.fn();

const createProps = () => ({
  opacity: 0.8,
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
    expect(
      screen.getByText("Selected profile: My Workflow"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset Shortcuts" }));
    expect(screen.getByRole("button", { name: "Keys On" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
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
      screen.getByText("Selected profile: My Workflow (unsaved changes)"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Current" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Restore" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(screen.getByRole("button", { name: "Save Current" })).toBeDisabled();
  });

  it("creates multiple custom profiles and switches by list selection", () => {
    render(<SampleBrowserPanel {...createProps()} />);

    const nameInput = screen.getByPlaceholderText("Profile name");
    const list = screen.getByRole("combobox", { name: "Custom profile list" });

    fireEvent.change(nameInput, { target: { value: "Session A" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Current" }));

    fireEvent.change(list, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Keys On" }));
    fireEvent.change(nameInput, { target: { value: "Session B" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Current" }));

    const options = within(list)
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toContain("Session A");
    expect(options).toContain("Session B");

    const sessionAOptionValue = (
      within(list).getByRole("option", {
        name: "Session A",
      }) as HTMLOptionElement
    ).value;
    fireEvent.change(list, { target: { value: sessionAOptionValue } });
    expect((nameInput as HTMLInputElement).value).toBe("Session A");
  });

  it("imports custom profiles in replace mode from JSON buffer", () => {
    render(<SampleBrowserPanel {...createProps()} />);

    const jsonBuffer = screen.getByRole("textbox", {
      name: "Profile JSON buffer",
    });

    const payload = {
      version: 1,
      selectedProfileId: "p-b",
      profiles: [
        {
          id: "p-a",
          name: "Imported A",
          keyboardModeEnabled: false,
          showShortcutHelp: true,
          patternPreviewMode: true,
          macroApplyMode: "layer",
        },
        {
          id: "p-b",
          name: "Imported B",
          keyboardModeEnabled: true,
          showShortcutHelp: false,
          patternPreviewMode: false,
          macroApplyMode: "replace",
        },
      ],
    };

    fireEvent.change(jsonBuffer, {
      target: { value: JSON.stringify(payload) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Import Replace" }));

    const list = screen.getByRole("combobox", { name: "Custom profile list" });
    const options = within(list)
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(options).toContain("Imported A");
    expect(options).toContain("Imported B");
    expect(
      screen.getByText("Imported 2 profiles (replace mode)."),
    ).toBeInTheDocument();
  });

  it("imports custom profiles from file in replace mode", async () => {
    render(<SampleBrowserPanel {...createProps()} />);

    const payload = {
      version: 1,
      selectedProfileId: "f-b",
      profiles: [
        {
          id: "f-a",
          name: "File A",
          keyboardModeEnabled: false,
          showShortcutHelp: true,
          patternPreviewMode: true,
          macroApplyMode: "layer",
        },
        {
          id: "f-b",
          name: "File B",
          keyboardModeEnabled: true,
          showShortcutHelp: false,
          patternPreviewMode: false,
          macroApplyMode: "replace",
        },
      ],
    };

    fireEvent.click(
      screen.getByRole("button", { name: "Import File Replace" }),
    );

    const fileInput = screen.getByLabelText("Import profile JSON file");
    const file = new File([JSON.stringify(payload)], "profiles.json", {
      type: "application/json",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText("Imported 2 profiles (replace mode)."),
      ).toBeInTheDocument();
    });

    const list = screen.getByRole("combobox", { name: "Custom profile list" });
    const options = within(list)
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toContain("File A");
    expect(options).toContain("File B");
  });
});
