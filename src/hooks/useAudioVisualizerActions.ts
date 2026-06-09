import { useCallback } from "react";

type PresetGetter = (id: string) => { code: string } | null | undefined;

type UseAudioVisualizerActionsArgs = {
  code: string;
  play: (code: string) => void;
  getById: PresetGetter;
  setCode: (code: string) => void;
  closePresets: () => void;
  markSplashDone: () => void;
};

export function useAudioVisualizerActions({
  code,
  play,
  getById,
  setCode,
  closePresets,
  markSplashDone,
}: UseAudioVisualizerActionsArgs) {
  const handleLoadPreset = useCallback(
    (id: string) => {
      const preset = getById(id);
      if (preset) {
        setCode(preset.code);
        closePresets();
      }
    },
    [getById, setCode, closePresets],
  );

  const handleSplashClick = useCallback(() => {
    markSplashDone();
    play(code);
  }, [markSplashDone, play, code]);

  return {
    handleLoadPreset,
    handleSplashClick,
  };
}
