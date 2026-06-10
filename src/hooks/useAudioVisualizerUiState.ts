import { useCallback, useEffect, useState } from "react";

const SAMPLE_WORKSPACE_OPEN_KEY = "strudel:sample-workspace-open:v1";

function readSampleWorkspaceOpen(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(SAMPLE_WORKSPACE_OPEN_KEY);
  if (saved === null) return true;
  return saved === "true";
}

export function useAudioVisualizerUiState() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [sampleWorkspaceOpen, setSampleWorkspaceOpen] = useState(
    readSampleWorkspaceOpen,
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 900 : false,
  );
  const [mobileHeaderExpanded, setMobileHeaderExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    window.addEventListener("orientationchange", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
      window.removeEventListener("orientationchange", updateIsMobile);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      SAMPLE_WORKSPACE_OPEN_KEY,
      String(sampleWorkspaceOpen),
    );
  }, [sampleWorkspaceOpen]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openPresets = useCallback(() => setPresetsOpen(true), []);
  const closePresets = useCallback(() => setPresetsOpen(false), []);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const markSplashDone = useCallback(() => setSplashDone(true), []);
  const toggleSampleWorkspace = useCallback(
    () => setSampleWorkspaceOpen((open) => !open),
    [],
  );

  return {
    drawerOpen,
    presetsOpen,
    helpOpen,
    splashDone,
    sampleWorkspaceOpen,
    isMobile,
    mobileHeaderExpanded,
    setPresetsOpen,
    setMobileHeaderExpanded,
    setSampleWorkspaceOpen,
    openDrawer,
    closeDrawer,
    openPresets,
    closePresets,
    openHelp,
    closeHelp,
    toggleSampleWorkspace,
    markSplashDone,
  };
}
