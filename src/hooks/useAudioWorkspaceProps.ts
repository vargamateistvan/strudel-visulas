import type { ComponentProps } from "react";
import { AudioWorkspace } from "../components/audio/AudioWorkspace";

type UseAudioWorkspacePropsArgs = ComponentProps<typeof AudioWorkspace>;

export function useAudioWorkspaceProps(args: UseAudioWorkspacePropsArgs) {
  return args;
}
