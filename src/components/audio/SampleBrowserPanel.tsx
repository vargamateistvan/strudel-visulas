import { useEffect, useRef, useState } from "react";
import {
  buildSynthFxAuditionSnippet,
  buildSynthFxSnippet,
  buildSynthFxTailSnippet,
  buildSampleAuditionSnippet,
  buildSampleInsertSnippet,
  buildSourceInsertSnippet,
  DEFAULT_SYNTH_FX_STATE,
  SYNTH_FX_MACROS,
  type CustomSampleSource,
  type SampleCategory,
  type SampleCatalogItem,
  type SynthFxBuilderState,
  type SynthWaveform,
} from "../../hooks/useSampleWorkspace";

type AuditionStatus = "idle" | "loading" | "ready" | "error";
type FxApplyTarget = "selection" | "document" | "none";
type MacroApplyMode = "layer" | "replace";
type PatternTool = "reverse" | "slow2" | "fast2" | "density2" | "stutter";
type ShortcutProfileId = "live-coding" | "mouse-only" | "preview-heavy";
type ShortcutProfileState = {
  name: string;
  keyboardModeEnabled: boolean;
  showShortcutHelp: boolean;
  patternPreviewMode: boolean;
  macroApplyMode: MacroApplyMode;
};
type ShortcutProfileEntry = ShortcutProfileState & {
  id: string;
};

type ImportedShortcutProfilesPayload = {
  profiles: ShortcutProfileEntry[];
  selectedProfileId: string | null;
};

const MACRO_APPLY_MODE_KEY = "strudel:sample-workspace:macro-apply-mode:v1";
const PATTERN_PREVIEW_MODE_KEY =
  "strudel:sample-workspace:pattern-preview-mode:v1";
const SHORTCUT_HELP_OPEN_KEY = "strudel:sample-workspace:shortcut-help-open:v1";
const KEYBOARD_MODE_ENABLED_KEY =
  "strudel:sample-workspace:keyboard-mode-enabled:v1";
const CUSTOM_SHORTCUT_PROFILE_KEY =
  "strudel:sample-workspace:custom-shortcut-profile:v1";
const CUSTOM_SHORTCUT_PROFILES_KEY =
  "strudel:sample-workspace:custom-shortcut-profiles:v1";
const SELECTED_CUSTOM_SHORTCUT_PROFILE_ID_KEY =
  "strudel:sample-workspace:selected-custom-shortcut-profile-id:v1";

function readMacroApplyMode(): MacroApplyMode {
  if (typeof window === "undefined") return "layer";
  const saved = localStorage.getItem(MACRO_APPLY_MODE_KEY);
  return saved === "replace" ? "replace" : "layer";
}

function readPatternPreviewMode(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(PATTERN_PREVIEW_MODE_KEY);
  if (saved === null) return true;
  return saved === "true";
}

function readShortcutHelpOpen(): boolean {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem(SHORTCUT_HELP_OPEN_KEY);
  if (saved === null) return false;
  return saved === "true";
}

function readKeyboardModeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(KEYBOARD_MODE_ENABLED_KEY);
  if (saved === null) return true;
  return saved === "true";
}

function readCustomShortcutProfile(): ShortcutProfileState | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(CUSTOM_SHORTCUT_PROFILE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<ShortcutProfileState>;
    if (
      typeof parsed.name !== "string" ||
      typeof parsed.keyboardModeEnabled !== "boolean" ||
      typeof parsed.showShortcutHelp !== "boolean" ||
      typeof parsed.patternPreviewMode !== "boolean" ||
      (parsed.macroApplyMode !== "layer" && parsed.macroApplyMode !== "replace")
    ) {
      return null;
    }

    return {
      name: parsed.name,
      keyboardModeEnabled: parsed.keyboardModeEnabled,
      showShortcutHelp: parsed.showShortcutHelp,
      patternPreviewMode: parsed.patternPreviewMode,
      macroApplyMode: parsed.macroApplyMode,
    };
  } catch {
    return null;
  }
}

function isShortcutProfileState(value: unknown): value is ShortcutProfileState {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<ShortcutProfileState>;
  return (
    typeof profile.name === "string" &&
    typeof profile.keyboardModeEnabled === "boolean" &&
    typeof profile.showShortcutHelp === "boolean" &&
    typeof profile.patternPreviewMode === "boolean" &&
    (profile.macroApplyMode === "layer" || profile.macroApplyMode === "replace")
  );
}

function readCustomShortcutProfiles(): ShortcutProfileEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(CUSTOM_SHORTCUT_PROFILES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const itemRecord = item as Record<string, unknown>;
            const candidate = item as unknown;
            if (!isShortcutProfileState(candidate)) return null;
            const id =
              typeof itemRecord["id"] === "string" &&
              itemRecord["id"].length > 0
                ? itemRecord["id"]
                : `legacy-${index + 1}`;
            return {
              id,
              name: candidate.name,
              keyboardModeEnabled: candidate.keyboardModeEnabled,
              showShortcutHelp: candidate.showShortcutHelp,
              patternPreviewMode: candidate.patternPreviewMode,
              macroApplyMode: candidate.macroApplyMode,
            };
          })
          .filter((item): item is ShortcutProfileEntry => Boolean(item));
      }
    }
  } catch {
    // Ignore invalid data and attempt legacy migration.
  }

  const legacyProfile = readCustomShortcutProfile();
  if (!legacyProfile) return [];
  return [{ id: "legacy-1", ...legacyProfile }];
}

function readSelectedCustomShortcutProfileId(): string | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(SELECTED_CUSTOM_SHORTCUT_PROFILE_ID_KEY);
  return saved && saved.length > 0 ? saved : null;
}

function createCustomShortcutProfileId() {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseImportedShortcutProfiles(
  source: string,
): ImportedShortcutProfilesPayload | null {
  try {
    const parsed = JSON.parse(source) as unknown;
    let profileItems: unknown[] = [];
    let selectedProfileId: string | null = null;

    if (Array.isArray(parsed)) {
      profileItems = parsed;
    } else if (parsed && typeof parsed === "object") {
      const root = parsed as Record<string, unknown>;
      if (Array.isArray(root["profiles"])) {
        profileItems = root["profiles"];
      }
      if (typeof root["selectedProfileId"] === "string") {
        selectedProfileId = root["selectedProfileId"];
      } else if (typeof root["selectedId"] === "string") {
        selectedProfileId = root["selectedId"];
      }
    }

    if (profileItems.length === 0) {
      return null;
    }

    const profiles: ShortcutProfileEntry[] = profileItems
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const itemRecord = item as Record<string, unknown>;
        const candidate = item as unknown;
        if (!isShortcutProfileState(candidate)) return null;
        const id =
          typeof itemRecord["id"] === "string" && itemRecord["id"].length > 0
            ? itemRecord["id"]
            : `import-${index + 1}`;
        return {
          id,
          name: candidate.name,
          keyboardModeEnabled: candidate.keyboardModeEnabled,
          showShortcutHelp: candidate.showShortcutHelp,
          patternPreviewMode: candidate.patternPreviewMode,
          macroApplyMode: candidate.macroApplyMode,
        };
      })
      .filter((item): item is ShortcutProfileEntry => Boolean(item));

    if (profiles.length === 0) {
      return null;
    }

    return {
      profiles,
      selectedProfileId,
    };
  } catch {
    return null;
  }
}

type SampleBrowserPanelProps = {
  opacity: number;
  category: SampleCategory | "all";
  onCategoryChange: (value: SampleCategory | "all") => void;
  query: string;
  onQueryChange: (value: string) => void;
  filteredCatalog: SampleCatalogItem[];
  recentItems: SampleCatalogItem[];
  customSources: CustomSampleSource[];
  onAddRecentToken: (token: string) => void;
  onInsertCode: (snippet: string) => void;
  onAuditionCode: (snippet: string) => Promise<void>;
  onApplyFxToSelection: (fxTail: string) => FxApplyTarget;
  onApplyMacroToSelection: (
    snippet: string,
    mode: MacroApplyMode,
  ) => FxApplyTarget;
  onApplyPatternTool: (tool: PatternTool) => FxApplyTarget;
  onAddSource: (name: string, url: string) => void;
  onRemoveSource: (id: string) => void;
  onToggleSource: (id: string) => void;
};

