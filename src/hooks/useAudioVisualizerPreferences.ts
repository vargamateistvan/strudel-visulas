import { useState } from "react";
import type {
  ColorScheme,
  EditorColorPreset,
  EditorFontPreset,
  VizMode,
} from "../components/SettingsDrawer";
import {
  COLOR_SCHEME_KEY,
  EDITOR_COLOR_PRESET_KEY,
  EDITOR_FONT_PRESET_KEY,
  EDITOR_FONT_SIZE_KEY,
  EDITOR_OPACITY_KEY,
  LIVE_PLAYING_NOTE_HIGHLIGHTS_KEY,
  LIVE_PULSE_STRIP_KEY,
  VIZ_MODE_KEY,
  isColorScheme,
  isEditorColorPreset,
  isEditorFontPreset,
  isVizMode,
  parseBooleanSetting,
  parseEditorFontSize,
  parseOpacity,
} from "../components/audio/audioVisualizerSettings";

export function useAudioVisualizerPreferences() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem(COLOR_SCHEME_KEY);
    return saved && isColorScheme(saved) ? saved : "neon";
  });

  const [vizMode, setVizMode] = useState<VizMode>(() => {
    const saved = localStorage.getItem(VIZ_MODE_KEY);
    return saved && isVizMode(saved) ? saved : "particles";
  });

  const [editorOpacity, setEditorOpacity] = useState(() => {
    return parseOpacity(localStorage.getItem(EDITOR_OPACITY_KEY)) ?? 0.45;
  });

  const [livePulseStrip, setLivePulseStrip] = useState(() => {
    return parseBooleanSetting(
      localStorage.getItem(LIVE_PULSE_STRIP_KEY),
      true,
    );
  });

  const [livePlayingNoteHighlights, setLivePlayingNoteHighlights] = useState(
    () => {
      return parseBooleanSetting(
        localStorage.getItem(LIVE_PLAYING_NOTE_HIGHLIGHTS_KEY),
        true,
      );
    },
  );

  const [editorColorPreset, setEditorColorPreset] = useState<EditorColorPreset>(
    () => {
      const saved = localStorage.getItem(EDITOR_COLOR_PRESET_KEY);
      return saved && isEditorColorPreset(saved) ? saved : "neon";
    },
  );

  const [editorFontPreset, setEditorFontPreset] = useState<EditorFontPreset>(
    () => {
      const saved = localStorage.getItem(EDITOR_FONT_PRESET_KEY);
      return saved && isEditorFontPreset(saved) ? saved : "jetbrainsMono";
    },
  );

  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    return (
      parseEditorFontSize(localStorage.getItem(EDITOR_FONT_SIZE_KEY)) ?? 13
    );
  });

  return {
    colorScheme,
    setColorScheme,
    vizMode,
    setVizMode,
    editorOpacity,
    setEditorOpacity,
    livePulseStrip,
    setLivePulseStrip,
    livePlayingNoteHighlights,
    setLivePlayingNoteHighlights,
    editorColorPreset,
    setEditorColorPreset,
    editorFontPreset,
    setEditorFontPreset,
    editorFontSize,
    setEditorFontSize,
  };
}
