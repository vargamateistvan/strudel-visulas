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

const EDITOR_HIGHLIGHT_STYLE_ID = "strudel-editor-highlight-styles";
const EDITOR_NOTE_HIT_CLASS = "strudel-note-hit";
const EDITOR_NOTE_HIT_ACTIVE_CLASS = "strudel-note-hit-active";

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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isTokenBoundary(source: string, start: number, end: number): boolean {
  const boundary = /[A-Za-z0-9_#-]/;
  const left = start > 0 ? source[start - 1] : "";
  const right = end < source.length ? source[end] : "";
  return !boundary.test(left) && !boundary.test(right);
}

function buildTokenDecorations(
  source: string,
  tokens: string[],
  monaco: typeof Monaco,
  isPrimary = false,
): Monaco.editor.IModelDeltaDecoration[] {
  const decorations: Monaco.editor.IModelDeltaDecoration[] = [];
  const seen = new Set<string>();
  const normalizedTokens = tokens
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  for (const token of normalizedTokens) {
    const dedupeKey = token.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const regex = new RegExp(escapeRegExp(token), "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (!isTokenBoundary(source, start, end)) continue;

      const startPosition = getLineAndColumnFromOffset(source, start);
      const endPosition = getLineAndColumnFromOffset(source, end);
      decorations.push({
        range: new monaco.Range(
          startPosition.line,
          startPosition.column,
          endPosition.line,
          endPosition.column,
        ),
        options: {
          inlineClassName: isPrimary
            ? EDITOR_NOTE_HIT_ACTIVE_CLASS
            : EDITOR_NOTE_HIT_CLASS,
        },
      });
    }
  }

  return decorations;
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

const FUNCTION_SNIPPETS: Record<string, string> = {
  stack: "stack(${1:pattern1}, ${2:pattern2})",
  sound: 'sound("${1:bd ~ sn ~}")',
  note: 'note("${1:c3 eb3 g3 bb3}")',
  cpm: "cpm(${1:120})",
  every: "every(${1:4}, ${2:(pattern) => pattern})",
  sometimesBy: "sometimesBy(${1:0.5}, ${2:(pattern) => pattern})",
  gain: "gain(${1:0.8})",
  delay: "delay(${1:0.25})",
};

const FUNCTION_EXAMPLES: Record<string, string> = {
  stack: 'stack(sound("bd ~ bd ~"), sound("~ sn ~ sn"))',
  sound: 'sound("hh*8").gain(0.5)',
  note: 'note("c3 eb3 g3 bb3").sound("triangle")',
  cpm: "cpm(120)",
  every: "every(4, rev)",
  sometimesBy: "sometimesBy(0.25, rev)",
  gain: "gain(0.8)",
  delay: "delay(0.25)",
};

function buildCompletionDocumentation(name: string): Monaco.IMarkdownString {
  const signature = FUNCTION_SIGNATURES[name];
  const example = FUNCTION_EXAMPLES[name];

  return {
    value: [
      `**${signature?.[0] ?? name}**`,
      signature?.[1] ?? "",
      example ? "" : "",
      example
        ? `Example:\n\n\
\
\
\

\

\

\

\
\
\
\
\
\
\

\
\
\
\

\

\
\

\`\`\`js\n${example}\n\`\`\``
        : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

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
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBlockComment = false;
  let inLineComment = false;
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && source[i + 1] === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inSingleQuote || inDoubleQuote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (inSingleQuote && char === "'") {
        inSingleQuote = false;
      }

      if (inDoubleQuote && char === '"') {
        inDoubleQuote = false;
      }

      continue;
    }

    if (char === "/" && source[i + 1] === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (char === "/" && source[i + 1] === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }

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

  if (!inSingleQuote && !inDoubleQuote && !inBlockComment) {
    const doubleDotMatch = /(^|[^./])\.\.(?![./])/m.exec(source);
    if (doubleDotMatch?.index !== undefined) {
      const idx = doubleDotMatch.index + doubleDotMatch[1].length;
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

        const insertTextByName = (name: string) =>
          FUNCTION_SNIPPETS[name] ?? `${name}($0)`;

        const globals = STRUDEL_GLOBALS.map((name) => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: insertTextByName(name),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Strudel function",
          documentation: buildCompletionDocumentation(name),
          range,
        }));

        const methods = STRUDEL_CHAIN_METHODS.map((name) => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: insertTextByName(name),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Pattern method",
          documentation: buildCompletionDocumentation(name),
          range,
        }));

        const snippets = Object.entries(SNIPPETS).map(([label, snippet]) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet,
          detail: "Preset snippet",
          documentation: {
            value: [
              "Insert a ready-to-play Strudel pattern.",
              "",
              "```js",
              snippet,
              "```",
            ].join("\n"),
          },
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
  activeNote,
  activeNotes,
  activeLiterals,
  activeControls,
  nPulse,
  onCodeChange,
}) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const languageDisposablesRef = useRef<Monaco.IDisposable[]>([]);
  const contentListenerRef = useRef<Monaco.IDisposable | null>(null);
  const noteDecorationsRef =
    useRef<Monaco.editor.IEditorDecorationsCollection | null>(null);
  const noteHighlightStyleRef = useRef<HTMLStyleElement | null>(null);

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
  const activePlayingTokens = useMemo(() => {
    const values = new Set<string>();
    if (activeNote) values.add(activeNote);
    for (const token of activeNotes ?? []) values.add(token);
    for (const token of activeLiterals ?? []) values.add(token);
    for (const token of activeControls ?? []) {
      if (token === "n" || token === "note" || token === "freq") {
        values.add(token);
      }
    }
    return Array.from(values);
  }, [activeControls, activeLiterals, activeNote, activeNotes]);

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

  const updateActiveHighlights = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    if (status !== "playing" || activePlayingTokens.length === 0) {
      noteDecorationsRef.current?.clear();
      return;
    }

    const source = model.getValue();
    const primaryTokens = activeNote ? [activeNote] : [];
    const secondaryTokens = activePlayingTokens.filter(
      (token) => !primaryTokens.includes(token),
    );

    const decorations = [
      ...buildTokenDecorations(source, secondaryTokens, monaco, false),
      ...buildTokenDecorations(source, primaryTokens, monaco, true),
    ];

    if (!noteDecorationsRef.current) {
      noteDecorationsRef.current =
        editor.createDecorationsCollection(decorations);
      return;
    }

    noteDecorationsRef.current.set(decorations);
  }, [activeNote, activePlayingTokens, status]);

  useEffect(() => {
    updateActiveHighlights();
  }, [code, nPulse, status, updateActiveHighlights]);

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
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;

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
        updateActiveHighlights();
        contentListenerRef.current?.dispose();
        contentListenerRef.current = model.onDidChangeContent(() => {
          updateDiagnostics(model.getValue(), model, monaco);
          updateActiveHighlights();
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
      wrapInGain,
      wrapInRev,
      stop,
      themeTokens,
      updateDiagnostics,
      updateActiveHighlights,
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
          onClick={wrapInRev}
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
          rev
        </button>
        <button
          onClick={wrapInGain}
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
          gain
        </button>
        <button
          onClick={duplicateInStack}
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
          stack
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