const CATEGORY_OPTIONS: Array<{
  value: SampleCategory | "all";
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "drums", label: "Drums" },
  { value: "perc", label: "Perc" },
  { value: "fx", label: "FX" },
  { value: "instruments", label: "Instruments" },
  { value: "synths", label: "Synths" },
];

const LOCKED_SOURCE_IDS = new Set([
  "source-dirt-samples",
  "source-eddyflux-crate",
]);

const PATTERN_TOOL_META: Record<
  PatternTool,
  { label: string; preview: string }
> = {
  reverse: { label: "reverse", preview: "(<selection>).rev" },
  slow2: { label: "slow x2", preview: "(<selection>).slow(2)" },
  fast2: { label: "fast x2", preview: "(<selection>).fast(2)" },
  density2: {
    label: "density x2",
    preview: "stack(<selection>, (<selection>).fast(2).gain(0.72))",
  },
  stutter: {
    label: "stutter",
    preview: "stack((<selection>).fast(2), (<selection>).fast(4).gain(0.55))",
  },
};

const SHORTCUT_PROFILES: Array<{
  id: ShortcutProfileId;
  label: string;
  keyboardModeEnabled: boolean;
  showShortcutHelp: boolean;
  patternPreviewMode: boolean;
  macroApplyMode: MacroApplyMode;
}> = [
  {
    id: "live-coding",
    label: "Live Coding",
    keyboardModeEnabled: true,
    showShortcutHelp: false,
    patternPreviewMode: false,
    macroApplyMode: "layer",
  },
  {
    id: "mouse-only",
    label: "Mouse-Only",
    keyboardModeEnabled: false,
    showShortcutHelp: true,
    patternPreviewMode: true,
    macroApplyMode: "layer",
  },
  {
    id: "preview-heavy",
    label: "Preview-Heavy",
    keyboardModeEnabled: true,
    showShortcutHelp: false,
    patternPreviewMode: true,
    macroApplyMode: "replace",
  },
];

function badgeStyle(status: AuditionStatus) {
  if (status === "loading") {
    return {
      color: "#ffe39a",
      border: "1px solid rgba(255,227,154,0.3)",
      background: "rgba(255,227,154,0.1)",
      label: "loading",
    };
  }
  if (status === "ready") {
    return {
      color: "#adffd4",
      border: "1px solid rgba(173,255,212,0.3)",
      background: "rgba(173,255,212,0.1)",
      label: "ready",
    };
  }
  if (status === "error") {
    return {
      color: "#ff9fb3",
      border: "1px solid rgba(255,159,179,0.3)",
      background: "rgba(255,159,179,0.1)",
      label: "error",
    };
  }
  return {
    color: "rgba(255,255,255,0.45)",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.05)",
    label: "idle",
  };
}

