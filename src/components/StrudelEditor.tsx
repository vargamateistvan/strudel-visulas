import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { type StrudelStatus } from "../hooks/useStrudel";
import {
  type EditorColorPreset,
  type EditorFontPreset,
} from "./SettingsDrawer";
import { LoadingOverlay } from "./LoadingOverlay";
import "@fontsource/jetbrains-mono";
import "@fontsource/bitcount-single";
import "@fontsource/doto";
import "@fontsource/fira-code";

const STRUDEL_LANGUAGE_ID = "strudel";
const STRUDEL_MARKER_OWNER = "strudel-lint";

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
  activeNote: string | null;
  activeNotes?: string[];
  activeLiterals?: string[];
  activeControls?: string[];
  nPulse?: number;
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

const SNIPPETS: Record<string, string> = {
  "Basic Beat":
    'stack(\n  sound("bd ~ bd ~"),\n  sound("~ sn ~ sn"),\n  sound("hh*8").gain(0.5)\n).cpm(120)',
  "Ambient Chords":
    'stack(\n  note("c3 eb3 g3 bb3").sound("triangle").slow(2).gain(0.35),\n  note("c4 g4 eb4").sound("sawtooth").delay(0.4).gain(0.2)\n).cpm(72)',
};

const STRUDEL_GLOBALS = [
  "stack",
  "sound",
  "note",
  "n",
  "s",
  "samples",
  "cpm",
  "slow",
  "fast",
  "sometimesBy",
  "every",
  "jux",
  "rev",
  "hush",
  "silence",
  "rand",
  "range",
  "choose",
  "segment",
  "cat",
  "polyrhythm",
  "degradeBy",
  "off",
  "room",
  "size",
  "delay",
  "gain",
  "lpf",
  "hpf",
];

const STRUDEL_CHAIN_METHODS = [
  "gain",
  "pan",
  "speed",
  "slow",
  "fast",
  "every",
  "sometimes",
  "sometimesBy",
  "degradeBy",
  "jux",
  "rev",
  "room",
  "size",
  "delay",
  "lpf",
  "hpf",
  "shape",
  "clip",
  "coarse",
  "cpm",
  "legato",
  "vowel",
];

const FUNCTION_SIGNATURES: Record<string, string[]> = {
  stack: [
    "stack(pattern1, pattern2, ...)",
    "Layer multiple patterns together.",
  ],
  sound: ["sound(pattern)", 'Choose sample pattern, ex: sound("bd ~ sn ~").'],
  note: ["note(pattern)", "Create melodic pattern from note names."],
  cpm: ["cpm(value)", "Set cycles per minute for playback."],
  every: ["every(n, fn)", "Apply a transform every n cycles."],
  sometimesBy: [
    "sometimesBy(probability, fn)",
    "Apply transform probabilistically.",
  ],
  gain: ["gain(value)", "Adjust output amplitude."],
  delay: ["delay(value)", "Apply delay effect amount."],
};

function getLineAndColumnFromOffset(
  source: string,
  offset: number,
): {
  line: number;
  column: number;
} {
  const safeOffset = Math.max(0, Math.min(offset, source.length));
  const before = source.slice(0, safeOffset);
  const lines = before.split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function buildStrudelMarkers(
  source: string,
  monaco: typeof Monaco,
): Monaco.editor.IMarkerData[] {
  const markers: Monaco.editor.IMarkerData[] = [];
  const stack: Array<{ char: string; index: number }> = [];
  const openers: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const closers: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (openers[char]) {
      stack.push({ char, index: i });
      continue;
    }

    if (!closers[char]) {
      continue;
    }

    const top = stack.pop();
    if (!top || top.char !== closers[char]) {
      const { line, column } = getLineAndColumnFromOffset(source, i);
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: `Unexpected '${char}'.`,
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: column + 1,
      });
    }
  }

  while (stack.length > 0) {
    const unclosed = stack.pop();
    if (!unclosed) break;
    const { line, column } = getLineAndColumnFromOffset(source, unclosed.index);
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: `Missing closing '${openers[unclosed.char]}'.`,
      startLineNumber: line,
      startColumn: column,
      endLineNumber: line,
      endColumn: column + 1,
    });
  }

  if (source.includes("..")) {
    const idx = source.indexOf("..");
    const { line, column } = getLineAndColumnFromOffset(source, idx);
    markers.push({
      severity: monaco.MarkerSeverity.Warning,
      message: "Suspicious '..' chain. Use single '.' for method chaining.",
      startLineNumber: line,
      startColumn: column,
      endLineNumber: line,
      endColumn: column + 2,
    });
  }

  return markers;
}

