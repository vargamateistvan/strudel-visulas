import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BackgroundVisualizer } from "./BackgroundVisualizer";

vi.mock("../../visualizations/ParticleField", () => ({
  ParticleField: () => <div data-testid="particle-field" />,
}));
vi.mock("../../visualizations/SpectrumAnalyzer", () => ({
  SpectrumAnalyzer: () => <div data-testid="spectrum-analyzer" />,
}));
vi.mock("../../visualizations/FractalField", () => ({
  FractalField: ({ mode }: { mode: string }) => (
    <div data-testid={`fractal-${mode}`} />
  ),
}));

const audioData = {
  frequencies: new Uint8Array(32),
  waveform: new Uint8Array(32),
  volume: 0,
  bass: 0,
  mid: 0,
  treble: 0,
};

describe("BackgroundVisualizer", () => {
  it("renders layered and fractal modes", () => {
    const common = {
      audioData,
      colorScheme: "neon" as const,
      customColors: ["#00ff88", "#00ffff", "#ff00ff"] as [
        string,
        string,
        string,
      ],
      status: "playing" as const,
      kickSensitivity: 1,
      fractalQuality: 1,
      mandelbulbSize: 1,
      particleDensity: 100,
      spectrumBarCount: 32,
      spectrumWaveform: true,
      ifsShape: "fern" as const,
    };

    const layered = render(<BackgroundVisualizer {...common} vizMode="both" />);
    expect(layered.getByTestId("particle-field")).toBeInTheDocument();
    expect(layered.getByTestId("spectrum-analyzer")).toBeInTheDocument();

    const fractal = render(
      <BackgroundVisualizer {...common} vizMode="julia" />,
    );
    expect(fractal.getByTestId("fractal-julia")).toBeInTheDocument();
    expect(screen.queryByTestId("fractal-julia")).toBeInTheDocument();
  });
});