export function SampleBrowserPanel({
  opacity,
  category,
  onCategoryChange,
  query,
  onQueryChange,
  filteredCatalog,
  recentItems,
  customSources,
  onAddRecentToken,
  onInsertCode,
  onAuditionCode,
  onApplyFxToSelection,
  onApplyMacroToSelection,
  onApplyPatternTool,
  onAddSource,
  onRemoveSource,
  onToggleSource,
}: SampleBrowserPanelProps) {
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [builder, setBuilder] = useState<SynthFxBuilderState>(
    DEFAULT_SYNTH_FX_STATE,
  );
  const [macroApplyMode, setMacroApplyMode] =
    useState<MacroApplyMode>(readMacroApplyMode);
  const [patternPreviewMode, setPatternPreviewMode] = useState<boolean>(
    readPatternPreviewMode,
  );
  const [pendingPatternTool, setPendingPatternTool] =
    useState<PatternTool | null>(null);
  const [fxApplyHint, setFxApplyHint] = useState<string | null>(null);
  const [showShortcutHelp, setShowShortcutHelp] =
    useState<boolean>(readShortcutHelpOpen);
  const [keyboardModeEnabled, setKeyboardModeEnabled] = useState<boolean>(
    readKeyboardModeEnabled,
  );
  const [customShortcutProfiles, setCustomShortcutProfiles] = useState<
    ShortcutProfileEntry[]
  >(readCustomShortcutProfiles);
  const [selectedCustomShortcutProfileId, setSelectedCustomShortcutProfileId] =
    useState<string | null>(readSelectedCustomShortcutProfileId);
  const [customShortcutProfileName, setCustomShortcutProfileName] = useState(
    () => {
      const profiles = readCustomShortcutProfiles();
      const savedSelectedId = readSelectedCustomShortcutProfileId();
      const selected = profiles.find(
        (profile) => profile.id === savedSelectedId,
      );
      return selected?.name ?? profiles[0]?.name ?? "My Workflow";
    },
  );
  const [profileJsonBuffer, setProfileJsonBuffer] = useState("");
  const [pendingFileImportMode, setPendingFileImportMode] = useState<
    "merge" | "replace"
  >("merge");
  const [recentSectionOpen, setRecentSectionOpen] = useState(true);
  const [catalogSectionOpen, setCatalogSectionOpen] = useState(true);
  const [synthSectionOpen, setSynthSectionOpen] = useState(true);
  const [sourcesSectionOpen, setSourcesSectionOpen] = useState(true);
  const [panelHasFocus, setPanelHasFocus] = useState(false);
  const [auditionStatusById, setAuditionStatusById] = useState<
    Record<string, AuditionStatus>
  >({});
  const panelSurfaceOpacity = Math.max(0.38, Math.min(1, opacity));
  const panelRef = useRef<HTMLDivElement | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(MACRO_APPLY_MODE_KEY, macroApplyMode);
  }, [macroApplyMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PATTERN_PREVIEW_MODE_KEY, String(patternPreviewMode));
  }, [patternPreviewMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SHORTCUT_HELP_OPEN_KEY, String(showShortcutHelp));
  }, [showShortcutHelp]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      KEYBOARD_MODE_ENABLED_KEY,
      String(keyboardModeEnabled),
    );
  }, [keyboardModeEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (customShortcutProfiles.length === 0) {
      localStorage.removeItem(CUSTOM_SHORTCUT_PROFILES_KEY);
      return;
    }

    localStorage.setItem(
      CUSTOM_SHORTCUT_PROFILES_KEY,
      JSON.stringify(customShortcutProfiles),
    );
    // Clear deprecated single-profile storage once migrated.
    localStorage.removeItem(CUSTOM_SHORTCUT_PROFILE_KEY);
  }, [customShortcutProfiles]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!selectedCustomShortcutProfileId) {
      localStorage.removeItem(SELECTED_CUSTOM_SHORTCUT_PROFILE_ID_KEY);
      return;
    }

    localStorage.setItem(
      SELECTED_CUSTOM_SHORTCUT_PROFILE_ID_KEY,
      selectedCustomShortcutProfileId,
    );
  }, [selectedCustomShortcutProfileId]);

  const chainSnippet = buildSynthFxSnippet(builder);
  const fxTailSnippet = buildSynthFxTailSnippet(builder);

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    if (!keyboardModeEnabled) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();
    if (event.shiftKey && key === "s") {
      event.preventDefault();
      saveCustomShortcutProfile();
      return;
    }

    if (event.shiftKey && key === "o") {
      event.preventDefault();
      loadCustomShortcutProfile();
      return;
    }

    if (key === "l") {
      event.preventDefault();
      setMacroApplyMode("layer");
      setFxApplyHint("Macro mode set to Layer.");
      return;
    }

    if (key === "r") {
      event.preventDefault();
      setMacroApplyMode("replace");
      setFxApplyHint("Macro mode set to Replace.");
      return;
    }

    if (key === "v") {
      event.preventDefault();
      handlePatternTool("reverse");
      return;
    }

    if (key === "[") {
      event.preventDefault();
      handlePatternTool("slow2");
      return;
    }

    if (key === "]") {
      event.preventDefault();
      handlePatternTool("fast2");
      return;
    }

    if (key === "d") {
      event.preventDefault();
      handlePatternTool("density2");
      return;
    }

    if (key === "t") {
      event.preventDefault();
      handlePatternTool("stutter");
      return;
    }

    if (key === "?") {
      event.preventDefault();
      setShowShortcutHelp((prev) => !prev);
    }
  };

  const handleAudition = async (item: SampleCatalogItem) => {
    setAuditionStatusById((prev) => ({ ...prev, [item.id]: "loading" }));
    try {
      await onAuditionCode(buildSampleAuditionSnippet(item));
      setAuditionStatusById((prev) => ({ ...prev, [item.id]: "ready" }));
      onAddRecentToken(item.token);
    } catch {
      setAuditionStatusById((prev) => ({ ...prev, [item.id]: "error" }));
    }
  };

  const handleSourceLoad = async (source: CustomSampleSource) => {
    setAuditionStatusById((prev) => ({ ...prev, [source.id]: "loading" }));
    try {
      await onAuditionCode(buildSourceInsertSnippet(source));
      setAuditionStatusById((prev) => ({ ...prev, [source.id]: "ready" }));
    } catch {
      setAuditionStatusById((prev) => ({ ...prev, [source.id]: "error" }));
    }
  };

  const applyPatternToolNow = (tool: PatternTool, label: string) => {
    const result = onApplyPatternTool(tool);
    if (result === "selection") {
      setFxApplyHint(`Applied ${label} to selection.`);
      return;
    }
    if (result === "document") {
      setFxApplyHint(`No selection found. Applied ${label} to full document.`);
      return;
    }
    setFxApplyHint("Editor is not ready yet. Try again in a moment.");
  };

  const getActiveShortcutProfileId = (): ShortcutProfileId | null => {
    const selectedProfile = customShortcutProfiles.find(
      (profile) => profile.id === selectedCustomShortcutProfileId,
    );
    if (
      selectedProfile &&
      selectedProfile.keyboardModeEnabled === keyboardModeEnabled &&
      selectedProfile.showShortcutHelp === showShortcutHelp &&
      selectedProfile.patternPreviewMode === patternPreviewMode &&
      selectedProfile.macroApplyMode === macroApplyMode
    ) {
      return null;
    }

    const matchedProfile = SHORTCUT_PROFILES.find(
      (profile) =>
        profile.keyboardModeEnabled === keyboardModeEnabled &&
        profile.showShortcutHelp === showShortcutHelp &&
        profile.patternPreviewMode === patternPreviewMode &&
        profile.macroApplyMode === macroApplyMode,
    );
    return matchedProfile?.id ?? null;
  };

  const activeShortcutProfileId = getActiveShortcutProfileId();

  const fallbackSelectedCustomShortcutProfileId = customShortcutProfiles.some(
    (profile) => profile.id === selectedCustomShortcutProfileId,
  )
    ? selectedCustomShortcutProfileId
    : (customShortcutProfiles[0]?.id ?? null);

  const selectedCustomShortcutProfile = customShortcutProfiles.find(
    (profile) => profile.id === fallbackSelectedCustomShortcutProfileId,
  );

  const selectedCustomShortcutProfileIndex = customShortcutProfiles.findIndex(
    (profile) => profile.id === fallbackSelectedCustomShortcutProfileId,
  );

  const normalizedCustomShortcutProfileName =
    customShortcutProfileName.trim() || "My Workflow";

  const isCustomShortcutProfileActive = Boolean(
    selectedCustomShortcutProfile &&
    selectedCustomShortcutProfile.keyboardModeEnabled === keyboardModeEnabled &&
    selectedCustomShortcutProfile.showShortcutHelp === showShortcutHelp &&
    selectedCustomShortcutProfile.patternPreviewMode === patternPreviewMode &&
    selectedCustomShortcutProfile.macroApplyMode === macroApplyMode,
  );

  const hasCustomShortcutUnsavedChanges = Boolean(
    !selectedCustomShortcutProfile ||
    selectedCustomShortcutProfile.name !==
      normalizedCustomShortcutProfileName ||
    selectedCustomShortcutProfile.keyboardModeEnabled !== keyboardModeEnabled ||
    selectedCustomShortcutProfile.showShortcutHelp !== showShortcutHelp ||
    selectedCustomShortcutProfile.patternPreviewMode !== patternPreviewMode ||
    selectedCustomShortcutProfile.macroApplyMode !== macroApplyMode,
  );

  const applyShortcutProfile = (profileId: ShortcutProfileId) => {
    const profile = SHORTCUT_PROFILES.find((entry) => entry.id === profileId);
    if (!profile) {
      return;
    }

    setKeyboardModeEnabled(profile.keyboardModeEnabled);
    setShowShortcutHelp(profile.showShortcutHelp);
    setPatternPreviewMode(profile.patternPreviewMode);
    setMacroApplyMode(profile.macroApplyMode);
    setPendingPatternTool(null);
    setFxApplyHint(`Shortcut profile applied: ${profile.label}.`);
  };

  const saveCustomShortcutProfile = () => {
    const name = normalizedCustomShortcutProfileName;
    const profileState: ShortcutProfileState = {
      name,
      keyboardModeEnabled,
      showShortcutHelp,
      patternPreviewMode,
      macroApplyMode,
    };

    const hasExplicitSelectedProfile = customShortcutProfiles.some(
      (profile) => profile.id === selectedCustomShortcutProfileId,
    );

    if (hasExplicitSelectedProfile && selectedCustomShortcutProfileId) {
      setCustomShortcutProfiles((prev) =>
        prev.map((profile) =>
          profile.id === selectedCustomShortcutProfileId
            ? { ...profile, ...profileState }
            : profile,
        ),
      );
    } else {
      const newProfile: ShortcutProfileEntry = {
        id: createCustomShortcutProfileId(),
        ...profileState,
      };
      setCustomShortcutProfiles((prev) => [...prev, newProfile]);
      setSelectedCustomShortcutProfileId(newProfile.id);
    }

    setCustomShortcutProfileName(name);
    setFxApplyHint(`Saved shortcut profile: ${name}.`);
  };

  const loadCustomShortcutProfile = () => {
    if (!selectedCustomShortcutProfile) {
      setFxApplyHint("No custom shortcut profile saved yet.");
      return;
    }

    setKeyboardModeEnabled(selectedCustomShortcutProfile.keyboardModeEnabled);
    setShowShortcutHelp(selectedCustomShortcutProfile.showShortcutHelp);
    setPatternPreviewMode(selectedCustomShortcutProfile.patternPreviewMode);
    setMacroApplyMode(selectedCustomShortcutProfile.macroApplyMode);
    setPendingPatternTool(null);
    setCustomShortcutProfileName(selectedCustomShortcutProfile.name);
    setFxApplyHint(
      `Loaded shortcut profile: ${selectedCustomShortcutProfile.name}.`,
    );
  };

  const deleteCustomShortcutProfile = () => {
    if (
      !fallbackSelectedCustomShortcutProfileId ||
      !selectedCustomShortcutProfile
    ) {
      return;
    }

    const deletedName = selectedCustomShortcutProfile.name;
    setCustomShortcutProfiles((prev) =>
      prev.filter(
        (profile) => profile.id !== fallbackSelectedCustomShortcutProfileId,
      ),
    );
    setSelectedCustomShortcutProfileId(null);
    setCustomShortcutProfileName("My Workflow");
    setFxApplyHint(`Deleted shortcut profile: ${deletedName}.`);
  };

  const moveSelectedCustomShortcutProfile = (direction: "up" | "down") => {
    if (selectedCustomShortcutProfileIndex < 0) {
      return;
    }

    const targetIndex =
      direction === "up"
        ? selectedCustomShortcutProfileIndex - 1
        : selectedCustomShortcutProfileIndex + 1;

    if (targetIndex < 0 || targetIndex >= customShortcutProfiles.length) {
      return;
    }

    setCustomShortcutProfiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(selectedCustomShortcutProfileIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    if (selectedCustomShortcutProfile) {
      setFxApplyHint(
        `Moved shortcut profile ${direction}: ${selectedCustomShortcutProfile.name}.`,
      );
    }
  };

  const exportCustomShortcutProfiles = async () => {
    if (customShortcutProfiles.length === 0) {
      setFxApplyHint("No custom profiles to export yet.");
      return;
    }

    const payload = {
      version: 1,
      profiles: customShortcutProfiles,
      selectedProfileId: fallbackSelectedCustomShortcutProfileId,
    };
    const text = JSON.stringify(payload, null, 2);
    setProfileJsonBuffer(text);

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setFxApplyHint("Exported profiles to clipboard and buffer.");
        return;
      }
    } catch {
      // Continue with buffer fallback.
    }

    setFxApplyHint("Export prepared in buffer. Copy JSON manually.");
  };

  const downloadCustomShortcutProfiles = () => {
    if (customShortcutProfiles.length === 0) {
      setFxApplyHint("No custom profiles to download yet.");
      return;
    }

    const payload = {
      version: 1,
      profiles: customShortcutProfiles,
      selectedProfileId: fallbackSelectedCustomShortcutProfileId,
    };
    const text = JSON.stringify(payload, null, 2);
    setProfileJsonBuffer(text);

    if (typeof document === "undefined") {
      setFxApplyHint("Download is unavailable in this environment.");
      return;
    }

    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "strudel-shortcut-profiles.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setFxApplyHint("Downloaded custom profile JSON.");
  };

  const importCustomShortcutProfilesFromSource = (
    source: string,
    mode: "merge" | "replace",
  ) => {
    const parsed = parseImportedShortcutProfiles(source.trim());
    if (!parsed) {
      setFxApplyHint("Import failed: invalid profile JSON.");
      return;
    }

    const idMap = new Map<string, string>();
    const importedProfiles = parsed.profiles.map((profile) => {
      const nextId = createCustomShortcutProfileId();
      idMap.set(profile.id, nextId);
      return {
        ...profile,
        id: nextId,
      };
    });

    const nextSelectedId = parsed.selectedProfileId
      ? (idMap.get(parsed.selectedProfileId) ?? importedProfiles[0]?.id ?? null)
      : (importedProfiles[0]?.id ?? null);

    if (mode === "replace") {
      setCustomShortcutProfiles(importedProfiles);
      setSelectedCustomShortcutProfileId(nextSelectedId);
      setCustomShortcutProfileName(importedProfiles[0]?.name ?? "My Workflow");
      setFxApplyHint(
        `Imported ${importedProfiles.length} profiles (replace mode).`,
      );
      return;
    }

    setCustomShortcutProfiles((prev) => [...prev, ...importedProfiles]);
    if (nextSelectedId) {
      setSelectedCustomShortcutProfileId(nextSelectedId);
      const selectedImported = importedProfiles.find(
        (profile) => profile.id === nextSelectedId,
      );
      if (selectedImported) {
        setCustomShortcutProfileName(selectedImported.name);
      }
    }
    setFxApplyHint(
      `Imported ${importedProfiles.length} profiles (merge mode).`,
    );
  };

  const importCustomShortcutProfiles = (mode: "merge" | "replace") => {
    importCustomShortcutProfilesFromSource(profileJsonBuffer, mode);
  };

  const triggerFileImport = (mode: "merge" | "replace") => {
    setPendingFileImportMode(mode);
    profileFileInputRef.current?.click();
  };

  const handleProfileFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setProfileJsonBuffer(text);
      importCustomShortcutProfilesFromSource(text, pendingFileImportMode);
    } catch {
      setFxApplyHint("Import failed: unable to read selected file.");
    } finally {
      event.target.value = "";
    }
  };

  const handlePatternTool = (tool: PatternTool) => {
    const meta = PATTERN_TOOL_META[tool];
    if (patternPreviewMode) {
      setPendingPatternTool(tool);
      setFxApplyHint(`Preview ready for ${meta.label}. Click Apply Preview.`);
      return;
    }
    applyPatternToolNow(tool, meta.label);
  };

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      onKeyDown={handlePanelKeyDown}
      onFocus={() => setPanelHasFocus(true)}
      onBlur={() => setPanelHasFocus(false)}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        border: panelHasFocus
          ? "1px solid rgba(0,255,136,0.45)"
          : "1px solid rgba(255,255,255,0.07)",
        background: `rgba(8,8,18,${panelSurfaceOpacity})`,
        backdropFilter: "blur(24px)",
        boxShadow: panelHasFocus
          ? "0 18px 40px rgba(0,0,0,0.38), 0 0 0 2px rgba(0,255,136,0.18)"
          : "0 18px 40px rgba(0,0,0,0.38)",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        overflowY: "auto",
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            fontWeight: 700,
            color: "#00ff88",
          }}
        >
          SAMPLE WORKSPACE
        </div>

        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search sounds, tokens, banks"
          style={{
            width: "100%",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            color: "#d7e8fb",
            fontSize: 12,
            padding: "8px 10px",
            fontFamily: '"JetBrains Mono", monospace',
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CATEGORY_OPTIONS.map((option) => {
            const active = category === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onCategoryChange(option.value)}
                style={{
                  border: active
                    ? "1px solid rgba(0,255,136,0.4)"
                    : "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  background: active
                    ? "rgba(0,255,136,0.16)"
                    : "rgba(255,255,255,0.03)",
                  color: active ? "#b7f7d3" : "rgba(255,255,255,0.74)",
                  fontSize: 11,
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "8px 12px 10px",
        }}
      >
        <button
          type="button"
          onClick={() => setRecentSectionOpen((prev) => !prev)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.56)",
            }}
          >
            RECENT SOUNDS
          </span>
          <span style={{ color: "rgba(255,255,255,0.56)", fontSize: 12 }}>
            {recentSectionOpen ? "-" : "+"}
          </span>
        </button>
        {recentSectionOpen && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}
          >
            {recentItems.length === 0 && (
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                Audition sounds to build your recents list.
              </span>
            )}
            {recentItems.map((item) => (
              <button
                key={`recent-${item.id}`}
                type="button"
                onClick={() => onInsertCode(buildSampleInsertSnippet(item))}
                style={{
                  border: "1px solid rgba(0,255,136,0.34)",
                  borderRadius: 999,
                  background: "rgba(0,255,136,0.11)",
                  color: "#bcffe0",
                  fontSize: 11,
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                {item.token}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "10px 12px 12px",
          display: "grid",
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={() => setCatalogSectionOpen((prev) => !prev)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.56)",
            }}
          >
            SOUND CATALOG
          </span>
          <span style={{ color: "rgba(255,255,255,0.56)", fontSize: 12 }}>
            {catalogSectionOpen ? "-" : "+"}
          </span>
        </button>
        {catalogSectionOpen && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 6,
            }}
          >
            {filteredCatalog.map((item) => {
              return (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    padding: 6,
                    display: "grid",
                    gap: 3,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <strong
                      title={item.label}
                      style={{
                        color: "#dbf3ff",
                        fontSize: 10,
                        minWidth: 0,
                        flex: 1,
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label.length > 14
                        ? `${item.label.slice(0, 13)}...`
                        : item.label}
                    </strong>
                  </div>

                  <div
                    title={item.description}
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 10,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.description.length > 20
                      ? `${item.description.slice(0, 19)}...`
                      : item.description}
                  </div>

                  <div
                    title={
                      item.bank
                        ? `${item.token} · bank(${item.bank})`
                        : item.token
                    }
                    style={{
                      fontSize: 9,
                      color: "#7ef4bf",
                      fontFamily: '"JetBrains Mono", monospace',
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {(item.bank
                      ? `${item.token} · bank(${item.bank})`
                      : item.token
                    )
                      .slice(0, 22)
                      .concat(
                        (item.bank
                          ? `${item.token} · bank(${item.bank})`
                          : item.token
                        ).length > 22
                          ? "..."
                          : "",
                      )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onInsertCode(buildSampleInsertSnippet(item));
                        onAddRecentToken(item.token);
                      }}
                      title="Insert"
                      aria-label={`Insert ${item.label}`}
                      style={{
                        border: "1px solid rgba(0,255,136,0.34)",
                        borderRadius: 6,
                        background: "rgba(0,255,136,0.1)",
                        color: "#b6ffdb",
                        fontSize: 10,
                        width: 24,
                        height: 22,
                        lineHeight: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleAudition(item);
                      }}
                      title="Audition"
                      aria-label={`Audition ${item.label}`}
                      style={{
                        border: "1px solid rgba(0,255,136,0.35)",
                        borderRadius: 6,
                        background: "rgba(0,255,136,0.11)",
                        color: "#b7f7d3",
                        width: 24,
                        height: 22,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{ fontSize: 10, lineHeight: 1 }}
                      >
                        ▶
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "10px 12px 12px",
          display: "grid",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setSynthSectionOpen((prev) => !prev)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.56)",
            }}
          >
            SYNTH + FX BUILDER
          </span>
          <span style={{ color: "rgba(255,255,255,0.56)", fontSize: 12 }}>
            {synthSectionOpen ? "-" : "+"}
          </span>
        </button>

        {synthSectionOpen && (
          <div style={{ display: "grid", gap: 6 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              <select
                value={builder.waveform}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    waveform: event.target.value as SynthWaveform,
                  }))
                }
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              >
                <option value="triangle">triangle</option>
                <option value="sine">sine</option>
                <option value="sawtooth">sawtooth</option>
                <option value="square">square</option>
                <option value="white">white</option>
                <option value="pink">pink</option>
                <option value="brown">brown</option>
              </select>
              <input
                value={builder.cpm}
                type="number"
                min={40}
                max={220}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    cpm: Number(event.target.value || prev.cpm),
                  }))
                }
                placeholder="cpm"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
            </div>

            <input
              value={builder.notePattern}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  notePattern: event.target.value,
                }))
              }
              placeholder="Notes pattern, e.g. c3 e3 g3 b3"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                color: "#d7e8fb",
                fontSize: 11,
                padding: "6px 8px",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              <input
                value={builder.attack}
                type="number"
                step={0.01}
                min={0}
                max={2}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    attack: Number(event.target.value || prev.attack),
                  }))
                }
                placeholder="attack"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
              <input
                value={builder.decay}
                type="number"
                step={0.01}
                min={0}
                max={2}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    decay: Number(event.target.value || prev.decay),
                  }))
                }
                placeholder="decay"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
              <input
                value={builder.sustain}
                type="number"
                step={0.01}
                min={0}
                max={1}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    sustain: Number(event.target.value || prev.sustain),
                  }))
                }
                placeholder="sustain"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
              <input
                value={builder.release}
                type="number"
                step={0.01}
                min={0}
                max={3}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    release: Number(event.target.value || prev.release),
                  }))
                }
                placeholder="release"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              <input
                value={builder.lpf}
                type="number"
                min={0}
                max={20000}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    lpf: Number(event.target.value || 0),
                  }))
                }
                placeholder="lpf"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
              <input
                value={builder.room}
                type="number"
                step={0.01}
                min={0}
                max={1}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    room: Number(event.target.value || 0),
                  }))
                }
                placeholder="room"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
              <input
                value={builder.delay}
                type="number"
                step={0.01}
                min={0}
                max={1}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    delay: Number(event.target.value || 0),
                  }))
                }
                placeholder="delay"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
              <input
                value={builder.phaser}
                type="number"
                step={0.1}
                min={0}
                max={12}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    phaser: Number(event.target.value || 0),
                  }))
                }
                placeholder="phaser"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
              <input
                value={builder.pan}
                type="number"
                step={0.01}
                min={0}
                max={1}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    pan: Number(event.target.value || 0.5),
                  }))
                }
                placeholder="pan"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
              <input
                value={builder.gain}
                type="number"
                step={0.01}
                min={0}
                max={2}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    gain: Number(event.target.value || 0.5),
                  }))
                }
                placeholder="gain"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
              <input
                value={builder.distort}
                type="number"
                step={0.1}
                min={0}
                max={12}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    distort: Number(event.target.value || 0),
                  }))
                }
                placeholder="distort"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 12,
                  padding: "7px 9px",
                }}
              />
              <input
                value={builder.crush}
                type="number"
                step={1}
                min={0}
                max={16}
                onChange={(event) =>
                  setBuilder((prev) => ({
                    ...prev,
                    crush: Number(event.target.value || 0),
                  }))
                }
                placeholder="crush"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 12,
                  padding: "7px 9px",
                }}
              />
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.53)",
                fontSize: 10,
                fontFamily: '"JetBrains Mono", monospace',
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "6px 8px",
                maxHeight: 56,
                overflow: "auto",
              }}
            >
              {chainSnippet}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              <button
                type="button"
                onClick={() => onInsertCode(chainSnippet)}
                style={{
                  border: "1px solid rgba(0,255,136,0.34)",
                  borderRadius: 8,
                  background: "rgba(0,255,136,0.1)",
                  color: "#b6ffdb",
                  fontSize: 10,
                  padding: "5px 7px",
                  cursor: "pointer",
                }}
              >
                Insert Synth Chain
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuditionStatusById((prev) => ({
                    ...prev,
                    "builder-main": "loading",
                  }));
                  void onAuditionCode(buildSynthFxAuditionSnippet(builder))
                    .then(() => {
                      setAuditionStatusById((prev) => ({
                        ...prev,
                        "builder-main": "ready",
                      }));
                    })
                    .catch(() => {
                      setAuditionStatusById((prev) => ({
                        ...prev,
                        "builder-main": "error",
                      }));
                    });
                }}
                style={{
                  border: "1px solid rgba(0,255,136,0.35)",
                  borderRadius: 8,
                  background: "rgba(0,255,136,0.11)",
                  color: "#b7f7d3",
                  fontSize: 10,
                  padding: "5px 7px",
                  cursor: "pointer",
                }}
              >
                Audition Chain
              </button>
            </div>

            <button
              type="button"
              onClick={() => onInsertCode(fxTailSnippet)}
              style={{
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                color: "#e8edf4",
                fontSize: 10,
                padding: "5px 7px",
                cursor: "pointer",
              }}
            >
              Insert FX Tail
            </button>

            <button
              type="button"
              onClick={() => {
                const result = onApplyFxToSelection(fxTailSnippet);
                if (result === "selection") {
                  setFxApplyHint("Applied FX tail to current selection.");
                  return;
                }
                if (result === "document") {
                  setFxApplyHint(
                    "No selection found. Applied FX tail to full document.",
                  );
                  return;
                }
                setFxApplyHint(
                  "Editor is not ready yet. Try again in a moment.",
                );
              }}
              style={{
                border: "1px solid rgba(0,255,136,0.35)",
                borderRadius: 8,
                background: "rgba(0,255,136,0.11)",
                color: "#b7f7d3",
                fontSize: 10,
                padding: "5px 7px",
                cursor: "pointer",
              }}
            >
              Apply FX to Selection
            </button>

            {fxApplyHint && (
              <div
                style={{
                  color: "rgba(0,255,136,0.92)",
                  fontSize: 10,
                  fontFamily: '"JetBrains Mono", monospace',
                  border: "1px solid rgba(0,255,136,0.28)",
                  background: "rgba(0,255,136,0.08)",
                  borderRadius: 8,
                  padding: "6px 8px",
                }}
              >
                {fxApplyHint}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 4,
              marginRight: 6,
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999,
              padding: 3,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <button
              type="button"
              onClick={() => setMacroApplyMode("layer")}
              style={{
                border: "none",
                borderRadius: 999,
                background:
                  macroApplyMode === "layer"
                    ? "rgba(0,255,136,0.2)"
                    : "transparent",
                color:
                  macroApplyMode === "layer"
                    ? "#b7f7d3"
                    : "rgba(255,255,255,0.7)",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
              title="+Sel layers macro with selected code"
            >
              Layer
            </button>
            <button
              type="button"
              onClick={() => setMacroApplyMode("replace")}
              style={{
                border: "none",
                borderRadius: 999,
                background:
                  macroApplyMode === "replace"
                    ? "rgba(0,255,136,0.2)"
                    : "transparent",
                color:
                  macroApplyMode === "replace"
                    ? "#b7f7d3"
                    : "rgba(255,255,255,0.7)",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
              title="+Sel replaces selected code with macro"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                setMacroApplyMode("layer");
                setFxApplyHint("Macro mode reset to Layer.");
              }}
              style={{
                border: "none",
                borderRadius: 999,
                background: "transparent",
                color: "rgba(255,255,255,0.6)",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
              title="Reset macro mode to Layer"
            >
              Reset
            </button>
            <span
              style={{
                color: "rgba(255,255,255,0.48)",
                fontSize: 10,
                padding: "0 6px 0 2px",
                letterSpacing: 0.2,
                userSelect: "none",
              }}
              title="Keyboard shortcuts: L = Layer, R = Replace"
            >
              L/R + V/[ ]/D/T
            </span>
            <button
              type="button"
              onClick={() => {
                panelRef.current?.focus();
                setFxApplyHint("Panel focused. L/R shortcuts are now active.");
              }}
              style={{
                border: "none",
                borderRadius: 999,
                background: panelHasFocus
                  ? "rgba(0,255,136,0.16)"
                  : "transparent",
                color: panelHasFocus ? "#b7f7d3" : "rgba(255,255,255,0.62)",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
              title="Focus panel to use L/R shortcuts"
            >
              {panelHasFocus ? "Focused" : "Focus"}
            </button>
            <button
              type="button"
              onClick={() => setShowShortcutHelp((prev) => !prev)}
              style={{
                border: "none",
                borderRadius: 999,
                background: showShortcutHelp
                  ? "rgba(0,255,136,0.16)"
                  : "transparent",
                color: showShortcutHelp ? "#b7f7d3" : "rgba(255,255,255,0.62)",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
              title="Toggle shortcut cheatsheet"
            >
              ?
            </button>
            <button
              type="button"
              onClick={() => {
                setKeyboardModeEnabled((prev) => !prev);
                setFxApplyHint(
                  keyboardModeEnabled
                    ? "Keyboard mode disabled. Use panel controls with mouse."
                    : "Keyboard mode enabled. Shortcuts are active when focused.",
                );
              }}
              style={{
                border: "none",
                borderRadius: 999,
                background: keyboardModeEnabled
                  ? "rgba(0,255,136,0.16)"
                  : "transparent",
                color: keyboardModeEnabled
                  ? "#b7f7d3"
                  : "rgba(255,255,255,0.62)",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
              title="Toggle panel keyboard shortcuts"
            >
              {keyboardModeEnabled ? "Keys On" : "Keys Off"}
            </button>
            <button
              type="button"
              onClick={() => {
                setKeyboardModeEnabled(true);
                setShowShortcutHelp(false);
                setPatternPreviewMode(true);
                setMacroApplyMode("layer");
                setPendingPatternTool(null);
                setFxApplyHint(
                  "Workspace shortcuts reset: Keys On, Help Closed, Preview On, Macro Layer.",
                );
              }}
              style={{
                border: "none",
                borderRadius: 999,
                background: "transparent",
                color: "rgba(255,255,255,0.62)",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
              title="Reset shortcut-related workspace preferences"
            >
              Reset Shortcuts
            </button>
          </div>

          {showShortcutHelp && (
            <div
              style={{
                border: "1px solid rgba(0,255,136,0.28)",
                background: "rgba(0,255,136,0.08)",
                borderRadius: 10,
                padding: "8px 10px",
                display: "grid",
                gap: 4,
                minWidth: 230,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 0.8,
                  color: "#b7f7d3",
                  fontWeight: 700,
                }}
              >
                SHORTCUTS
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 10 }}>
                L: Macro mode Layer
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 10 }}>
                R: Macro mode Replace
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 10 }}>
                V: Pattern Reverse
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 10 }}>
                [: Pattern Slow x2
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 10 }}>
                ]: Pattern Fast x2
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 10 }}>
                D: Pattern Density x2
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 10 }}>
                T: Pattern Stutter
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 10 }}>
                Shift+S: Save custom profile
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 10 }}>
                Shift+O: Load custom profile
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>
                Press ? to toggle this panel.
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>
                Keyboard mode: {keyboardModeEnabled ? "On" : "Off"}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 4,
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999,
              padding: 3,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            {SHORTCUT_PROFILES.map((profile) => {
              const active = activeShortcutProfileId === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => applyShortcutProfile(profile.id)}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    background: active ? "rgba(0,255,136,0.18)" : "transparent",
                    color: active ? "#bcffe0" : "rgba(255,255,255,0.7)",
                    fontSize: 10,
                    padding: "3px 8px",
                    cursor: "pointer",
                  }}
                  title={`Apply ${profile.label} shortcut profile`}
                >
                  {profile.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                if (selectedCustomShortcutProfileId) {
                  loadCustomShortcutProfile();
                  return;
                }
                setFxApplyHint("Select a custom profile first.");
              }}
              disabled={!selectedCustomShortcutProfile}
              style={{
                border: "none",
                borderRadius: 999,
                background: isCustomShortcutProfileActive
                  ? "rgba(0,255,136,0.18)"
                  : "transparent",
                color: isCustomShortcutProfileActive
                  ? "#b7f7d3"
                  : selectedCustomShortcutProfile
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.35)",
                fontSize: 10,
                padding: "3px 8px",
                cursor: selectedCustomShortcutProfile
                  ? "pointer"
                  : "not-allowed",
              }}
              title={
                selectedCustomShortcutProfile
                  ? `Load selected profile: ${selectedCustomShortcutProfile.name}`
                  : "Save and select a custom profile first"
              }
            >
              {selectedCustomShortcutProfile
                ? selectedCustomShortcutProfile.name
                : "Custom"}
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(120px,1fr) minmax(120px,1fr)",
              gap: 6,
            }}
          >
            <select
              aria-label="Custom profile list"
              value={selectedCustomShortcutProfileId ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                if (!value) {
                  setSelectedCustomShortcutProfileId(null);
                  setCustomShortcutProfileName("My Workflow");
                  return;
                }
                setSelectedCustomShortcutProfileId(value);
                const selected = customShortcutProfiles.find(
                  (profile) => profile.id === value,
                );
                if (selected) {
                  setCustomShortcutProfileName(selected.name);
                }
              }}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                color: "#d7e8fb",
                fontSize: 11,
                padding: "6px 8px",
              }}
            >
              {customShortcutProfiles.length === 0 && (
                <option value="">No custom profiles</option>
              )}
              {customShortcutProfiles.length > 0 && (
                <option value="">New profile slot</option>
              )}
              {customShortcutProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            <input
              value={customShortcutProfileName}
              onChange={(event) =>
                setCustomShortcutProfileName(event.target.value)
              }
              placeholder="Profile name"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                color: "#d7e8fb",
                fontSize: 10,
                padding: "5px 7px",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={saveCustomShortcutProfile}
              disabled={!hasCustomShortcutUnsavedChanges}
              style={{
                border: "1px solid rgba(0,255,136,0.34)",
                borderRadius: 8,
                background: hasCustomShortcutUnsavedChanges
                  ? "rgba(0,255,136,0.1)"
                  : "rgba(255,255,255,0.04)",
                color: hasCustomShortcutUnsavedChanges
                  ? "#b6ffdb"
                  : "rgba(255,255,255,0.35)",
                fontSize: 10,
                padding: "5px 8px",
                cursor: hasCustomShortcutUnsavedChanges
                  ? "pointer"
                  : "not-allowed",
                whiteSpace: "nowrap",
              }}
              title={
                hasCustomShortcutUnsavedChanges
                  ? "Save current shortcut setup"
                  : "No new changes to save"
              }
            >
              Save Current
            </button>
            <button
              type="button"
              onClick={loadCustomShortcutProfile}
              disabled={
                !selectedCustomShortcutProfile || isCustomShortcutProfileActive
              }
              style={{
                border: "1px solid rgba(0,255,136,0.3)",
                borderRadius: 8,
                background:
                  !selectedCustomShortcutProfile ||
                  isCustomShortcutProfileActive
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,255,136,0.1)",
                color:
                  !selectedCustomShortcutProfile ||
                  isCustomShortcutProfileActive
                    ? "rgba(255,255,255,0.35)"
                    : "#b7f7d3",
                fontSize: 10,
                padding: "5px 8px",
                cursor:
                  !selectedCustomShortcutProfile ||
                  isCustomShortcutProfileActive
                    ? "not-allowed"
                    : "pointer",
                whiteSpace: "nowrap",
              }}
              title="Restore saved custom shortcut profile"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => moveSelectedCustomShortcutProfile("up")}
              disabled={selectedCustomShortcutProfileIndex <= 0}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                color:
                  selectedCustomShortcutProfileIndex <= 0
                    ? "rgba(255,255,255,0.35)"
                    : "#d6deea",
                fontSize: 10,
                padding: "5px 8px",
                cursor:
                  selectedCustomShortcutProfileIndex <= 0
                    ? "not-allowed"
                    : "pointer",
                whiteSpace: "nowrap",
              }}
              title="Move selected profile up"
            >
              Up
            </button>
            <button
              type="button"
              onClick={() => moveSelectedCustomShortcutProfile("down")}
              disabled={
                selectedCustomShortcutProfileIndex < 0 ||
                selectedCustomShortcutProfileIndex >=
                  customShortcutProfiles.length - 1
              }
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                color:
                  selectedCustomShortcutProfileIndex < 0 ||
                  selectedCustomShortcutProfileIndex >=
                    customShortcutProfiles.length - 1
                    ? "rgba(255,255,255,0.35)"
                    : "#d6deea",
                fontSize: 10,
                padding: "5px 8px",
                cursor:
                  selectedCustomShortcutProfileIndex < 0 ||
                  selectedCustomShortcutProfileIndex >=
                    customShortcutProfiles.length - 1
                    ? "not-allowed"
                    : "pointer",
                whiteSpace: "nowrap",
              }}
              title="Move selected profile down"
            >
              Down
            </button>
            <button
              type="button"
              onClick={deleteCustomShortcutProfile}
              disabled={!selectedCustomShortcutProfile}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                color: selectedCustomShortcutProfile
                  ? "#d6deea"
                  : "rgba(255,255,255,0.35)",
                fontSize: 10,
                padding: "5px 8px",
                cursor: selectedCustomShortcutProfile
                  ? "pointer"
                  : "not-allowed",
                whiteSpace: "nowrap",
              }}
              title="Delete selected custom shortcut profile"
            >
              Delete
            </button>
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.58)",
              fontSize: 10,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {selectedCustomShortcutProfile
              ? hasCustomShortcutUnsavedChanges
                ? `Selected profile: ${selectedCustomShortcutProfile.name} (unsaved changes)`
                : `Selected profile: ${selectedCustomShortcutProfile.name}`
              : customShortcutProfiles.length > 0
                ? "Choose a profile from the list or select New profile slot."
                : "Save the current shortcut setup as your first custom profile."}
          </div>

          <div
            style={{
              display: "grid",
              gap: 6,
              paddingTop: 4,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <textarea
              aria-label="Profile JSON buffer"
              value={profileJsonBuffer}
              onChange={(event) => setProfileJsonBuffer(event.target.value)}
              placeholder="Paste exported profile JSON here"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                color: "#d7e8fb",
                fontSize: 10,
                minHeight: 72,
                padding: "7px 8px",
                fontFamily: '"JetBrains Mono", monospace',
                resize: "vertical",
              }}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  void exportCustomShortcutProfiles();
                }}
                style={{
                  border: "1px solid rgba(0,255,136,0.3)",
                  borderRadius: 8,
                  background: "rgba(0,255,136,0.1)",
                  color: "#b7f7d3",
                  fontSize: 11,
                  padding: "6px 10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Export all custom profiles as JSON"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={downloadCustomShortcutProfiles}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  color: "#d6deea",
                  fontSize: 11,
                  padding: "6px 10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Download custom profiles as JSON file"
              >
                Download File
              </button>
              <button
                type="button"
                onClick={() => importCustomShortcutProfiles("merge")}
                disabled={profileJsonBuffer.trim().length === 0}
                style={{
                  border: "1px solid rgba(0,255,136,0.34)",
                  borderRadius: 8,
                  background:
                    profileJsonBuffer.trim().length > 0
                      ? "rgba(0,255,136,0.1)"
                      : "rgba(255,255,255,0.04)",
                  color:
                    profileJsonBuffer.trim().length > 0
                      ? "#b6ffdb"
                      : "rgba(255,255,255,0.35)",
                  fontSize: 11,
                  padding: "6px 10px",
                  cursor:
                    profileJsonBuffer.trim().length > 0
                      ? "pointer"
                      : "not-allowed",
                  whiteSpace: "nowrap",
                }}
                title="Import profiles and append to current list"
              >
                Import Merge
              </button>
              <button
                type="button"
                onClick={() => importCustomShortcutProfiles("replace")}
                disabled={profileJsonBuffer.trim().length === 0}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background:
                    profileJsonBuffer.trim().length > 0
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.04)",
                  color:
                    profileJsonBuffer.trim().length > 0
                      ? "#d6deea"
                      : "rgba(255,255,255,0.35)",
                  fontSize: 11,
                  padding: "6px 10px",
                  cursor:
                    profileJsonBuffer.trim().length > 0
                      ? "pointer"
                      : "not-allowed",
                  whiteSpace: "nowrap",
                }}
                title="Replace current custom profile list with imported JSON"
              >
                Import Replace
              </button>
              <button
                type="button"
                onClick={() => triggerFileImport("merge")}
                style={{
                  border: "1px solid rgba(0,255,136,0.34)",
                  borderRadius: 8,
                  background: "rgba(0,255,136,0.08)",
                  color: "#b6ffdb",
                  fontSize: 11,
                  padding: "6px 10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Import profiles from file and merge"
              >
                Import File Merge
              </button>
              <button
                type="button"
                onClick={() => triggerFileImport("replace")}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  color: "#d6deea",
                  fontSize: 11,
                  padding: "6px 10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Import profiles from file and replace current list"
              >
                Import File Replace
              </button>
              <button
                type="button"
                onClick={() => setProfileJsonBuffer("")}
                disabled={profileJsonBuffer.length === 0}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  color:
                    profileJsonBuffer.length > 0
                      ? "#d6deea"
                      : "rgba(255,255,255,0.35)",
                  fontSize: 11,
                  padding: "6px 10px",
                  cursor:
                    profileJsonBuffer.length > 0 ? "pointer" : "not-allowed",
                  whiteSpace: "nowrap",
                }}
                title="Clear profile JSON buffer"
              >
                Clear Buffer
              </button>
              <input
                ref={profileFileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  void handleProfileFileImport(event);
                }}
                aria-label="Import profile JSON file"
                style={{ display: "none" }}
              />
            </div>
          </div>

          {SYNTH_FX_MACROS.map((macro) => (
            <div key={macro.id} style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                onClick={() => onInsertCode(macro.snippet)}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d6deea",
                  fontSize: 10,
                  padding: "4px 9px",
                  cursor: "pointer",
                }}
                title={macro.description}
              >
                {macro.label}
              </button>
              <button
                type="button"
                onClick={() => {
                  const result = onApplyMacroToSelection(
                    macro.snippet,
                    macroApplyMode,
                  );
                  if (result === "selection") {
                    if (macroApplyMode === "replace") {
                      setFxApplyHint(
                        `Replaced selection with ${macro.label} macro.`,
                      );
                    } else {
                      setFxApplyHint(`Layered ${macro.label} onto selection.`);
                    }
                    return;
                  }
                  if (result === "document") {
                    if (macroApplyMode === "replace") {
                      setFxApplyHint(
                        `No selection found. Replaced full document with ${macro.label} macro.`,
                      );
                    } else {
                      setFxApplyHint(
                        `No selection found. Layered ${macro.label} onto full document.`,
                      );
                    }
                    return;
                  }
                  setFxApplyHint(
                    "Editor is not ready yet. Try again in a moment.",
                  );
                }}
                style={{
                  border: "1px solid rgba(0,255,136,0.35)",
                  borderRadius: 999,
                  background: "rgba(0,255,136,0.11)",
                  color: "#b7f7d3",
                  fontSize: 10,
                  padding: "4px 9px",
                  cursor: "pointer",
                }}
                title="Layer this macro with current selection"
              >
                +Sel
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 6,
            paddingTop: 8,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1,
                color: "rgba(255,255,255,0.56)",
              }}
            >
              PATTERN TOOLS
            </div>
            <button
              type="button"
              onClick={() => {
                setPatternPreviewMode((prev) => {
                  const next = !prev;
                  if (!next) {
                    setPendingPatternTool(null);
                  }
                  return next;
                });
              }}
              style={{
                marginLeft: "auto",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                background: patternPreviewMode
                  ? "rgba(0,255,136,0.12)"
                  : "rgba(255,255,255,0.04)",
                color: patternPreviewMode ? "#b7f7d3" : "#d6deea",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
              title="Toggle preview-before-apply for pattern tools"
            >
              {patternPreviewMode ? "Preview On" : "Preview Off"}
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button
              type="button"
              onClick={() => handlePatternTool("reverse")}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                color: "#d6deea",
                fontSize: 10,
                padding: "4px 9px",
                cursor: "pointer",
              }}
            >
              Reverse
            </button>
            <button
              type="button"
              onClick={() => handlePatternTool("slow2")}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                color: "#d6deea",
                fontSize: 10,
                padding: "4px 9px",
                cursor: "pointer",
              }}
            >
              Slow x2
            </button>
            <button
              type="button"
              onClick={() => handlePatternTool("fast2")}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                color: "#d6deea",
                fontSize: 10,
                padding: "4px 9px",
                cursor: "pointer",
              }}
            >
              Fast x2
            </button>
            <button
              type="button"
              onClick={() => handlePatternTool("density2")}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                color: "#d6deea",
                fontSize: 10,
                padding: "4px 9px",
                cursor: "pointer",
              }}
            >
              Density x2
            </button>
            <button
              type="button"
              onClick={() => handlePatternTool("stutter")}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                color: "#d6deea",
                fontSize: 10,
                padding: "4px 9px",
                cursor: "pointer",
              }}
            >
              Stutter
            </button>
          </div>

          {patternPreviewMode && pendingPatternTool && (
            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  color: "rgba(255,255,255,0.53)",
                  fontSize: 10,
                  fontFamily: '"JetBrains Mono", monospace',
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "6px 8px",
                  overflow: "auto",
                }}
              >
                {PATTERN_TOOL_META[pendingPatternTool].preview}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    const tool = pendingPatternTool;
                    if (!tool) return;
                    applyPatternToolNow(tool, PATTERN_TOOL_META[tool].label);
                    setPendingPatternTool(null);
                  }}
                  style={{
                    border: "1px solid rgba(0,255,136,0.35)",
                    borderRadius: 8,
                    background: "rgba(0,255,136,0.11)",
                    color: "#b7f7d3",
                    fontSize: 10,
                    padding: "5px 8px",
                    cursor: "pointer",
                  }}
                >
                  Apply Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingPatternTool(null);
                    setFxApplyHint("Pattern tool preview cleared.");
                  }}
                  style={{
                    border: "1px solid rgba(255,255,255,0.22)",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.05)",
                    color: "#d6deea",
                    fontSize: 10,
                    padding: "5px 8px",
                    cursor: "pointer",
                  }}
                >
                  Clear Preview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "10px 12px 12px",
          display: "grid",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setSourcesSectionOpen((prev) => !prev)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.56)",
            }}
          >
            CUSTOM SAMPLE SOURCES
          </span>
          <span style={{ color: "rgba(255,255,255,0.56)", fontSize: 12 }}>
            {sourcesSectionOpen ? "-" : "+"}
          </span>
        </button>

        {sourcesSectionOpen && (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <input
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
                placeholder="Source name"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
              />
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="github:user/repo or https://.../strudel.json"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#d7e8fb",
                  fontSize: 11,
                  padding: "6px 8px",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    onAddSource(sourceName, sourceUrl);
                    setSourceError(null);
                    setSourceName("");
                    setSourceUrl("");
                  } catch (error) {
                    setSourceError(
                      error instanceof Error
                        ? error.message
                        : "Failed to add source.",
                    );
                  }
                }}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  color: "#f0f4f9",
                  fontSize: 10,
                  padding: "6px 8px",
                  cursor: "pointer",
                }}
              >
                Add Source
              </button>
              {sourceError && (
                <div style={{ color: "#ff9fb3", fontSize: 11 }}>
                  {sourceError}
                </div>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gap: 6,
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              {customSources.map((source) => {
                const status = auditionStatusById[source.id] ?? "idle";
                const badge = badgeStyle(status);
                return (
                  <div
                    key={source.id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      padding: "7px 8px",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <strong style={{ color: "#d8e8f7", fontSize: 11 }}>
                        {source.name}
                      </strong>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 10,
                          borderRadius: 999,
                          padding: "2px 7px",
                          ...badge,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.52)",
                        fontSize: 10,
                        wordBreak: "break-all",
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    >
                      {source.url}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => onToggleSource(source.id)}
                        style={{
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 6,
                          background: source.enabled
                            ? "rgba(0,255,136,0.11)"
                            : "rgba(255,255,255,0.05)",
                          color: source.enabled ? "#b8ffde" : "#d3d9e3",
                          fontSize: 10,
                          padding: "4px 7px",
                          cursor: "pointer",
                        }}
                      >
                        {source.enabled ? "Enabled" : "Disabled"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onInsertCode(buildSourceInsertSnippet(source))
                        }
                        style={{
                          border: "1px solid rgba(0,255,136,0.35)",
                          borderRadius: 6,
                          background: "rgba(0,255,136,0.11)",
                          color: "#b7f7d3",
                          fontSize: 10,
                          padding: "4px 7px",
                          cursor: "pointer",
                        }}
                      >
                        Insert Loader
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleSourceLoad(source);
                        }}
                        style={{
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 6,
                          background: "rgba(255,255,255,0.06)",
                          color: "#e5ecf4",
                          fontSize: 10,
                          padding: "4px 7px",
                          cursor: "pointer",
                        }}
                      >
                        Load Now
                      </button>
                      {!LOCKED_SOURCE_IDS.has(source.id) && (
                        <button
                          type="button"
                          onClick={() => onRemoveSource(source.id)}
                          style={{
                            border: "1px solid rgba(255,159,179,0.3)",
                            borderRadius: 6,
                            background: "rgba(255,159,179,0.1)",
                            color: "#ffb7c6",
                            fontSize: 10,
                            padding: "4px 7px",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>
                Enabled sources:{" "}
                {customSources.filter((source) => source.enabled).length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
