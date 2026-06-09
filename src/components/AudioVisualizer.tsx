import React, { useCallback, useEffect, useState } from "react";
import { useStrudel, DEFAULT_PATTERN } from "../hooks/useStrudel";
import { useLocalPresets } from "../hooks/useLocalPresets";
import { useRecordingExport } from "../hooks/useRecordingExport";
import { Layout } from "./Layout";
import { Header } from "./Header";
import {
  SettingsDrawer,
  type CustomColorPreset,
  type ColorScheme,
  type EditorColorPreset,
  type EditorFontPreset,
  type VizMode,
} from "./SettingsDrawer";
import { BackgroundVisualizer } from "./audio/BackgroundVisualizer";
import { AudioWorkspace } from "./audio/AudioWorkspace";
import { OverlayDialogs } from "./audio/OverlayDialogs";
import {
  ACTIVE_CUSTOM_COLOR_PRESET_KEY,
  COLOR_SCHEME_KEY,
  CUSTOM_COLOR_PRESETS_KEY,
  DEFAULT_CUSTOM_COLORS,
  DEFAULT_VISUAL_SETTINGS,
  EDITOR_COLOR_PRESET_KEY,
  EDITOR_FONT_PRESET_KEY,
  EDITOR_FONT_SIZE_KEY,
  EDITOR_OPACITY_KEY,
  LIVE_PLAYING_NOTE_HIGHLIGHTS_KEY,
  LIVE_PULSE_STRIP_KEY,
  VISUAL_SETTINGS_KEY,
  VIZ_MODE_KEY,
  isColorScheme,
  isEditorColorPreset,
  isEditorFontPreset,
  isHexColor,
  isVizMode,
  loadCustomColorPresets,
  loadVisualSettingsMap,
  parseBooleanSetting,
  parseEditorFontSize,
  parseOpacity,
  sanitizePresetName,
  type VisualSettingsMap,
} from "./audio/audioVisualizerSettings";

