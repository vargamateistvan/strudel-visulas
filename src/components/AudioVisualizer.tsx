import React, { useCallback, useState } from "react";
import { useStrudel, DEFAULT_PATTERN } from "../hooks/useStrudel";
import { useLocalPresets } from "../hooks/useLocalPresets";
import { useRecordingExport } from "../hooks/useRecordingExport";
import { useAudioVisualizerPersistence } from "../hooks/useAudioVisualizerPersistence";
import { useCustomColorPresets } from "../hooks/useCustomColorPresets";
import { useVisualSettings } from "../hooks/useVisualSettings";
import { useAudioVisualizerUiState } from "../hooks/useAudioVisualizerUiState";
import { useAudioVisualizerActions } from "../hooks/useAudioVisualizerActions";
import { Layout } from "./Layout";
import { Header } from "./Header";
import {
  SettingsDrawer,
  type ColorScheme,
  type EditorColorPreset,
  type EditorFontPreset,
  type VizMode,
} from "./SettingsDrawer";
import { BackgroundVisualizer } from "./audio/BackgroundVisualizer";
import { AudioWorkspace } from "./audio/AudioWorkspace";
import { OverlayDialogs } from "./audio/OverlayDialogs";
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
  const [code, setCode] = useState(() => loadDraft() ?? DEFAULT_PATTERN);

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

  const onCodeChange = useCallback((c: string) => {
    setCode(c);
  }, []);

  const { handleLoadPreset, handleSplashClick } = useAudioVisualizerActions({
    code,
    play,
    getById,
    setCode,
    closePresets,
    markSplashDone,
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
        onSettingsOpen={openDrawer}
        onPresetsOpen={openPresets}
        onHowItWorksOpen={openHelp}
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
        onClose={closeDrawer}
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
        onClosePresets={closePresets}
        onCloseHelp={closeHelp}
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
