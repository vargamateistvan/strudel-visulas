import type { ComponentProps } from "react";
import { SettingsDrawer } from "../components/SettingsDrawer";

type UseAudioVisualizerSettingsDrawerPropsArgs = ComponentProps<
  typeof SettingsDrawer
>;

export function useAudioVisualizerSettingsDrawerProps(
  args: UseAudioVisualizerSettingsDrawerPropsArgs,
) {
  return args;
}
