import { useCallback, useMemo, useState } from "react";
import type {
  ColorScheme,
  CustomColorPreset,
} from "../components/SettingsDrawer";
import {
  ACTIVE_CUSTOM_COLOR_PRESET_KEY,
  DEFAULT_CUSTOM_COLORS,
  isHexColor,
  loadCustomColorPresets,
  sanitizePresetName,
} from "../components/audio/audioVisualizerSettings";

type UseCustomColorPresetsParams = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

export function useCustomColorPresets({
  colorScheme,
  setColorScheme,
}: UseCustomColorPresetsParams) {
  const [customColorPresets, setCustomColorPresets] = useState<
    CustomColorPreset[]
  >(() => loadCustomColorPresets());
  const [activeCustomColorPresetId, setActiveCustomColorPresetId] = useState<
    string | null
  >(() => localStorage.getItem(ACTIVE_CUSTOM_COLOR_PRESET_KEY));

  const activeCustomPreset = useMemo(
    () =>
      customColorPresets.find((p) => p.id === activeCustomColorPresetId) ??
      customColorPresets[0] ??
      null,
    [activeCustomColorPresetId, customColorPresets],
  );

  const customColors: [string, string, string] = activeCustomPreset
    ? activeCustomPreset.colors
    : DEFAULT_CUSTOM_COLORS;

  const selectCustomColorPreset = useCallback(
    (id: string) => {
      setActiveCustomColorPresetId(id);
      setColorScheme("custom");
    },
    [setColorScheme],
  );

  const createCustomColorPreset = useCallback(() => {
    setCustomColorPresets((prev) => {
      const nextIndex = prev.length + 1;
      const id = `custom-${Date.now()}-${nextIndex}`;
      const preset: CustomColorPreset = {
        id,
        name: `Custom ${nextIndex}`,
        colors: activeCustomPreset?.colors ?? DEFAULT_CUSTOM_COLORS,
      };
      setActiveCustomColorPresetId(id);
      setColorScheme("custom");
      return [...prev, preset];
    });
  }, [activeCustomPreset, setColorScheme]);

  const updateCustomColorPresetColor = useCallback(
    (id: string, index: 0 | 1 | 2, color: string) => {
      if (!isHexColor(color)) return;
      setCustomColorPresets((prev) =>
        prev.map((preset) => {
          if (preset.id !== id) return preset;
          const nextColors: [string, string, string] = [...preset.colors];
          nextColors[index] = color;
          return {
            ...preset,
            colors: nextColors,
          };
        }),
      );
    },
    [],
  );

  const renameCustomColorPreset = useCallback((id: string, name: string) => {
    setCustomColorPresets((prev) =>
      prev.map((preset) =>
        preset.id === id
          ? { ...preset, name: sanitizePresetName(name) }
          : preset,
      ),
    );
  }, []);

  const deleteCustomColorPreset = useCallback(
    (id: string) => {
      setCustomColorPresets((prev) => {
        const next = prev.filter((preset) => preset.id !== id);
        const nextActive =
          next.find((preset) => preset.id === activeCustomColorPresetId) ??
          next[0] ??
          null;
        setActiveCustomColorPresetId(nextActive ? nextActive.id : null);
        if (!nextActive && colorScheme === "custom") {
          setColorScheme("neon");
        }
        return next;
      });
    },
    [activeCustomColorPresetId, colorScheme, setColorScheme],
  );

  return {
    customColorPresets,
    activeCustomColorPresetId,
    customColors,
    selectCustomColorPreset,
    createCustomColorPreset,
    updateCustomColorPresetColor,
    renameCustomColorPreset,
    deleteCustomColorPreset,
  };
}
