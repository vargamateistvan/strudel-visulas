import { useCallback, useEffect, useState } from "react";

export function useAudioVisualizerUiState() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
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

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openPresets = useCallback(() => setPresetsOpen(true), []);
  const closePresets = useCallback(() => setPresetsOpen(false), []);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const markSplashDone = useCallback(() => setSplashDone(true), []);

  return {
    drawerOpen,
    presetsOpen,
    helpOpen,
    splashDone,
    isMobile,
    mobileHeaderExpanded,
    setPresetsOpen,
    setMobileHeaderExpanded,
    openDrawer,
    closeDrawer,
    openPresets,
    closePresets,
    openHelp,
    closeHelp,
    markSplashDone,
  };
}
