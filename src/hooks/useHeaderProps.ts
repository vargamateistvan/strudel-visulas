import type { ComponentProps } from "react";
import { Header } from "../components/Header";

type UseHeaderPropsArgs = ComponentProps<typeof Header>;

export function useHeaderProps(args: UseHeaderPropsArgs) {
  return args;
}
