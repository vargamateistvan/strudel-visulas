import { useMemo } from "react";
import type { AudioData, StrudelStatus } from "./useStrudel";
import type { ColorScheme, VizMode } from "../components/SettingsDrawer";
import { BackgroundVisualizer } from "../components/audio/BackgroundVisualizer";

type UseBackgroundVisualizerNodeArgs = {
  audioData: AudioData;
  colorScheme: ColorScheme;
  customColors: [string, string, string];
  vizMode: VizMode;
  status: StrudelStatus;
  kickSensitivity: number;
  fractalQuality: number;
  mandelbulbSize: number;
  particleDensity: number;
  spectrumBarCount: number;
  spectrumWaveform: boolean;
  ifsShape: "fern" | "spiral" | "crystal";
  ifsSize: number;
  lissajousSize: number;
  kaleidoscopeSize: number;
};

export function useBackgroundVisualizerNode({
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
  ifsShape,
  ifsSize,
  lissajousSize,
  kaleidoscopeSize,
}: UseBackgroundVisualizerNodeArgs) {
  return useMemo(
    () => (
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
        ifsShape={ifsShape}
        ifsSize={ifsSize}
        lissajousSize={lissajousSize}
        kaleidoscopeSize={kaleidoscopeSize}
      />
    ),
    [
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
      ifsShape,
      ifsSize,
      lissajousSize,
      kaleidoscopeSize,
    ],
  );
}
