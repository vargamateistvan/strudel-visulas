import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { type StrudelStatus } from "../hooks/useStrudel";
import {
  type EditorColorPreset,
  type EditorFontPreset,
} from "./SettingsDrawer";
import {
  STRUDEL_LANGUAGE_ID,
  STRUDEL_MARKER_OWNER,
  createStrudelDecorations,
  createStrudelLocationDecorations,
  createStrudelMarkers,
  registerStrudelLanguage,
  type SourceLocationRange,
} from "./editor/StrudelEditorLanguage";
import { EditorChrome } from "./editor/EditorChrome";
import { EditorToolbar } from "./editor/EditorToolbar";
import { EditorStatusPills } from "./editor/EditorStatusPills";
import { LoadingOverlay } from "./LoadingOverlay";
import "@fontsource/jetbrains-mono";
import "@fontsource/bitcount-single";
import "@fontsource/doto";
import "@fontsource/fira-code";

interface StrudelEditorProps {
  code: string;
  play: (code: string) => Promise<void>;
  stop: () => void;
  status: StrudelStatus;
  error: string | null;
  loadMsg: string;
  opacity: number;
  colorPreset: EditorColorPreset;
  fontPreset: EditorFontPreset;
  fontSize: number;
  livePulseStrip: boolean;
  livePlayingNoteHighlights: boolean;
  activeNote: string | null;
  activeNotes?: string[];
  activeMiniLocations?: SourceLocationRange[];
  onCodeChange?: (code: string) => void;
}

type ThemeTokens = {
  border: string;
  glow: string;
  text: string;
  caret: string;
  comment: string;
  string: string;
  number: string;
  keyword: string;
  ident: string;
  background: string;
};

