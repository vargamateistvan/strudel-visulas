import React from "react";
import { useAudioVisualizerController } from "../hooks/useAudioVisualizerController";
import { AudioVisualizerShell } from "./audio/AudioVisualizerShell";

export const AudioVisualizer: React.FC = () => {
  const controller = useAudioVisualizerController();

  return <AudioVisualizerShell {...controller} />;
};
