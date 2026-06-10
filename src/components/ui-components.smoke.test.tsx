import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AiComposerPanel } from "./audio/AiComposerPanel";
import { AudioVisualizer } from "./AudioVisualizer";
import { Header } from "./Header";
import { HowItWorksDialog } from "./HowItWorksDialog";
import { Layout } from "./Layout";
import { LoadingOverlay } from "./LoadingOverlay";
import { PresetsDialog } from "./PresetsDialog";
import { SettingsDrawer } from "./SettingsDrawer";
import { EditorChrome } from "./editor/EditorChrome";
import { EditorStatusPills } from "./editor/EditorStatusPills";
import { EditorToolbar } from "./editor/EditorToolbar";
import { AiComposerSettingsSection } from "./settings/AiComposerSettingsSection";
import { ColorSchemeSection } from "./settings/ColorSchemeSection";
import { LiveFeedbackSection } from "./settings/LiveFeedbackSection";
import { RecordingSection } from "./settings/RecordingSection";
import { SettingToggle } from "./settings/SettingToggle";

const noop = vi.fn();

vi.mock("../hooks/useAudioVisualizerController", () => ({
  useAudioVisualizerController: () => ({
    background: <div data-testid="bg" />,
    headerProps: {},
    audioWorkspaceProps: {},
    settingsDrawerProps: {},
    overlayDialogsProps: {},
  }),
}));

vi.mock("./audio/AudioVisualizerShell", () => ({
  AudioVisualizerShell: () => <div data-testid="audio-visualizer-shell" />,
}));

const audioData = {
  frequencies: new Uint8Array(64),
  waveform: new Uint8Array(64),
  volume: 0,
  bass: 0,
  mid: 0,
  treble: 0,
};