const EDITOR_HIGHLIGHT_STYLE_ID = "strudel-editor-highlight-styles";
const EDITOR_NOTE_HIT_CLASS = "strudel-note-hit";
const EDITOR_NOTE_HIT_ACTIVE_CLASS = "strudel-note-hit-active";
const EDITOR_HIGHLIGHT_MIN_INTERVAL_MS = 50;

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const parsed = Number.parseInt(normalized, 16);
  const red = (parsed >> 16) & 255;
  const green = (parsed >> 8) & 255;
  const blue = parsed & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function hexToAlphaHex(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const alphaByte = Math.round(clampedAlpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${normalized}${alphaByte}`;
}

const EDITOR_THEME: Record<EditorColorPreset, ThemeTokens> = {
  neon: {
    border: "rgba(0,255,136,0.22)",
    glow: "rgba(0,255,136,0.12)",
    text: "#c8ffd8",
    caret: "#00ff88",
    comment: "#7ea49b",
    string: "#b7f7d3",
    number: "#f3d17a",
    keyword: "#7ae6ff",
    ident: "#c8ffd8",
    background: "#070b12",
  },
  amber: {
    border: "rgba(255,179,71,0.24)",
    glow: "rgba(255,179,71,0.12)",
    text: "#ffe8c1",
    caret: "#ffb347",
    comment: "#b09a72",
    string: "#ffdca8",
    number: "#fff07a",
    keyword: "#ffca7a",
    ident: "#ffe8c1",
    background: "#100b06",
  },
  ice: {
    border: "rgba(102,224,255,0.24)",
    glow: "rgba(102,224,255,0.12)",
    text: "#d7f8ff",
    caret: "#66e0ff",
    comment: "#8aa7b4",
    string: "#c8f6ff",
    number: "#ffe3a4",
    keyword: "#7dd8ff",
    ident: "#d7f8ff",
    background: "#061019",
  },
  mono: {
    border: "rgba(192,199,209,0.24)",
    glow: "rgba(192,199,209,0.12)",
    text: "#e1e8f0",
    caret: "#c0c7d1",
    comment: "#93a0af",
    string: "#dfe5ee",
    number: "#c8d0dc",
    keyword: "#e2e7ef",
    ident: "#e1e8f0",
    background: "#0b1017",
  },
};

const EDITOR_FONT_FAMILY: Record<EditorFontPreset, string> = {
  jetbrainsMono: '"JetBrains Mono",ui-monospace,monospace',
  bitcountSingle: '"Bitcount Single",ui-monospace,monospace',
  doto: '"Doto",ui-monospace,monospace',
  firaCode: '"Fira Code",ui-monospace,monospace',
};

const SNIPPETS = {
  "Basic Beat":
    'stack(\n  sound("bd ~ bd ~"),\n  sound("~ sn ~ sn"),\n  sound("hh*8").gain(0.5)\n).cpm(120)',
  "Ambient Chords":
    'stack(\n  note("c3 eb3 g3 bb3").sound("triangle").slow(2).gain(0.35),\n  note("c4 g4 eb4").sound("sawtooth").delay(0.4).gain(0.2)\n).cpm(72)',
  "Bass Pulse":
    'stack(\n  note("c2 ~ c2 ~ g1 ~ c2 ~").sound("square").lpf(180).gain(0.42),\n  sound("bd ~ ~ bd").gain(0.7)\n).cpm(96)',
  "Drum Grid":
    'stack(\n  sound("bd ~ bd ~ bd ~ bd ~"),\n  sound("~ sn ~ sn ~ sn ~ sn").gain(0.85),\n  sound("hh*16").gain(0.45)\n).cpm(132)',
  "Chord Bloom":
    'stack(\n  note("c3 eb3 g3 bb3").sound("triangle").slow(2).room(0.2).size(0.6),\n  note("f3 a3 c4 eb4").sound("sine").slow(4).gain(0.25)\n).cpm(68)',
} as const;

function buildMonacoTheme(
  theme: ThemeTokens,
  editorBackground: string,
): Monaco.editor.IStandaloneThemeData {
  return {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: theme.comment.replace("#", "") },
      { token: "string", foreground: theme.string.replace("#", "") },
      { token: "number", foreground: theme.number.replace("#", "") },
      { token: "keyword", foreground: theme.keyword.replace("#", "") },
      { token: "identifier", foreground: theme.ident.replace("#", "") },
    ],
    colors: {
      "editor.background": editorBackground,
      "editor.foreground": theme.text,
      "editorCursor.foreground": theme.caret,
      "editor.lineHighlightBackground": "#ffffff08",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": `${theme.caret}33`,
      "editor.selectionHighlightBackground": `${theme.caret}22`,
      "editor.inactiveSelectionBackground": "#ffffff14",
      "editorIndentGuide.background1": "#ffffff12",
      "editorIndentGuide.activeBackground1": "#ffffff28",
      "editorWhitespace.foreground": "#ffffff18",
      "editorBracketMatch.background": "#ffffff12",
      "editorBracketMatch.border": theme.caret,
      "scrollbarSlider.background": "#ffffff26",
      "scrollbarSlider.hoverBackground": "#ffffff42",
      "scrollbarSlider.activeBackground": "#ffffff58",
      "minimap.selectionHighlight": `${theme.caret}66`,
      "minimap.findMatchHighlight": "#ffd166aa",
      "minimap.background": "#00000000",
    },
  };
}

export const StrudelEditor: React.FC<StrudelEditorProps> = ({
  code,
  play,
  stop,
  status,
  error,
  loadMsg,
  opacity,
  colorPreset,
  fontPreset,
  fontSize,
  livePulseStrip,
  livePlayingNoteHighlights,
  activeNote,
  activeNotes,
  activeMiniLocations,
  onCodeChange,
}) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const languageDisposablesRef = useRef<Monaco.IDisposable[]>([]);
  const contentListenerRef = useRef<Monaco.IDisposable | null>(null);
  const noteDecorationsRef =
    useRef<Monaco.editor.IEditorDecorationsCollection | null>(null);
  const noteHighlightStyleRef = useRef<HTMLStyleElement | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const lastHighlightUpdateRef = useRef(0);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const liveEditErrorPrefix = "Live edit error:";
  const isLiveEditError = Boolean(error?.startsWith(liveEditErrorPrefix));
  const liveEditError = isLiveEditError
    ? (error?.slice(liveEditErrorPrefix.length).trim() ?? "")
    : null;

  const themeTokens = EDITOR_THEME[colorPreset];
  const monacoThemeName = useMemo(
    () => `strudel-${colorPreset}`,
    [colorPreset],
  );
  const editorFontFamily =
    EDITOR_FONT_FAMILY[fontPreset] ?? EDITOR_FONT_FAMILY.jetbrainsMono;
  const editorFontSize = Math.max(11, Math.min(22, Math.round(fontSize)));
  const editorBackground = hexToRgba(
    themeTokens.background,
    Math.max(0.38, opacity),
  );
  const monacoBackground = hexToAlphaHex(
    themeTokens.background,
    Math.max(0.38, opacity),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (isPlaying) {
          stop();
        } else {
          void play(code);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [code, isPlaying, play, stop]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    monaco.editor.defineTheme(
      monacoThemeName,
      buildMonacoTheme(themeTokens, monacoBackground),
    );
    monaco.editor.setTheme(monacoThemeName);
  }, [monacoBackground, monacoThemeName, themeTokens]);

  useEffect(() => {
    const styleId = EDITOR_HIGHLIGHT_STYLE_ID;
    let style = noteHighlightStyleRef.current;
    if (!style) {
      style = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }
      noteHighlightStyleRef.current = style;
    }

    style.textContent = `
      .${EDITOR_NOTE_HIT_CLASS} {
        background: ${hexToRgba(themeTokens.caret, 0.22)};
        border-radius: 3px;
        box-shadow: inset 0 -1px 0 ${hexToRgba(themeTokens.caret, 0.42)};
      }

      .${EDITOR_NOTE_HIT_ACTIVE_CLASS} {
        background: ${hexToRgba(themeTokens.caret, 0.34)};
        border-radius: 3px;
        box-shadow: inset 0 -1px 0 ${hexToRgba(themeTokens.caret, 0.75)};
      }
    `;

    return () => {
      const currentStyle = noteHighlightStyleRef.current;
      if (currentStyle?.parentNode) {
        currentStyle.parentNode.removeChild(currentStyle);
      }
      noteHighlightStyleRef.current = null;
    };
  }, [themeTokens.caret]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.updateOptions({
      fontFamily: editorFontFamily,
      fontSize: editorFontSize,
    });
  }, [editorFontFamily, editorFontSize]);

  useEffect(
    () => () => {
      contentListenerRef.current?.dispose();
      contentListenerRef.current = null;
      noteDecorationsRef.current?.clear();
      noteDecorationsRef.current = null;
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
      languageDisposablesRef.current.forEach((d) => d.dispose());
      languageDisposablesRef.current = [];
      const model = editorRef.current?.getModel();
      if (model) {
        monacoRef.current?.editor.setModelMarkers(
          model,
          STRUDEL_MARKER_OWNER,
          [],
        );
      }
    },
    [],
  );

  const updateDiagnostics = useCallback(
    (
      source: string,
      model: Monaco.editor.ITextModel,
      monaco: typeof Monaco,
    ) => {
      monaco.editor.setModelMarkers(
        model,
        STRUDEL_MARKER_OWNER,
        createStrudelMarkers(source, monaco),
      );
    },
    [],
  );

  const updateActiveHighlights = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const source = model.getValue();
    const locationDecorations = createStrudelLocationDecorations(
      source,
      activeMiniLocations ?? [],
      monaco,
      true,
    );

    const activeTokens =
      activeNotes && activeNotes.length > 0
        ? activeNotes
        : activeNote
          ? [activeNote]
          : [];

    if (
      !livePlayingNoteHighlights ||
      status !== "playing" ||
      (locationDecorations.length === 0 && activeTokens.length === 0)
    ) {
      noteDecorationsRef.current?.clear();
      return;
    }

    const decorations =
      locationDecorations.length > 0
        ? locationDecorations
        : createStrudelDecorations(source, activeTokens, monaco, true);

    if (!noteDecorationsRef.current) {
      noteDecorationsRef.current =
        editor.createDecorationsCollection(decorations);
      return;
    }

    noteDecorationsRef.current.set(decorations);
  }, [
    activeMiniLocations,
    activeNote,
    activeNotes,
    livePlayingNoteHighlights,
    status,
  ]);

  const scheduleActiveHighlights = useCallback(
    (immediate = false) => {
      if (immediate) {
        if (highlightTimerRef.current !== null) {
          window.clearTimeout(highlightTimerRef.current);
          highlightTimerRef.current = null;
        }
        lastHighlightUpdateRef.current = performance.now();
        updateActiveHighlights();
        return;
      }

      const now = performance.now();
      const elapsed = now - lastHighlightUpdateRef.current;
      const wait = Math.max(0, EDITOR_HIGHLIGHT_MIN_INTERVAL_MS - elapsed);

      if (wait === 0 && highlightTimerRef.current === null) {
        lastHighlightUpdateRef.current = now;
        updateActiveHighlights();
        return;
      }

      if (highlightTimerRef.current !== null) {
        return;
      }

      highlightTimerRef.current = window.setTimeout(() => {
        highlightTimerRef.current = null;
        lastHighlightUpdateRef.current = performance.now();
        updateActiveHighlights();
      }, wait);
    },
    [updateActiveHighlights],
  );

  useEffect(() => {
    const isLiveActive =
      livePlayingNoteHighlights &&
      status === "playing" &&
      ((activeMiniLocations && activeMiniLocations.length > 0) ||
        (activeNotes && activeNotes.length > 0) ||
        Boolean(activeNote));

    if (!isLiveActive) {
      scheduleActiveHighlights(true);
      return;
    }

    scheduleActiveHighlights();
  }, [
    activeMiniLocations,
    activeNote,
    activeNotes,
    code,
    livePlayingNoteHighlights,
    scheduleActiveHighlights,
    status,
  ]);

  const insertSnippet = useCallback((name: keyof typeof SNIPPETS) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor) return;
    const model = editor.getModel();
    const position = editor.getPosition();
    if (!model || !position || !monaco) return;

    const snippet = `\n\n${SNIPPETS[name]}`;
    editor.executeEdits("strudel-snippet", [
      {
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        ),
        text: snippet,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  }, []);

  const applySelectionTransform = useCallback(
    (transform: (source: string) => string) => {
      const editor = editorRef.current;
      if (!editor) return;

      const model = editor.getModel();
      if (!model) return;

      const selection = editor.getSelection();
      const fullRange = model.getFullModelRange();
      const selectedText =
        selection && !selection.isEmpty()
          ? model.getValueInRange(selection)
          : model.getValue();

      const nextText = transform(selectedText);
      editor.executeEdits("strudel-transform", [
        {
          range: selection && !selection.isEmpty() ? selection : fullRange,
          text: nextText,
          forceMoveMarkers: true,
        },
      ]);
      editor.focus();
    },
    [],
  );

  const wrapInRev = useCallback(() => {
    applySelectionTransform((source) => `(${source}).rev`);
  }, [applySelectionTransform]);

  const wrapInGain = useCallback(() => {
    applySelectionTransform((source) => `(${source}).gain(0.8)`);
  }, [applySelectionTransform]);

  const duplicateInStack = useCallback(() => {
    applySelectionTransform((source) => `stack(${source}, ${source})`);
  }, [applySelectionTransform]);

  const handleMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      if (languageDisposablesRef.current.length === 0) {
        languageDisposablesRef.current = registerStrudelLanguage(monaco);
      }

      monaco.editor.defineTheme(
        monacoThemeName,
        buildMonacoTheme(themeTokens, monacoBackground),
      );
      monaco.editor.setTheme(monacoThemeName);

      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, STRUDEL_LANGUAGE_ID);
        updateDiagnostics(model.getValue(), model, monaco);
        scheduleActiveHighlights(true);
        contentListenerRef.current?.dispose();
        contentListenerRef.current = model.onDidChangeContent(() => {
          updateDiagnostics(model.getValue(), model, monaco);
          scheduleActiveHighlights();
        });
      }

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (isPlaying) {
          stop();
        } else {
          void play(editor.getValue());
        }
      });

      editor.addAction({
        id: "strudel-insert-basic-beat",
        label: "Strudel: Insert Basic Beat",
        run: () => {
          insertSnippet("Basic Beat");
        },
      });

      editor.addAction({
        id: "strudel-insert-ambient",
        label: "Strudel: Insert Ambient Chords",
        run: () => {
          insertSnippet("Ambient Chords");
        },
      });

      editor.addAction({
        id: "strudel-wrap-rev",
        label: "Strudel: Wrap in rev",
        run: () => {
          wrapInRev();
        },
      });

      editor.addAction({
        id: "strudel-wrap-gain",
        label: "Strudel: Wrap in gain(0.8)",
        run: () => {
          wrapInGain();
        },
      });

      editor.addAction({
        id: "strudel-stack-duplicate",
        label: "Strudel: Duplicate in stack",
        run: () => {
          duplicateInStack();
        },
      });
    },
    [
      duplicateInStack,
      insertSnippet,
      isPlaying,
      monacoBackground,
      monacoThemeName,
      play,
      stop,
      themeTokens,
      updateDiagnostics,
      scheduleActiveHighlights,
      wrapInGain,
      wrapInRev,
    ],
  );

  const formatCode = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const action = editor.getAction("editor.action.formatDocument");
    if (action) {
      void action.run();
    }
  }, []);

  const statusPills = useMemo(() => {
    if (!livePulseStrip) {
      return [];
    }

    const pills: Array<{ label: string; value: string; accent: string }> = [];
    if (status === "playing") {
      const nowPlaying =
        (activeNotes && activeNotes.length > 0 ? activeNotes[0] : activeNote) ??
        "live";
      pills.push({
        label: "Now playing",
        value: nowPlaying,
        accent: themeTokens.caret,
      });
    }
    return pills;
  }, [activeNote, activeNotes, livePulseStrip, status, themeTokens.caret]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: 10,
        overflow: "hidden",
        background: editorBackground,
        border: `1px solid ${themeTokens.border}`,
        boxShadow: `0 0 40px ${themeTokens.glow}, inset 0 0 30px rgba(0,0,0,0.2)`,
        backdropFilter: `blur(${Math.round(opacity * 16)}px)`,
      }}
    >
      {isLoading && <LoadingOverlay message={loadMsg} />}

      {error && !isLiveEditError && (
        <div
          style={{
            padding: "6px 14px",
            flexShrink: 0,
            background: "rgba(255,51,102,0.1)",
            borderBottom: "1px solid rgba(255,51,102,0.2)",
            fontSize: 11,
            fontFamily: editorFontFamily,
            color: "#ff3366",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      <EditorToolbar
        fontFamily={editorFontFamily}
        onFormat={formatCode}
        onWrapRev={wrapInRev}
        onWrapGain={wrapInGain}
        onDuplicateStack={duplicateInStack}
        onQuickActions={() =>
          editorRef.current?.getAction("editor.action.quickCommand")?.run()
        }
        onInsertBeat={() => insertSnippet("Basic Beat")}
        onInsertAmbient={() => insertSnippet("Ambient Chords")}
      />

      <Editor
        height="100%"
        language={STRUDEL_LANGUAGE_ID}
        value={code}
        theme={monacoThemeName}
        onMount={handleMount}
        onChange={(nextValue) => {
          onCodeChange?.(nextValue ?? "");
        }}
        options={{
          automaticLayout: true,
          minimap: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          fontFamily: editorFontFamily,
          fontSize: editorFontSize,
          lineHeight: Math.round(editorFontSize * 1.75),
          tabSize: 2,
          insertSpaces: true,
          wordWrap: "on",
          wrappingIndent: "indent",
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
          scrollBeyondLastLine: false,
          overviewRulerBorder: false,
          padding: { top: 42, bottom: 18 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            comments: false,
            strings: true,
            other: true,
          },
        }}
      />

      <EditorChrome
        fontFamily={editorFontFamily}
        liveEditError={liveEditError}
      />

      <EditorStatusPills pills={statusPills} fontFamily={editorFontFamily} />
    </div>
  );
};
