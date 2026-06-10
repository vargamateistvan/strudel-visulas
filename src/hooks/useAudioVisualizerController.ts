import { useCallback, useEffect, useMemo, type ComponentProps } from "react";
import { useStrudel, DEFAULT_PATTERN } from "./useStrudel";
import { useLocalPresets } from "./useLocalPresets";
import { useRecordingExport } from "./useRecordingExport";
import { useAudioVisualizerPersistence } from "./useAudioVisualizerPersistence";
import { useCustomColorPresets } from "./useCustomColorPresets";
import { useVisualSettings } from "./useVisualSettings";
import { useAudioVisualizerUiState } from "./useAudioVisualizerUiState";
import { useAudioVisualizerActions } from "./useAudioVisualizerActions";
import { useAudioVisualizerPreferences } from "./useAudioVisualizerPreferences";
import { useAudioVisualizerCode } from "./useAudioVisualizerCode";
import { useBackgroundVisualizerNode } from "./useBackgroundVisualizerNode";
import { useAudioVisualizerHeaderActions } from "./useAudioVisualizerHeaderActions";
import { useAiMusicComposer } from "./useAiMusicComposer";
import { AudioVisualizerShell } from "../components/audio/AudioVisualizerShell";

function parseComposerSlashCommand(
  rawPrompt: string,
  fallbackIntent: "new" | "refine" | "variation",
): {
  intent: "new" | "refine" | "variation";
  prompt: string;
} {
  const trimmed = rawPrompt.trim();
  const slashMatch = trimmed.match(/^\/(new|rework|variation)\b/i);
  if (!slashMatch) {
    return { intent: fallbackIntent, prompt: trimmed };
  }

  const cmd = slashMatch[1].toLowerCase();
  const intent =
    cmd === "rework" ? "refine" : cmd === "variation" ? "variation" : "new";
  const prompt = trimmed.slice(slashMatch[0].length).trim();
  return { intent, prompt };
}

const IDLE_AUDIO_DATA = {
  frequencies: new Uint8Array(512),
  waveform: new Uint8Array(512),
  volume: 0,
  bass: 0,
  mid: 0,
  treble: 0,
};

export function useAudioVisualizerController(): ComponentProps<
  typeof AudioVisualizerShell