describe("UI component smoke coverage", () => {
  it("renders Layout with background and children", () => {
    render(
      <Layout backgroundVisualizer={<div>bg-layer</div>}>
        <div>child-layer</div>
      </Layout>,
    );

    expect(screen.getByText("bg-layer")).toBeInTheDocument();
    expect(screen.getByText("child-layer")).toBeInTheDocument();
  });

  it("renders LoadingOverlay message", () => {
    render(<LoadingOverlay message="Loading assets" />);
    expect(screen.getByText("Loading assets")).toBeInTheDocument();
  });

  it("renders HowItWorksDialog and closes", () => {
    const onClose = vi.fn();
    render(<HowItWorksDialog open onClose={onClose} />);

    fireEvent.click(screen.getByText("CLOSE"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders PresetsDialog and saves new preset", () => {
    const onSaveAsNew = vi.fn();
    render(
      <PresetsDialog
        open
        onClose={noop}
        currentCode={'note("c4")'}
        presets={[
          {
            id: "p1",
            name: "Preset One",
            code: 'note("d4")',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]}
        onSaveAsNew={onSaveAsNew}
        onOverwrite={noop}
        onRename={noop}
        onDelete={noop}
        onLoad={noop}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Preset name"), {
      target: { value: "My Preset" },
    });
    fireEvent.click(screen.getByText("SAVE AS NEW"));

    expect(onSaveAsNew).toHaveBeenCalledWith("My Preset", 'note("c4")');
  });

  it("renders Header and triggers actions", () => {
    const onPlay = vi.fn();
    const onSettingsOpen = vi.fn();

    render(
      <Header
        status="idle"
        isMobile={false}
        onSettingsOpen={onSettingsOpen}
        onPresetsOpen={noop}
        sampleWorkspaceOpen
        onSampleWorkspaceToggle={noop}
        onHowItWorksOpen={noop}
        onPlay={onPlay}
        onStop={noop}
        isRecording={false}
        isExportingMp3={false}
        onRecordStart={noop}
        onRecordStop={noop}
        masterVolume={0.5}
        onMasterVolumeChange={noop}
      />,
    );

    fireEvent.click(screen.getByLabelText("Play"));
    fireEvent.click(screen.getByLabelText("Audio settings"));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onSettingsOpen).toHaveBeenCalledTimes(1);
  });

  it("renders setting controls and fires callbacks", () => {
    const onToggle = vi.fn();
    render(
      <SettingToggle
        label="Pulse Strip"
        description="desc"
        enabled
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);

    const onRecordingMode = vi.fn();
    render(
      <RecordingSection
        recordingMode="audio"
        onRecordingMode={onRecordingMode}
        mp3Quality="good"
        onMp3Quality={noop}
      />,
    );
    fireEvent.click(screen.getByText("video"));
    expect(onRecordingMode).toHaveBeenCalledWith("video");

    const onColorScheme = vi.fn();
    render(
      <ColorSchemeSection
        colorScheme="neon"
        onColorScheme={onColorScheme}
        customColorPresets={[]}
        activeCustomColorPresetId={null}
        onSelectCustomColorPreset={noop}
        onCreateCustomColorPreset={noop}
        onUpdateCustomColorPresetColor={noop}
        onRenameCustomColorPreset={noop}
        onDeleteCustomColorPreset={noop}
      />,
    );
    fireEvent.click(screen.getByText("Pastel"));
    expect(onColorScheme).toHaveBeenCalledWith("pastel");

    const onLivePulseStrip = vi.fn();
    render(
      <LiveFeedbackSection
        livePulseStrip
        onLivePulseStrip={onLivePulseStrip}
        livePlayingNoteHighlights={false}
        onLivePlayingNoteHighlights={noop}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /Show the live pulse strip in the editor/i,
      }),
    );
    expect(onLivePulseStrip).toHaveBeenCalledWith(false);

    const onProviderChange = vi.fn();
    render(
      <AiComposerSettingsSection
        enabled
        onEnabledChange={noop}
        provider="chatgpt"
        onProviderChange={onProviderChange}
        applyMode="replace"
        onApplyModeChange={noop}
        apiKey=""
        onApiKeyChange={noop}
        onClearApiKey={noop}
        rememberApiKey={false}
        onRememberApiKeyChange={noop}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("ChatGPT (OpenAI)"), {
      target: { value: "gemini" },
    });
    expect(onProviderChange).toHaveBeenCalledWith("gemini");
  });

  it("renders editor helper components", () => {
    render(<EditorChrome fontFamily="monospace" liveEditError="oops" />);
    expect(screen.getByText(/Live edit error:/i)).toBeInTheDocument();

    render(
      <EditorStatusPills
        fontFamily="monospace"
        pills={[{ label: "mode", value: "play", accent: "#00ff88" }]}
      />,
    );
    expect(screen.getByText("mode")).toBeInTheDocument();

    const onUndo = vi.fn();
    render(
      <EditorToolbar
        fontFamily="monospace"
        onUndo={onUndo}
        onRedo={noop}
        onFormat={noop}
        onWrapRev={noop}
        onWrapGain={noop}
        onDuplicateStack={noop}
        onQuickActions={noop}
        onInsertBeat={noop}
        onInsertAmbient={noop}
      />,
    );
    fireEvent.click(screen.getByText("Undo"));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("renders SettingsDrawer open state", () => {
    render(
      <SettingsDrawer
        open
        onClose={noop}
        colorScheme="neon"
        onColorScheme={noop}
        customColorPresets={[]}
        activeCustomColorPresetId={null}
        onSelectCustomColorPreset={noop}
        onCreateCustomColorPreset={noop}
        onUpdateCustomColorPresetColor={noop}
        onRenameCustomColorPreset={noop}
        onDeleteCustomColorPreset={noop}
        vizMode="particles"
        onVizMode={noop}
        kickSensitivity={1}
        onKickSensitivity={noop}
        particleDensity={220}
        onParticleDensity={noop}
        spectrumBarCount={80}
        onSpectrumBarCount={noop}
        spectrumWaveform
        onSpectrumWaveform={noop}
        fractalQuality={1}
        onFractalQuality={noop}
        mandelbulbSize={1}
        onMandelbulbSize={noop}
        editorOpacity={0.8}
        onEditorOpacity={noop}
        livePulseStrip
        onLivePulseStrip={noop}
        livePlayingNoteHighlights
        onLivePlayingNoteHighlights={noop}
        sampleWorkspaceOpen
        onSampleWorkspaceOpenChange={noop}
        recordingMode="audio"
        onRecordingMode={noop}
        mp3Quality="good"
        onMp3Quality={noop}
        editorColorPreset="neon"
        onEditorColorPreset={noop}
        editorFontPreset="jetbrainsMono"
        onEditorFontPreset={noop}
        editorFontSize={14}
        onEditorFontSize={noop}
        aiComposerEnabled={false}
        onAiComposerEnabled={noop}
        aiProvider="chatgpt"
        onAiProvider={noop}
        aiApplyMode="replace"
        onAiApplyMode={noop}
        aiApiKey=""
        onAiApiKey={noop}
        onAiClearApiKey={noop}
        aiRememberApiKey={false}
        onAiRememberApiKey={noop}
        audioData={audioData}
      />,
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders AI composer panel and handles generate", () => {
    const onGenerate = vi.fn();
    render(
      <AiComposerPanel
        enabled
        prompt="make a beat"
        onPromptChange={noop}
        isGenerating={false}
        canGenerate
        error={null}
        lastUpdatedAt={Date.now()}
        history={[]}
        onClearHistory={noop}
        onGenerate={onGenerate}
      />,
    );

    fireEvent.click(screen.getByLabelText("generate code"));
    expect(onGenerate).toHaveBeenCalledWith("new");
  });

  it("renders AudioVisualizer with mocked controller", () => {
    render(<AudioVisualizer />);
    expect(screen.getByTestId("audio-visualizer-shell")).toBeInTheDocument();
  });
});
