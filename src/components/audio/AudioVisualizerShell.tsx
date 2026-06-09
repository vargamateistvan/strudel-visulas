import type { ComponentProps, ReactNode } from "react";
import { Layout } from "../Layout";
import { Header } from "../Header";
import { SettingsDrawer } from "../SettingsDrawer";
import { AudioWorkspace } from "./AudioWorkspace";
import { OverlayDialogs } from "./OverlayDialogs";

type AudioVisualizerShellProps = {
  background: ReactNode;
  headerProps: ComponentProps<typeof Header>;
  audioWorkspaceProps: ComponentProps<typeof AudioWorkspace>;
  settingsDrawerProps: ComponentProps<typeof SettingsDrawer>;
  overlayDialogsProps: ComponentProps<typeof OverlayDialogs>;
};

export function AudioVisualizerShell({
  background,
  headerProps,
  audioWorkspaceProps,
  settingsDrawerProps,
  overlayDialogsProps,
}: AudioVisualizerShellProps) {
  return (
    <Layout backgroundVisualizer={background}>
      <Header {...headerProps} />
      <AudioWorkspace {...audioWorkspaceProps} />
      <SettingsDrawer {...settingsDrawerProps} />
      <OverlayDialogs {...overlayDialogsProps} />
    </Layout>
  );
}
