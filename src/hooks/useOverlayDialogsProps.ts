import type { ComponentProps } from "react";
import { OverlayDialogs } from "../components/audio/OverlayDialogs";

type UseOverlayDialogsPropsArgs = ComponentProps<typeof OverlayDialogs>;

export function useOverlayDialogsProps(args: UseOverlayDialogsPropsArgs) {
  return args;
}
