import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLocalPresets } from "./useLocalPresets";

const PRESETS_KEY = "strudel:presets:v1";
const DRAFT_KEY = "strudel:draft:v1";

describe("useLocalPresets", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads builtin presets and persists merged state", () => {
    const { result } = renderHook(() => useLocalPresets());

    expect(result.current.presets.length).toBeGreaterThan(0);
    const persisted = localStorage.getItem(PRESETS_KEY);
    expect(persisted).not.toBeNull();
  });

  it("can save, rename, overwrite and remove custom presets", () => {
    vi.spyOn(Date, "now").mockReturnValue(1710000000000);
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    const { result } = renderHook(() => useLocalPresets());

    let createdId = "";
    act(() => {
      const created = result.current.saveAsNew("  ", 'note("c4")');
      createdId = created.id;
    });

    const created = result.current.getById(createdId);
    expect(created).not.toBeNull();
    expect(created?.name).toBe("Untitled Pattern");

    act(() => {
      result.current.rename(createdId, "  New Name  ");
    });
    expect(result.current.getById(createdId)?.name).toBe("New Name");

    act(() => {
      result.current.overwrite(createdId, 'note("d4")', "  Updated  ");
    });
    const overwritten = result.current.getById(createdId);
    expect(overwritten?.name).toBe("Updated");
    expect(overwritten?.code).toBe('note("d4")');

    act(() => {
      result.current.remove(createdId);
    });
    expect(result.current.getById(createdId)).toBeNull();

    vi.restoreAllMocks();
  });

  it("persists and retrieves draft code", () => {
    const { result } = renderHook(() => useLocalPresets());

    act(() => {
      result.current.saveDraft('note("f4")');
    });

    expect(result.current.loadDraft()).toBe('note("f4")');
    expect(localStorage.getItem(DRAFT_KEY)).toBe('note("f4")');
  });
});
