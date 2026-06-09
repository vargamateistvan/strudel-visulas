import React from "react";
import { useStrudel, DEFAULT_PATTERN } from "../hooks/useStrudel";
import { useLocalPresets } from "../hooks/useLocalPresets";
import { useRecordingExport } from "../hooks/useRecordingExport";
import { useAudioVisualizerPersistence } from "../hooks/useAudioVisualizerPersistence";
import { useCustomColorPresets } from "../hooks/useCustomColorPresets";
import { useVisualSettings } from "../hooks/useVisualSettings";
import { useAudioVisualizerUiState } from "../hooks/useAudioVisualizerUiState";
import { useAudioVisualizerActions } from "../hooks/useAudioVisualizerActions";
import { useAudioVisualizerPreferences } from "../hooks/useAudioVisualizerPreferences";
import { useAudioVisualizerCode } from "../hooks/useAudioVisualizerCode";
import { useBackgroundVisualizerNode } from "../hooks/useBackgroundVisualizerNode";
import { Layout } from "./Layout";
import { Header } from "./Header";
import { SettingsDrawer } from "./SettingsDrawer";
import { AudioWorkspace } from "./audio/AudioWorkspace";
import { OverlayDialogs } from "./audio/OverlayDialogs";

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
