import { ParticleField } from "../../visualizations/ParticleField";
import { SpectrumAnalyzer } from "../../visualizations/SpectrumAnalyzer";
import { FractalField } from "../../visualizations/FractalField";
import type { AudioData, StrudelStatus } from "../../hooks/useStrudel";
import type { ColorScheme, VizMode } from "../SettingsDrawer";

type BackgroundVisualizerProps = {
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
};

export function BackgroundVisualizer({
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
}: BackgroundVisualizerProps) {
  const isPlaying = status === "playing";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {(vizMode === "particles" || vizMode === "both") && (
        <div style={{ position: "absolute", inset: 0 }}>
          <ParticleField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            particleDensity={particleDensity}
          />
        </div>
      )}
      {(vizMode === "spectrum" || vizMode === "both") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: vizMode === "both" ? 0.4 : 1,
          }}
        >
          <SpectrumAnalyzer
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            barCount={spectrumBarCount}
            showWaveform={spectrumWaveform}
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
          />
        </div>
      )}
      {vizMode === "lissajous" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="lissajous"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
          />
        </div>
      )}
      {vizMode === "auroraRings" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="auroraRings"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
          />
        </div>
      )}
      {vizMode === "julia" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="julia"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
          />
        </div>
      )}
      {vizMode === "kaleidoscope" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="kaleidoscope"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
          />
        </div>
      )}
      {vizMode === "kaleidoTunnel" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="kaleidoTunnel"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
          />
        </div>
      )}
      {vizMode === "mandelbulb" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="mandelbulb"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
            mandelbulbSize={mandelbulbSize}
          />
        </div>
      )}
      {vizMode === "mandelbox" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="mandelbox"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
          />
        </div>
      )}
      {vizMode === "ifs" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="ifs"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
          />
        </div>
      )}
      {vizMode === "thueMorse" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="thueMorse"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
          />
        </div>
      )}
      {vizMode === "lSystem" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="lindenmayer"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
          />
        </div>
      )}
      {vizMode === "mandelbrot" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            customColors={customColors}
            mode="mandelbrot"
            isPlaying={isPlaying}
            kickSensitivity={kickSensitivity}
            fractalQuality={fractalQuality}
          />
        </div>
      )}
    </div>
  );
}