export const AudioVisualizer: React.FC = () => {
  const {
    audioData,
    play,
    updatePattern,
    stop,
    status,
    error,
    loadMsg,
    activeNote,
    activeNotes,
    activeLiterals,
    activeControls,
    nPulse,
    getRecordingStream,
  } = useStrudel();
  const {
    presets,
    saveAsNew,
    overwrite,
    rename,
    remove,
    getById,
    loadDraft,
    saveDraft,
  } = useLocalPresets();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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
  const [customColorPresets, setCustomColorPresets] = useState<
    CustomColorPreset[]
  >(() => loadCustomColorPresets());
  const [activeCustomColorPresetId, setActiveCustomColorPresetId] = useState<
    string | null
  >(() => localStorage.getItem(ACTIVE_CUSTOM_COLOR_PRESET_KEY));
  const [visualSettings, setVisualSettings] = useState<VisualSettingsMap>(() =>
    loadVisualSettingsMap(),
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
  const [splashDone, setSplashDone] = useState(false);
  const [code, setCode] = useState(() => loadDraft() ?? DEFAULT_PATTERN);
  const [isMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 900 : false,
  );
  const [mobileHeaderExpanded, setMobileHeaderExpanded] = useState(false);

  const {
    isRecording,
    recordingMode,
    setRecordingMode,
    mp3Quality,
    setMp3Quality,
    isExportingMp3,
    mp3Progress,
    mp3Status,
    mp3Speed,
    startRecording,
    stopAudioRecording,
  } = useRecordingExport({ status, code, getRecordingStream });

  const currentVisualSettings =
    visualSettings[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
  const kickSensitivity = currentVisualSettings.kickSensitivity;
  const fractalQuality = currentVisualSettings.fractalQuality;
  const mandelbulbSize = currentVisualSettings.mandelbulbSize;
  const particleDensity = currentVisualSettings.particleDensity;
  const spectrumBarCount = currentVisualSettings.spectrumBarCount;
  const spectrumWaveform = currentVisualSettings.spectrumWaveform;
  const activeCustomPreset =
    customColorPresets.find((p) => p.id === activeCustomColorPresetId) ??
    customColorPresets[0] ??
    null;
  const customColors: [string, string, string] = activeCustomPreset
    ? activeCustomPreset.colors
    : DEFAULT_CUSTOM_COLORS;

  const setKickSensitivityForViz = useCallback(
    (value: number) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            kickSensitivity: value,
          },
        };
      });
    },
    [vizMode],
  );

  const setFractalQualityForViz = useCallback(
    (value: number) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            fractalQuality: Math.max(1, Math.min(3, Math.round(value))),
          },
        };
      });
    },
    [vizMode],
  );

  const setMandelbulbSizeForViz = useCallback(
    (value: number) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            mandelbulbSize: Math.max(0.7, Math.min(2.2, value)),
          },
        };
      });
    },
    [vizMode],
  );

  const setParticleDensityForViz = useCallback(
    (value: number) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            particleDensity: Math.max(80, Math.min(420, Math.round(value))),
          },
        };
      });
    },
    [vizMode],
  );

  const setSpectrumBarCountForViz = useCallback(
    (value: number) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            spectrumBarCount: Math.max(32, Math.min(180, Math.round(value))),
          },
        };
      });
    },
    [vizMode],
  );

  const setSpectrumWaveformForViz = useCallback(
    (value: boolean) => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            spectrumWaveform: value,
          },
        };
      });
    },
    [vizMode],
  );

  const selectCustomColorPreset = useCallback((id: string) => {
    setActiveCustomColorPresetId(id);
    setColorScheme("custom");
  }, []);

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
  }, [activeCustomPreset]);

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
    [activeCustomColorPresetId, colorScheme],
  );

  const onCodeChange = useCallback((c: string) => {
    setCode(c);
  }, []);

  const handleLoadPreset = useCallback(
    (id: string) => {
      const preset = getById(id);
      if (preset) {
        setCode(preset.code);
        setPresetsOpen(false);
      }
    },
    [getById],
  );

  const handleSplashClick = useCallback(() => {
    setSplashDone(true);
    play(code);
  }, [play, code]);

  // Preload modules in the background while idle so first play is instant
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
  }, []);

  const background = (
    <BackgroundVisualizer
      audioData={audioData}
      colorScheme={colorScheme}
      customColors={customColors}
      vizMode={vizMode}
      status={status}
      kickSensitivity={kickSensitivity}
      fractalQuality={fractalQuality}
      mandelbulbSize={mandelbulbSize}
      particleDensity={particleDensity}
      spectrumBarCount={spectrumBarCount}
      spectrumWaveform={spectrumWaveform}
    />
  );

  return (
    <Layout backgroundVisualizer={background}>
      {/* header */}
      <Header
        status={status}
        isMobile={isMobile}
        onMobileAdvancedOpenChange={setMobileHeaderExpanded}
        onSettingsOpen={() => setDrawerOpen(true)}
        onPresetsOpen={() => setPresetsOpen(true)}
        onHowItWorksOpen={() => setHelpOpen(true)}
        onPlay={() => play(code)}
        onStop={stop}
        isRecording={isRecording}
        isExportingMp3={isExportingMp3}
        onRecordStart={startRecording}
        onRecordStop={stopAudioRecording}
      />

      <AudioWorkspace
        code={code}
        play={play}
        stop={stop}
        status={status}
        error={error}
        loadMsg={loadMsg}
        opacity={editorOpacity}
        colorPreset={editorColorPreset}
        fontPreset={editorFontPreset}
        fontSize={editorFontSize}
        livePulseStrip={livePulseStrip}
        livePlayingNoteHighlights={livePlayingNoteHighlights}
        activeNote={activeNote}
        activeNotes={activeNotes}
        activeLiterals={activeLiterals}
        activeControls={activeControls}
        nPulse={nPulse}
        onCodeChange={onCodeChange}
        isExportingMp3={isExportingMp3}
        mp3Quality={mp3Quality}
        mp3Status={mp3Status}
        mp3Progress={mp3Progress}
        mp3Speed={mp3Speed}
        isMobile={isMobile}
        mobileHeaderExpanded={mobileHeaderExpanded}
      />

      {/* settings drawer */}
      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        colorScheme={colorScheme}
        onColorScheme={setColorScheme}
        customColorPresets={customColorPresets}
        activeCustomColorPresetId={activeCustomColorPresetId}
        onSelectCustomColorPreset={selectCustomColorPreset}
        onCreateCustomColorPreset={createCustomColorPreset}
        onUpdateCustomColorPresetColor={updateCustomColorPresetColor}
        onRenameCustomColorPreset={renameCustomColorPreset}
        onDeleteCustomColorPreset={deleteCustomColorPreset}
        vizMode={vizMode}
        onVizMode={setVizMode}
        kickSensitivity={kickSensitivity}
        onKickSensitivity={setKickSensitivityForViz}
        particleDensity={particleDensity}
        onParticleDensity={setParticleDensityForViz}
        spectrumBarCount={spectrumBarCount}
        onSpectrumBarCount={setSpectrumBarCountForViz}
        spectrumWaveform={spectrumWaveform}
        onSpectrumWaveform={setSpectrumWaveformForViz}
        fractalQuality={fractalQuality}
        onFractalQuality={setFractalQualityForViz}
        mandelbulbSize={mandelbulbSize}
        onMandelbulbSize={setMandelbulbSizeForViz}
        editorOpacity={editorOpacity}
        onEditorOpacity={setEditorOpacity}
        livePulseStrip={livePulseStrip}
        onLivePulseStrip={setLivePulseStrip}
        livePlayingNoteHighlights={livePlayingNoteHighlights}
        onLivePlayingNoteHighlights={setLivePlayingNoteHighlights}
        recordingMode={recordingMode}
        onRecordingMode={setRecordingMode}
        mp3Quality={mp3Quality}
        onMp3Quality={setMp3Quality}
        editorColorPreset={editorColorPreset}
        onEditorColorPreset={setEditorColorPreset}
        editorFontPreset={editorFontPreset}
        onEditorFontPreset={setEditorFontPreset}
        editorFontSize={editorFontSize}
        onEditorFontSize={setEditorFontSize}
        audioData={audioData}
      />

      <OverlayDialogs
        presetsOpen={presetsOpen}
        helpOpen={helpOpen}
        splashDone={splashDone}
        currentCode={code}
        presets={presets}
        onClosePresets={() => setPresetsOpen(false)}
        onCloseHelp={() => setHelpOpen(false)}
        onSaveAsNew={saveAsNew}
        onOverwrite={overwrite}
        onRename={rename}
        onDelete={remove}
        onLoadPreset={handleLoadPreset}
        onSplashClick={handleSplashClick}
      />
    </Layout>
  );
};
