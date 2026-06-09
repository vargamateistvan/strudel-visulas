import { PresetsDialog } from "../PresetsDialog";
import { HowItWorksDialog } from "../HowItWorksDialog";
import { SplashOverlay } from "./SplashOverlay";
import type { CodePreset } from "../../hooks/useLocalPresets";

type OverlayDialogsProps = {
  presetsOpen: boolean;
  helpOpen: boolean;
  splashDone: boolean;
  currentCode: string;
  presets: CodePreset[];
  onClosePresets: () => void;
  onCloseHelp: () => void;
  onSaveAsNew: (name: string, code: string) => void;
  onOverwrite: (id: string, code: string, name?: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onLoadPreset: (id: string) => void;
  onSplashClick: () => void;
};

export function OverlayDialogs({
  presetsOpen,
  helpOpen,
  splashDone,
  currentCode,
  presets,
  onClosePresets,
  onCloseHelp,
  onSaveAsNew,
  onOverwrite,
  onRename,
  onDelete,
  onLoadPreset,
  onSplashClick,
}: OverlayDialogsProps) {
  return (
    <>
      <PresetsDialog
        open={presetsOpen}
        onClose={onClosePresets}
        currentCode={currentCode}
        presets={presets}
        onSaveAsNew={onSaveAsNew}
        onOverwrite={onOverwrite}
        onRename={onRename}
        onDelete={onDelete}
        onLoad={onLoadPreset}
      />

      <HowItWorksDialog open={helpOpen} onClose={onCloseHelp} />

      {!splashDone && <SplashOverlay onClick={onSplashClick} />}
    </>
  );
}
