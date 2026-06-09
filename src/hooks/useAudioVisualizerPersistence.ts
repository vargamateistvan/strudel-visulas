import { useEffect } from "react";
import type {
  ColorScheme,
  CustomColorPreset,
  EditorColorPreset,
  EditorFontPreset,
  VizMode,
} from "../components/SettingsDrawer";
import type { VisualSettingsMap } from "../components/audio/audioVisualizerSettings";
import {
  ACTIVE_CUSTOM_COLOR_PRESET_KEY,
  COLOR_SCHEME_KEY,
  CUSTOM_COLOR_PRESETS_KEY,
  EDITOR_COLOR_PRESET_KEY,
  EDITOR_FONT_PRESET_KEY,
  EDITOR_FONT_SIZE_KEY,
  EDITOR_OPACITY_KEY,
  LIVE_PLAYING_NOTE_HIGHLIGHTS_KEY,
  LIVE_PULSE_STRIP_KEY,
  VISUAL_SETTINGS_KEY,
  VIZ_MODE_KEY,
} from "../components/audio/audioVisualizerSettings";
import type { StrudelStatus } from "./useStrudel";

type UseAudioVisualizerPersistenceParams = {
  code: string;
  saveDraft: (code: string) => void;
  status: StrudelStatus;
  updatePattern: (code: string) => void;
  editorColorPreset: EditorColorPreset;
  editorFontPreset: EditorFontPreset;
  editorFontSize: number;
  colorScheme: ColorScheme;
  vizMode: VizMode;
  editorOpacity: number;
  livePulseStrip: boolean;
  livePlayingNoteHighlights: boolean;
  visualSettings: VisualSettingsMap;
  customColorPresets: CustomColorPreset[];
  activeCustomColorPresetId: string | null;
  setPresetsOpen: (open: boolean) => void;
};

export function useAudioVisualizerPersistence({
  code,
  saveDraft,
  status,
  updatePattern,
  editorColorPreset,
  editorFontPreset,
  editorFontSize,
  colorScheme,
  vizMode,
  editorOpacity,
  livePulseStrip,
  livePlayingNoteHighlights,
  visualSettings,
  customColorPresets,
  activeCustomColorPresetId,
  setPresetsOpen,
}: UseAudioVisualizerPersistenceParams) {
  // Preload modules in the background while idle so first play is instant.
  useEffect(() => {
    import("@strudel/core");
    import("@strudel/mini");
    import("@strudel/soundfonts");
    import("@strudel/tonal");
    import("@strudel/transpiler");
    import("@strudel/webaudio");
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveDraft(code);
    }, 900);
    return () => window.clearTimeout(t);
  }, [code, saveDraft]);

  useEffect(() => {
    if (status !== "playing") return;
    const t = window.setTimeout(() => {
      updatePattern(code);
    }, 520);
    return () => window.clearTimeout(t);
  }, [code, status, updatePattern]);

  useEffect(() => {
    localStorage.setItem(EDITOR_COLOR_PRESET_KEY, editorColorPreset);
  }, [editorColorPreset]);

  useEffect(() => {
    localStorage.setItem(EDITOR_FONT_PRESET_KEY, editorFontPreset);
  }, [editorFontPreset]);

  useEffect(() => {
    localStorage.setItem(EDITOR_FONT_SIZE_KEY, String(editorFontSize));
  }, [editorFontSize]);

  useEffect(() => {
    localStorage.setItem(COLOR_SCHEME_KEY, colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    localStorage.setItem(VIZ_MODE_KEY, vizMode);
  }, [vizMode]);

  useEffect(() => {
    localStorage.setItem(EDITOR_OPACITY_KEY, String(editorOpacity));
  }, [editorOpacity]);

  useEffect(() => {
    localStorage.setItem(LIVE_PULSE_STRIP_KEY, String(livePulseStrip));
  }, [livePulseStrip]);

  useEffect(() => {
    localStorage.setItem(
      LIVE_PLAYING_NOTE_HIGHLIGHTS_KEY,
      String(livePlayingNoteHighlights),
    );
  }, [livePlayingNoteHighlights]);

  useEffect(() => {
    localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify(visualSettings));
  }, [visualSettings]);

  useEffect(() => {
    localStorage.setItem(
      CUSTOM_COLOR_PRESETS_KEY,
      JSON.stringify(customColorPresets),
    );
  }, [customColorPresets]);

  useEffect(() => {
    if (activeCustomColorPresetId) {
      localStorage.setItem(
        ACTIVE_CUSTOM_COLOR_PRESET_KEY,
        activeCustomColorPresetId,
      );
    } else {
      localStorage.removeItem(ACTIVE_CUSTOM_COLOR_PRESET_KEY);
    }
  }, [activeCustomColorPresetId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setPresetsOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setPresetsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPresetsOpen]);
}