> {
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
    activeMiniLocations,
    masterVolume,
    setMasterVolume,
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

  const {
    drawerOpen,
    presetsOpen,
    helpOpen,
    splashDone,
    sampleWorkspaceOpen,
    isMobile,
    mobileHeaderExpanded,
    setPresetsOpen,
    setMobileHeaderExpanded,
    setSampleWorkspaceOpen,
    toggleSampleWorkspace,
    openDrawer,
    closeDrawer,
    openPresets,
    closePresets,
    openHelp,
    closeHelp,
    markSplashDone,
  } = useAudioVisualizerUiState();

  const {
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
  } = useAudioVisualizerPreferences();

  const { code, setCode, onCodeChange } = useAudioVisualizerCode({
    loadDraft,
    defaultCode: DEFAULT_PATTERN,
  });

  const {
    enabled: aiComposerEnabled,
    setEnabled: setAiComposerEnabled,
    provider: aiProvider,
    setProvider: setAiProvider,
    prompt: aiPrompt,
    setPrompt: setAiPrompt,
    applyMode: aiApplyMode,
    setApplyMode: setAiApplyMode,
    rememberApiKey,
    setRememberApiKey,
    apiKey: aiApiKey,
    setApiKey: setAiApiKey,
    clearApiKey,
    isGenerating: isAiGenerating,
    error: aiError,
    setError: setAiError,
    lastUpdatedAt: aiLastUpdatedAt,
    history: aiHistory,
    clearHistory: clearAiHistory,
    canGenerate: canGenerateAi,
    generate,
  } = useAiMusicComposer();

  const {
    customColorPresets,
    activeCustomColorPresetId,
    customColors,
    selectCustomColorPreset,
    createCustomColorPreset,
    updateCustomColorPresetColor,
    renameCustomColorPreset,
    deleteCustomColorPreset,
  } = useCustomColorPresets({ colorScheme, setColorScheme });

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

  const {
    visualSettings,
    kickSensitivity,
    fractalQuality,
    mandelbulbSize,
    particleDensity,
    spectrumBarCount,
    spectrumWaveform,
    setKickSensitivityForViz,
    setFractalQualityForViz,
    setMandelbulbSizeForViz,
    setParticleDensityForViz,
    setSpectrumBarCountForViz,
    setSpectrumWaveformForViz,
  } = useVisualSettings(vizMode);

  const { handleLoadPreset, handleSplashClick } = useAudioVisualizerActions({
    code,
    play,
    getById,
    setCode,
    closePresets,
    markSplashDone,
  });

  const { onPlay, onRecordStart, onRecordStop } =
    useAudioVisualizerHeaderActions({
      code,
      play,
      startRecording,
      stopAudioRecording,
    });

  const insertCodeSnippet = useCallback(
    (snippet: string) => {
      const cleaned = snippet.trim();
      if (!cleaned) return;
      const base = code.trimEnd();
      const separator = base.length > 0 ? "\n\n" : "";
      setCode(`${base}${separator}${cleaned}`);
    },
    [code, setCode],
  );

  const auditionSnippet = useCallback(
    async (snippet: string) => {
      const cleaned = snippet.trim();
      if (!cleaned) return;
      await play(cleaned);
    },
    [play],
  );

  useAudioVisualizerPersistence({
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
  });

  const background = useBackgroundVisualizerNode({
    audioData,
    colorScheme,
    customColors,
    vizMode,
    status,
    kickSensitivity,
    fractalQuality,
    mandelbulbSize,
    particleDensity,
    spectrumBarCount,
    spectrumWaveform,
  });

  const drawerAudioData = drawerOpen ? audioData : IDLE_AUDIO_DATA;

  const settingsDrawerProps = useMemo(
    () => ({
      open: drawerOpen,
      onClose: closeDrawer,
      colorScheme,
      onColorScheme: setColorScheme,
      customColorPresets,
      activeCustomColorPresetId,
      onSelectCustomColorPreset: selectCustomColorPreset,
      onCreateCustomColorPreset: createCustomColorPreset,
      onUpdateCustomColorPresetColor: updateCustomColorPresetColor,
      onRenameCustomColorPreset: renameCustomColorPreset,
      onDeleteCustomColorPreset: deleteCustomColorPreset,
      vizMode,
      onVizMode: setVizMode,
      kickSensitivity,
      onKickSensitivity: setKickSensitivityForViz,
      particleDensity,
      onParticleDensity: setParticleDensityForViz,
      spectrumBarCount,
      onSpectrumBarCount: setSpectrumBarCountForViz,
      spectrumWaveform,
      onSpectrumWaveform: setSpectrumWaveformForViz,
      fractalQuality,
      onFractalQuality: setFractalQualityForViz,
      mandelbulbSize,
      onMandelbulbSize: setMandelbulbSizeForViz,
      editorOpacity,
      onEditorOpacity: setEditorOpacity,
      livePulseStrip,
      onLivePulseStrip: setLivePulseStrip,
      livePlayingNoteHighlights,
      onLivePlayingNoteHighlights: setLivePlayingNoteHighlights,
      sampleWorkspaceOpen,
      onSampleWorkspaceOpenChange: setSampleWorkspaceOpen,
      recordingMode,
      onRecordingMode: setRecordingMode,
      mp3Quality,
      onMp3Quality: setMp3Quality,
      editorColorPreset,
      onEditorColorPreset: setEditorColorPreset,
      editorFontPreset,
      onEditorFontPreset: setEditorFontPreset,
      editorFontSize,
      onEditorFontSize: setEditorFontSize,
      aiComposerEnabled,
      onAiComposerEnabled: setAiComposerEnabled,
      aiProvider,
      onAiProvider: setAiProvider,
      aiApplyMode,
      onAiApplyMode: setAiApplyMode,
      aiApiKey,
      onAiApiKey: setAiApiKey,
      onAiClearApiKey: clearApiKey,
      aiRememberApiKey: rememberApiKey,
      onAiRememberApiKey: setRememberApiKey,
      audioData: drawerAudioData,
    }),
    [
      drawerOpen,
      closeDrawer,
      colorScheme,
      setColorScheme,
      customColorPresets,
      activeCustomColorPresetId,
      selectCustomColorPreset,
      createCustomColorPreset,
      updateCustomColorPresetColor,
      renameCustomColorPreset,
      deleteCustomColorPreset,
      vizMode,
      setVizMode,
      kickSensitivity,
      setKickSensitivityForViz,
      particleDensity,
      setParticleDensityForViz,
      spectrumBarCount,
      setSpectrumBarCountForViz,
      spectrumWaveform,
      setSpectrumWaveformForViz,
      fractalQuality,
      setFractalQualityForViz,
      mandelbulbSize,
      setMandelbulbSizeForViz,
      editorOpacity,
      setEditorOpacity,
      livePulseStrip,
      setLivePulseStrip,
      livePlayingNoteHighlights,
      setLivePlayingNoteHighlights,
      sampleWorkspaceOpen,
      setSampleWorkspaceOpen,
      recordingMode,
      setRecordingMode,
      mp3Quality,
      setMp3Quality,
      editorColorPreset,
      setEditorColorPreset,
      editorFontPreset,
      setEditorFontPreset,
      editorFontSize,
      setEditorFontSize,
      aiComposerEnabled,
      setAiComposerEnabled,
      aiProvider,
      setAiProvider,
      aiApplyMode,
      setAiApplyMode,
      aiApiKey,
      setAiApiKey,
      clearApiKey,
      rememberApiKey,
      setRememberApiKey,
      drawerAudioData,
    ],
  );

  const audioWorkspaceProps = useMemo(
    () => ({
      code,
      play,
      stop,
      status,
      error,
      loadMsg,
      opacity: editorOpacity,
      colorPreset: editorColorPreset,
      fontPreset: editorFontPreset,
      fontSize: editorFontSize,
      livePulseStrip,
      livePlayingNoteHighlights,
      activeNote,
      activeNotes,
      activeMiniLocations,
      onCodeChange,
      showSampleWorkspace: sampleWorkspaceOpen,
      onInsertCode: insertCodeSnippet,
      onAuditionCode: auditionSnippet,
      isExportingMp3,
      mp3Quality,
      mp3Status,
      mp3Progress,
      mp3Speed,
      isMobile,
      mobileHeaderExpanded,
      aiComposerProps: {
        enabled: aiComposerEnabled,
        prompt: aiPrompt,
        onPromptChange: setAiPrompt,
        isGenerating: isAiGenerating,
        canGenerate: canGenerateAi,
        error: aiError,
        lastUpdatedAt: aiLastUpdatedAt,
        history: aiHistory,
        onClearHistory: clearAiHistory,
        onGenerate: (intent: "new" | "refine" | "variation") => {
          void (async () => {
            try {
              const parsed = parseComposerSlashCommand(aiPrompt, intent);
              if (!parsed.prompt) {
                setAiError("Add a request after /new, /rework, or /variation.");
                return;
              }

              const aiCode = await generate({
                currentCode: code,
                intent: parsed.intent,
                promptOverride: parsed.prompt,
              });
              if (aiApplyMode === "append") {
                const base = code.trimEnd();
                setCode(`${base}\n\n${aiCode}`);
              } else {
                setCode(aiCode);
              }
            } catch {
              // Hook already stores the user-visible error.
            }
          })();
        },
      },
    }),
    [
      code,
      play,
      stop,
      status,
      error,
      loadMsg,
      editorOpacity,
      editorColorPreset,
      editorFontPreset,
      editorFontSize,
      livePulseStrip,
      livePlayingNoteHighlights,
      activeNote,
      activeNotes,
      activeMiniLocations,
      onCodeChange,
      sampleWorkspaceOpen,
      insertCodeSnippet,
      auditionSnippet,
      isExportingMp3,
      mp3Quality,
      mp3Status,
      mp3Progress,
      mp3Speed,
      isMobile,
      mobileHeaderExpanded,
      aiComposerEnabled,
      aiPrompt,
      setAiPrompt,
      isAiGenerating,
      canGenerateAi,
      aiError,
      aiLastUpdatedAt,
      aiHistory,
      clearAiHistory,
      setAiError,
      generate,
      aiApplyMode,
      setCode,
    ],
  );

  useEffect(() => {
    if (!aiComposerEnabled) {
      setAiError(null);
    }
  }, [aiComposerEnabled, setAiError]);

  const overlayDialogsProps = useMemo(
    () => ({
      presetsOpen,
      helpOpen,
      splashDone,
      currentCode: code,
      presets,
      onClosePresets: closePresets,
      onCloseHelp: closeHelp,
      onSaveAsNew: saveAsNew,
      onOverwrite: overwrite,
      onRename: rename,
      onDelete: remove,
      onLoadPreset: handleLoadPreset,
      onSplashClick: handleSplashClick,
    }),
    [
      presetsOpen,
      helpOpen,
      splashDone,
      code,
      presets,
      closePresets,
      closeHelp,
      saveAsNew,
      overwrite,
      rename,
      remove,
      handleLoadPreset,
      handleSplashClick,
    ],
  );

  const headerProps = useMemo(
    () => ({
      status,
      isMobile,
      onMobileAdvancedOpenChange: setMobileHeaderExpanded,
      onSettingsOpen: openDrawer,
      onPresetsOpen: openPresets,
      sampleWorkspaceOpen,
      onSampleWorkspaceToggle: toggleSampleWorkspace,
      onHowItWorksOpen: openHelp,
      onPlay,
      onStop: stop,
      isRecording,
      isExportingMp3,
      onRecordStart,
      onRecordStop,
      masterVolume,
      onMasterVolumeChange: setMasterVolume,
    }),
    [
      status,
      isMobile,
      setMobileHeaderExpanded,
      openDrawer,
      openPresets,
      sampleWorkspaceOpen,
      toggleSampleWorkspace,
      openHelp,
      onPlay,
      stop,
      isRecording,
      isExportingMp3,
      onRecordStart,
      onRecordStop,
      masterVolume,
      setMasterVolume,
    ],
  );

  return {
    background,
    headerProps,
    audioWorkspaceProps,
    settingsDrawerProps,
    overlayDialogsProps,
  };
}
