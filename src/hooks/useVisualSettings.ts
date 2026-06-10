import { useCallback, useState } from "react";
import type { VizMode } from "../components/SettingsDrawer";
import {
  DEFAULT_VISUAL_SETTINGS,
  loadVisualSettingsMap,
  type VisualSettingsMap,
} from "../components/audio/audioVisualizerSettings";

export function useVisualSettings(vizMode: VizMode) {
  const [visualSettings, setVisualSettings] = useState<VisualSettingsMap>(() =>
    loadVisualSettingsMap(),
  );

  const currentVisualSettings =
    visualSettings[vizMode] ?? DEFAULT_VISUAL_SETTINGS;

  const kickSensitivity = currentVisualSettings.kickSensitivity;
  const fractalQuality = currentVisualSettings.fractalQuality;
  const mandelbulbSize = currentVisualSettings.mandelbulbSize;
  const particleDensity = currentVisualSettings.particleDensity;
  const spectrumBarCount = currentVisualSettings.spectrumBarCount;
  const spectrumWaveform = currentVisualSettings.spectrumWaveform;
  const ifsShape = currentVisualSettings.ifsShape;
  const ifsSize = currentVisualSettings.ifsSize;
  const lissajousSize = currentVisualSettings.lissajousSize;
  const kaleidoscopeSize = currentVisualSettings.kaleidoscopeSize;

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

  const setIfsShapeForViz = useCallback(
    (value: "fern" | "spiral" | "crystal") => {
      setVisualSettings((prev) => {
        const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
        return {
          ...prev,
          [vizMode]: {
            ...existing,
            ifsShape: value,
          },
        };
      });
    },
    [vizMode],
  );

  const makeNumericSetter = (
    field: "ifsSize" | "lissajousSize" | "kaleidoscopeSize",
  ) =>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(
      (value: number) => {
        setVisualSettings((prev) => {
          const existing = prev[vizMode] ?? DEFAULT_VISUAL_SETTINGS;
          return {
            ...prev,
            [vizMode]: {
              ...existing,
              [field]: Math.max(0.2, Math.min(4, value)),
            },
          };
        });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [vizMode],
    );

  const setIfsSizeForViz = makeNumericSetter("ifsSize");
  const setLissajousSizeForViz = makeNumericSetter("lissajousSize");
  const setKaleidoscopeSizeForViz = makeNumericSetter("kaleidoscopeSize");

  return {
    visualSettings,
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
    setKickSensitivityForViz,
    setFractalQualityForViz,
    setMandelbulbSizeForViz,
    setParticleDensityForViz,
    setSpectrumBarCountForViz,
    setSpectrumWaveformForViz,
    setIfsShapeForViz,
    setIfsSizeForViz,
    setLissajousSizeForViz,
    setKaleidoscopeSizeForViz,
  };
}