function registerStrudelLanguage(monaco: typeof Monaco): Monaco.IDisposable[] {
  if (
    !monaco.languages
      .getLanguages()
      .some((lang) => lang.id === STRUDEL_LANGUAGE_ID)
  ) {
    monaco.languages.register({ id: STRUDEL_LANGUAGE_ID });
  }

  const disposables: Monaco.IDisposable[] = [];

  disposables.push(
    monaco.languages.setMonarchTokensProvider(STRUDEL_LANGUAGE_ID, {
      tokenizer: {
        root: [
          [
            /[a-zA-Z_$][\w$]*/,
            {
              cases: {
                "@keywords": "keyword",
                "@default": "identifier",
              },
            },
          ],
          [/\d+(\.\d+)?/, "number"],
          [/"([^"\\]|\\.)*$/, "string.invalid"],
          [/"([^"\\]|\\.)*"/, "string"],
          [/'([^'\\]|\\.)*$/, "string.invalid"],
          [/'([^'\\]|\\.)*'/, "string"],
          [/\/\/.*$/, "comment"],
          [/\/\*/, "comment", "@comment"],
          [/[[\]{}()]/, "delimiter.bracket"],
          [/[,.]/, "delimiter"],
        ],
        comment: [
          [/[^/*]+/, "comment"],
          [/\*\//, "comment", "@pop"],
          [/[/*]/, "comment"],
        ],
      },
      keywords: [...STRUDEL_GLOBALS, ...STRUDEL_CHAIN_METHODS],
    }),
  );

  disposables.push(
    monaco.languages.setLanguageConfiguration(STRUDEL_LANGUAGE_ID, {
      comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"],
      },
      autoClosingPairs: [
        { open: "(", close: ")" },
        { open: "[", close: "]" },
        { open: "{", close: "}" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
      surroundingPairs: [
        { open: "(", close: ")" },
        { open: "[", close: "]" },
        { open: "{", close: "}" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
      ],
    }),
  );

  disposables.push(
    monaco.languages.registerCompletionItemProvider(STRUDEL_LANGUAGE_ID, {
      triggerCharacters: [".", "(", '"'],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const globals = STRUDEL_GLOBALS.map((name) => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${name}($0)`,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Strudel function",
          documentation: FUNCTION_SIGNATURES[name]?.[1] ?? "",
          range,
        }));

        const methods = STRUDEL_CHAIN_METHODS.map((name) => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: `${name}($0)`,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Pattern method",
          range,
        }));

        const snippets = Object.entries(SNIPPETS).map(([label, snippet]) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet,
          detail: "Preset snippet",
          documentation: "Insert a ready-to-play Strudel pattern.",
          range,
        }));

        return {
          suggestions: [...globals, ...methods, ...snippets],
        };
      },
    }),
  );

  disposables.push(
    monaco.languages.registerSignatureHelpProvider(STRUDEL_LANGUAGE_ID, {
      signatureHelpTriggerCharacters: ["(", ","],
      provideSignatureHelp(model, position) {
        const textBefore = model
          .getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          })
          .trimEnd();

        const fnMatch = textBefore.match(/([a-zA-Z_$][\w$]*)\s*\([^()]*$/);
        const fnName = fnMatch?.[1];
        if (!fnName) {
          return {
            value: {
              signatures: [],
              activeParameter: 0,
              activeSignature: 0,
            },
            dispose: () => {},
          };
        }

        const signature = FUNCTION_SIGNATURES[fnName];
        if (!signature) {
          return {
            value: {
              signatures: [],
              activeParameter: 0,
              activeSignature: 0,
            },
            dispose: () => {},
          };
        }

        return {
          value: {
            signatures: [
              {
                label: signature[0],
                documentation: signature[1],
                parameters: [],
              },
            ],
            activeParameter: 0,
            activeSignature: 0,
          },
          dispose: () => {},
        };
      },
    }),
  );

  return disposables;
}

function buildMonacoTheme(
  theme: ThemeTokens,
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
      "editor.background": theme.background,
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
  onCodeChange,
}) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const languageDisposablesRef = useRef<Monaco.IDisposable[]>([]);
  const contentListenerRef = useRef<Monaco.IDisposable | null>(null);

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
    monaco.editor.defineTheme(monacoThemeName, buildMonacoTheme(themeTokens));
    monaco.editor.setTheme(monacoThemeName);
  }, [monacoThemeName, themeTokens]);

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
        buildStrudelMarkers(source, monaco),
      );
    },
    [],
  );

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

  const handleMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      if (languageDisposablesRef.current.length === 0) {
        languageDisposablesRef.current = registerStrudelLanguage(monaco);
      }

      monaco.editor.defineTheme(monacoThemeName, buildMonacoTheme(themeTokens));
      monaco.editor.setTheme(monacoThemeName);

      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, STRUDEL_LANGUAGE_ID);
        updateDiagnostics(model.getValue(), model, monaco);
        contentListenerRef.current?.dispose();
        contentListenerRef.current = model.onDidChangeContent(() => {
          updateDiagnostics(model.getValue(), model, monaco);
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
    },
    [
      insertSnippet,
      isPlaying,
      monacoThemeName,
      play,
      stop,
      themeTokens,
      updateDiagnostics,
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

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: 10,
        overflow: "hidden",
        background: themeTokens.background,
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

      <div
        style={{
          position: "absolute",
          left: 12,
          top: 8,
          zIndex: 3,
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <button
          onClick={formatCode}
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.22)",
            color: themeTokens.text,
            fontFamily: editorFontFamily,
            fontSize: 10,
            letterSpacing: 0.5,
            borderRadius: 5,
            padding: "3px 7px 6px",
            cursor: "pointer",
            zIndex: 3,
          }}
        >
          Format
        </button>
        <button
          onClick={() =>
            editorRef.current?.getAction("editor.action.quickCommand")?.run()
          }
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.22)",
            color: themeTokens.text,
            fontFamily: editorFontFamily,
            fontSize: 10,
            letterSpacing: 0.5,
            borderRadius: 5,
            padding: "3px 7px 6px",
            cursor: "pointer",
            zIndex: 3,
          }}
        >
          Actions
        </button>
        <button
          onClick={() => insertSnippet("Basic Beat")}
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.22)",
            color: themeTokens.text,
            fontFamily: editorFontFamily,
            fontSize: 10,
            letterSpacing: 0.5,
            borderRadius: 5,
            padding: "3px 7px 6px",
            cursor: "pointer",
            zIndex: 3,
          }}
        >
          + Beat
        </button>
        <button
          onClick={() => insertSnippet("Ambient Chords")}
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.22)",
            color: themeTokens.text,
            fontFamily: editorFontFamily,
            fontSize: 10,
            letterSpacing: 0.5,
            borderRadius: 5,
            padding: "3px 7px 6px",
            cursor: "pointer",
            zIndex: 3,
          }}
        >
          + Ambient
        </button>
      </div>

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

      <div
        style={{
          position: "absolute",
          right: 14,
          top: 10,
          zIndex: 3,
          fontFamily: editorFontFamily,
          fontSize: 10,
          color: "rgba(196,208,220,0.75)",
          letterSpacing: 0.4,
          pointerEvents: "none",
        }}
      >
        Cmd/Ctrl+Enter Play • Ctrl/Cmd+Space IntelliSense • Tab Indent
      </div>

      {liveEditError && (
        <div
          style={{
            position: "absolute",
            right: 14,
            bottom: 12,
            zIndex: 4,
            maxWidth: 460,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid rgba(255,182,118,0.4)",
            background: "rgba(68,42,19,0.82)",
            color: "#ffd9a8",
            fontFamily: editorFontFamily,
            fontSize: 10,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={liveEditError}
        >
          Live edit error: {liveEditError}
        </div>
      )}
    </div>
  );
};
