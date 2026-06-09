import type * as Monaco from "monaco-editor";

export const STRUDEL_LANGUAGE_ID = "strudel";
export const STRUDEL_MARKER_OWNER = "strudel-lint";

const SNIPPETS: Record<string, string> = {
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
  rev: "rev",
  slow: "slow(2)",
  fast: "fast(2)",
  lpf: "lpf(400)",
  hpf: "hpf(300)",
  room: "room(0.2)",
  size: "size(0.6)",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isTokenBoundary(source: string, start: number, end: number): boolean {
  const boundary = /[A-Za-z0-9_#-]/;
  const left = start > 0 ? source[start - 1] : "";
  const right = end < source.length ? source[end] : "";
  return !boundary.test(left) && !boundary.test(right);
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

function buildCompletionDocumentation(name: string): Monaco.IMarkdownString {
  const signature = FUNCTION_SIGNATURES[name];
  const example = FUNCTION_EXAMPLES[name];

  return {
    value: [
      `**${signature?.[0] ?? name}**`,
      signature?.[1] ?? "",
      example ? "" : "",
      example ? `Example:\n\n\`\`\`js\n${example}\n\`\`\`` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
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
            ? "strudel-note-hit-active"
            : "strudel-note-hit",
        },
      });
    }
  }

  return decorations;
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

export function registerStrudelLanguage(
  monaco: typeof Monaco,
): Monaco.IDisposable[] {
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

export function createStrudelMarkers(
  source: string,
  monaco: typeof Monaco,
): Monaco.editor.IMarkerData[] {
  return buildStrudelMarkers(source, monaco);
}

export function createStrudelDecorations(
  source: string,
  tokens: string[],
  monaco: typeof Monaco,
  isPrimary = false,
): Monaco.editor.IModelDeltaDecoration[] {
  return buildTokenDecorations(source, tokens, monaco, isPrimary);
}
