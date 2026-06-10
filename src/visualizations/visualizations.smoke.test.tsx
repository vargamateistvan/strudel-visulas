import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FractalField } from "./FractalField";
import { ParticleField } from "./ParticleField";
import { SpectrumAnalyzer } from "./SpectrumAnalyzer";

const audioData = {
  frequencies: new Uint8Array(64),
  waveform: new Uint8Array(64),
  volume: 0,
  bass: 0,
  mid: 0,
  treble: 0,
};

describe("visualization components", () => {
  it("renders ParticleField canvas", () => {
    const { container } = render(
      <ParticleField
        audioData={audioData}
        colorScheme="neon"
        customColors={["#00ff88", "#00ffff", "#ff00ff"]}
        isPlaying={false}
        kickSensitivity={1}
        particleDensity={120}
      />,
    );

    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("renders SpectrumAnalyzer canvas", () => {
    const { container } = render(
      <SpectrumAnalyzer
        audioData={audioData}
        colorScheme="neon"
        customColors={["#00ff88", "#00ffff", "#ff00ff"]}
        isPlaying={false}
        kickSensitivity={1}
        barCount={48}
        showWaveform
      />,
    );

    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("renders FractalField canvas", () => {
    const { container } = render(
      <FractalField
        audioData={audioData}
        colorScheme="neon"
        customColors={["#00ff88", "#00ffff", "#ff00ff"]}
        mode="julia"
        isPlaying={false}
        kickSensitivity={1}
        fractalQuality={1}
        mandelbulbSize={1}
      />,
    );

    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("renders Aurora Rings mode canvas", () => {
    const { container } = render(
      <FractalField
        audioData={audioData}
        colorScheme="neon"
        customColors={["#00ff88", "#00ffff", "#ff00ff"]}
        mode="auroraRings"
        isPlaying={false}
        kickSensitivity={1}
        fractalQuality={1}
        mandelbulbSize={1}
      />,
    );

    expect(container.querySelector("canvas")).toBeInTheDocument();
  });
});
