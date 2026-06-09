import type { ComponentProps } from "react";
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
import { useAudioVisualizerSettingsDrawerProps } from "./useAudioVisualizerSettingsDrawerProps";
import { useAudioWorkspaceProps } from "./useAudioWorkspaceProps";
import { useOverlayDialogsProps } from "./useOverlayDialogsProps";
import { useHeaderProps } from "./useHeaderProps";
import { AudioVisualizerShell } from "../components/audio/AudioVisualizerShell";

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

  const {
    drawerOpen,
    presetsOpen,
    helpOpen,
    splashDone,
    isMobile,
    mobileHeaderExpanded,
    setPresetsOpen,
    setMobileHeaderExpanded,
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

  const settingsDrawerProps = useAudioVisualizerSettingsDrawerProps({
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
    audioData,
  });

  const audioWorkspaceProps = useAudioWorkspaceProps({
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
    activeLiterals,
    activeControls,
    nPulse,
    onCodeChange,
    isExportingMp3,
    mp3Quality,
    mp3Status,
    mp3Progress,
    mp3Speed,
    isMobile,
    mobileHeaderExpanded,
  });

  const overlayDialogsProps = useOverlayDialogsProps({
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
  });

  const headerProps = useHeaderProps({
    status,
    isMobile,
    onMobileAdvancedOpenChange: setMobileHeaderExpanded,
    onSettingsOpen: openDrawer,
    onPresetsOpen: openPresets,
    onHowItWorksOpen: openHelp,
    onPlay,
    onStop: stop,
    isRecording,
    isExportingMp3,
    onRecordStart,
    onRecordStop,
  });

  return {
    background,
    headerProps,
    audioWorkspaceProps,
    settingsDrawerProps,
    overlayDialogsProps,
  };
}
