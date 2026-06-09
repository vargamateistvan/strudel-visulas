import { useCallback } from "react";

type UseAudioVisualizerHeaderActionsArgs = {
  code: string;
  play: (code: string) => void;
  startRecording: () => void;
  stopAudioRecording: () => void;
};

export function useAudioVisualizerHeaderActions({
  code,
  play,
  startRecording,
  stopAudioRecording,
}: UseAudioVisualizerHeaderActionsArgs) {
  const onPlay = useCallback(() => {
    play(code);
  }, [play, code]);

  const onRecordStart = useCallback(() => {
    startRecording();
  }, [startRecording]);

  const onRecordStop = useCallback(() => {
    stopAudioRecording();
  }, [stopAudioRecording]);

  return {
    onPlay,
    onRecordStart,
    onRecordStop,
  };
}
