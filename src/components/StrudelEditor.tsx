import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const EDITOR_THEME: Record<
  EditorColorPreset,
  {
    border: string;
    glow: string;
    text: string;
    caret: string;
    activeBg: string;
    activeShadow: string;
    comment: string;
    string: string;
    number: string;
    keyword: string;
    ident: string;
    note: string;
    punct: string;
    operator: string;
  }
> = {
  neon: {
    border: "rgba(0,255,136,0.12)",
    glow: "rgba(0,255,136,0.08)",
    text: "rgba(200,255,220,0.74)",
    caret: "#00ff88",
    activeBg: "rgba(0,255,136,0.28)",
    activeShadow: "0 0 14px rgba(0,255,136,0.55)",
    comment: "rgba(120,140,140,0.9)",
    string: "#b7f7d3",
    number: "#f3d17a",
    keyword: "#7ae6ff",
    ident: "rgba(200,255,220,0.74)",
    note: "#8dffb8",
    punct: "rgba(182,255,214,0.9)",
    operator: "#6fdcff",
  },
  amber: {
    border: "rgba(255,179,71,0.16)",
    glow: "rgba(255,179,71,0.1)",
    text: "rgba(255,230,190,0.78)",
    caret: "#ffb347",
    activeBg: "rgba(255,179,71,0.3)",
    activeShadow: "0 0 14px rgba(255,179,71,0.55)",
    comment: "rgba(160,140,100,0.9)",
    string: "#ffdca8",
    number: "#fff07a",
    keyword: "#ffca7a",
    ident: "rgba(255,234,204,0.8)",
    note: "#ffe2a2",
    punct: "rgba(255,222,172,0.92)",
    operator: "#ffd88c",
  },
  ice: {
    border: "rgba(102,224,255,0.16)",
    glow: "rgba(102,224,255,0.1)",
    text: "rgba(215,248,255,0.8)",
    caret: "#66e0ff",
    activeBg: "rgba(102,224,255,0.26)",
    activeShadow: "0 0 14px rgba(102,224,255,0.52)",
    comment: "rgba(128,156,168,0.9)",
    string: "#c8f6ff",
    number: "#ffe3a4",
    keyword: "#7dd8ff",
    ident: "rgba(218,248,255,0.82)",
    note: "#a4eeff",
    punct: "rgba(190,245,255,0.93)",
    operator: "#90e4ff",
  },
  mono: {
    border: "rgba(192,199,209,0.2)",
    glow: "rgba(192,199,209,0.1)",
    text: "rgba(224,230,238,0.82)",
    caret: "#c0c7d1",
    activeBg: "rgba(192,199,209,0.26)",
    activeShadow: "0 0 14px rgba(192,199,209,0.5)",
    comment: "rgba(129,139,152,0.9)",
    string: "#dfe5ee",
    number: "#c8d0dc",
    keyword: "#e2e7ef",
    ident: "rgba(224,230,238,0.82)",
    note: "#d4dbe5",
    punct: "rgba(210,218,227,0.92)",
    operator: "#bfc8d3",
  },
};

const EDITOR_FONT_FAMILY: Record<EditorFontPreset, string> = {
  jetbrainsMono: '"JetBrains Mono",ui-monospace,monospace',
  bitcountSingle: '"Bitcount Single",ui-monospace,monospace',
  doto: '"Doto",ui-monospace,monospace',
  firaCode: '"Fira Code",ui-monospace,monospace',
};

const NOTE_TOKEN_RE = /\b([a-g](?:b|#)?-?\d*)\b/gi;
const NUMBER_RE = /^-?\d+(?:\.\d+)?/;
const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_#]*/;

const STRUDEL_KEYWORDS = new Set([
  "stack",
  "note",
  "sound",
  "gain",
  "lpf",
  "hpf",
  "resonance",
  "delay",
  "delaytime",
  "cpm",
  "fast",
  "slow",
  "rev",
  "room",
  "size",
  "shape",
  "crush",
  "attack",
  "release",
  "sustain",
  "pan",
  "n",
  "amp",
  "s",
]);

type SuggestionKind = "fn" | "snippet" | "param";

type EditorSuggestion = {
  label: string;
  insertText: string;
  detail: string;
  doc: string;
  kind: SuggestionKind;
};

const EDITOR_SUGGESTIONS: EditorSuggestion[] = [
  {
    label: "stack",
    insertText: "stack(\n  \n)",
    detail: "Function",
    doc: "Layer multiple patterns so they play together.",
    kind: "fn",
  },
  {
    label: "note",
    insertText: 'note("")',
    detail: "Function",
    doc: "Create note patterns from pitch strings.",
    kind: "fn",
  },
  {
    label: "sound",
    insertText: 'sound("")',
    detail: "Function",
    doc: "Select instrument or sample source.",
    kind: "fn",
  },
  {
    label: "gain",
    insertText: "gain(0.5)",
    detail: "Parameter",
    doc: "Set output level from 0.0 to 1.0.",
    kind: "param",
  },
  {
    label: "lpf",
    insertText: "lpf(800)",
    detail: "Parameter",
    doc: "Low-pass filter cutoff frequency.",
    kind: "param",
  },
  {
    label: "delay",
    insertText: "delay(0.35)",
    detail: "Parameter",
    doc: "Delay amount, usually between 0 and 1.",
    kind: "param",
  },
  {
    label: "cpm",
    insertText: "cpm(120)",
    detail: "Parameter",
    doc: "Cycles per minute tempo.",
    kind: "param",
  },
  {
    label: "Basic Beat",
    insertText:
      'stack(\n  sound("bd ~ bd ~"),\n  sound("~ sn ~ sn"),\n  sound("hh*8").gain(0.5)\n).cpm(120)',
    detail: "Snippet",
    doc: "Kick, snare, and hats starter groove.",
    kind: "snippet",
  },
  {
    label: "Ambient Chords",
    insertText:
      'stack(\n  note("c3 eb3 g3 bb3").sound("triangle").slow(2).gain(0.35),\n  note("c4 g4 eb4").sound("sawtooth").delay(0.4).gain(0.2)\n).cpm(72)',
    detail: "Snippet",
    doc: "Soft layered harmonic texture.",
    kind: "snippet",
  },
];

type SignatureInfo = {
  name: string;
  params: string[];
  doc: string;
  example?: string;
};

const SIGNATURES: Record<string, SignatureInfo> = {
  stack: {
    name: "stack",
    params: ["...patterns"],
    doc: "Play multiple patterns in parallel.",
    example: 'stack(sound("bd ~"), sound("~ sn"))',
  },
  note: {
    name: "note",
    params: ["pattern"],
    doc: "Create notes from a pitch pattern string.",
    example: 'note("c3 eb3 g3")',
  },
  sound: {
    name: "sound",
    params: ["instrumentOrSample"],
    doc: "Pick synth/sample source for the pattern.",
    example: 'sound("sawtooth")',
  },
  gain: {
    name: "gain",
    params: ["amount"],
    doc: "Set output gain, typically between 0 and 1.",
  },
  lpf: {
    name: "lpf",
    params: ["cutoffHz"],
    doc: "Apply low-pass filtering.",
  },
  hpf: {
    name: "hpf",
    params: ["cutoffHz"],
    doc: "Apply high-pass filtering.",
  },
  delay: {
    name: "delay",
    params: ["amount"],
    doc: "Set delay amount.",
  },
  delaytime: {
    name: "delaytime",
    params: ["ratioOrSeconds"],
    doc: "Set delay timing.",
  },
  cpm: {
    name: "cpm",
    params: ["tempo"],
    doc: "Set cycles per minute.",
    example: "cpm(120)",
  },
  fast: {
    name: "fast",
    params: ["factor"],
    doc: "Speed pattern up by factor.",
  },
  slow: {
    name: "slow",
    params: ["factor"],
    doc: "Slow pattern down by factor.",
  },
};

type EditorDiagnostic = {
  id: string;
  severity: "error" | "warn";
  message: string;
  line: number;
  column: number;
  length?: number;
  kind?:
    | "mismatch"
    | "unclosed-bracket"
    | "string-unclosed"
    | "unknown-function";
  opener?: "(" | "[" | "{";
  quote?: "'" | '"';
  token?: string;
  replacement?: string;
};

type SignatureContext = {
  fn: string;
  argIndex: number;
};

const NON_STRUDEL_FUNCTION_ALLOWLIST = new Set([
  "math",
  "string",
  "number",
  "array",
  "object",
  "date",
  "console",
  "settimeout",
  "setinterval",
  "clearinterval",
  "cleartimeout",
  "requestanimationframe",
  "cancelanimationframe",
  "parseint",
  "parsefloat",
  "isnan",
  "isfinite",
  "import",
]);

const JS_RESERVED_CALL_WORDS = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "function",
  "return",
  "typeof",
  "new",
]);

const PITCH_CLASS_ALIASES: Record<string, string> = {
  cb: "b",
  db: "c#",
  eb: "d#",
  fb: "e",
  gb: "f#",
  ab: "g#",
  bb: "a#",
  "e#": "f",
  "b#": "c",
};

function normalizePitchClass(value: string | null | undefined): string {
  if (!value) return "";
  const base = value.toLowerCase().replace(/\d+/g, "");
  return PITCH_CLASS_ALIASES[base] ?? base;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isWhitespace(value: string): boolean {
  return value === " " || value === "\t" || value === "\n" || value === "\r";
}

function renderStringWithNoteHighlights(
  raw: string,
  activePitchClasses: Set<string>,
  activeLiterals: Set<string>,
  nPulse: number,
  isNControlString: boolean,
): string {
  const TOKEN_IN_STRING_RE = /[A-Za-z_][A-Za-z0-9_#-]*|-?\d+(?:\.\d+)?/g;
  const NUMBER_ONLY_RE = /^-?\d+(?:\.\d+)?$/;
  let out = "";
  let last = 0;
  let match: RegExpExecArray | null;
  const numericTokens = Array.from(raw.matchAll(/-?\d+(?:\.\d+)?/g));
  const forcedNumericIndex =
    isNControlString && numericTokens.length > 0
      ? ((nPulse % numericTokens.length) + numericTokens.length) %
        numericTokens.length
      : -1;
  let seenNumeric = -1;

  while ((match = TOKEN_IN_STRING_RE.exec(raw)) !== null) {
    const [token] = match;
    const index = match.index;
    if (index > last) {
      out += escapeHtml(raw.slice(last, index));
    }
    const normalized = normalizePitchClass(token);
    const activeByPitch = activePitchClasses.has(normalized);
    const activeByLiteral = activeLiterals.has(token.toLowerCase());
    let activeByNPulse = false;
    if (isNControlString && NUMBER_ONLY_RE.test(token)) {
      seenNumeric += 1;
      activeByNPulse = seenNumeric === forcedNumericIndex;
    }
    const active = activeByPitch || activeByLiteral || activeByNPulse;
    const classes = active ? "tok-note active-note-token" : "tok-note";
    out += `<span class="${classes}">${escapeHtml(token)}</span>`;
    last = index + token.length;
  }

  if (last < raw.length) {
    out += escapeHtml(raw.slice(last));
  }

  return out;
}

function renderHighlightedCode(
  code: string,
  activeNote: string | null,
  activeNotes: string[],
  activeLiterals: string[],
  activeControls: string[],
  nPulse: number,
  diagnosticOffsets: Map<
    number,
    { severity: "error" | "warn"; length: number }
  >,
): string {
  const activePitchClasses = new Set<string>();
  if (activeNote) {
    activePitchClasses.add(normalizePitchClass(activeNote));
  }
  for (const note of activeNotes) {
    activePitchClasses.add(normalizePitchClass(note));
  }
  const literalSet = new Set(activeLiterals.map((v) => v.toLowerCase()));
  const controlSet = new Set(activeControls.map((v) => v.toLowerCase()));
  let out = "";
  let previousIdent = "";

  let i = 0;
  while (i < code.length) {
    const char = code[i];
    const diagAtPos = diagnosticOffsets.get(i);

    if (char === "/" && code[i + 1] === "/") {
      let end = i + 2;
      while (end < code.length && code[end] !== "\n") end++;
      out += `<span class="tok-comment">${escapeHtml(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      let end = i + 1;
      while (end < code.length) {
        if (code[end] === "\\") {
          end += 2;
          continue;
        }
        if (code[end] === quote) {
          end++;
          break;
        }
        end++;
      }
      const token = code.slice(i, end);
      if (token.length >= 2) {
        const inner = token.slice(1, -1);
        const isNControlString = previousIdent.toLowerCase() === "n";
        out += `<span class="tok-string">${escapeHtml(token[0])}${renderStringWithNoteHighlights(inner, activePitchClasses, literalSet, nPulse, isNControlString)}${escapeHtml(token[token.length - 1])}</span>`;
      } else {
        out += `<span class="tok-string">${escapeHtml(token)}</span>`;
      }
      previousIdent = "";
      i = end;
      continue;
    }

    const numberMatch = code.slice(i).match(NUMBER_RE);
    if (numberMatch) {
      const diagClass = diagAtPos
        ? diagAtPos.severity === "error"
          ? " tok-diag-error"
          : " tok-diag-warn"
        : "";
      out += `<span class="tok-number${diagClass}">${escapeHtml(numberMatch[0])}</span>`;
      i += numberMatch[0].length;
      previousIdent = "";
      continue;
    }

    NOTE_TOKEN_RE.lastIndex = 0;
    const noteMatch = code.slice(i).match(/^([a-g](?:b|#)?\d*)\b/i);
    if (noteMatch) {
      const token = noteMatch[0];
      const normalized = normalizePitchClass(token);
      const active = activePitchClasses.has(normalized);
      const diagClass = diagAtPos
        ? diagAtPos.severity === "error"
          ? " tok-diag-error"
          : " tok-diag-warn"
        : "";
      const classes = active
        ? `tok-note active-note-token${diagClass}`
        : `tok-note${diagClass}`;
      out += `<span class="${classes}">${escapeHtml(token)}</span>`;
      i += token.length;
      previousIdent = "";
      continue;
    }

    const identMatch = code.slice(i).match(IDENT_RE);
    if (identMatch) {
      const token = identMatch[0];
      const isActiveControl = controlSet.has(token.toLowerCase());
      const diagClass = diagAtPos
        ? diagAtPos.severity === "error"
          ? " tok-diag-error"
          : " tok-diag-warn"
        : "";
      if (STRUDEL_KEYWORDS.has(token)) {
        const klass = isActiveControl
          ? `tok-keyword active-note-token${diagClass}`
          : `tok-keyword${diagClass}`;
        out += `<span class="${klass}">${escapeHtml(token)}</span>`;
      } else {
        const klass = isActiveControl
          ? `tok-ident active-note-token${diagClass}`
          : `tok-ident${diagClass}`;
        out += `<span class="${klass}">${escapeHtml(token)}</span>`;
      }
      i += token.length;
      previousIdent = token;
      continue;
    }

    if ("[](){}<>.,:;~".includes(char)) {
      const diagClass = diagAtPos
        ? diagAtPos.severity === "error"
          ? " tok-diag-error"
          : " tok-diag-warn"
        : "";
      out += `<span class="tok-punct${diagClass}">${escapeHtml(char)}</span>`;
      i += 1;
      if (!isWhitespace(char)) previousIdent = "";
      continue;
    }

    if ("+-*/=%!&|".includes(char)) {
      const diagClass = diagAtPos
        ? diagAtPos.severity === "error"
          ? " tok-diag-error"
          : " tok-diag-warn"
        : "";
      out += `<span class="tok-operator${diagClass}">${escapeHtml(char)}</span>`;
      i += 1;
      previousIdent = "";
      continue;
    }

    if (isWhitespace(char)) {
      out += char === "\t" ? "  " : char;
      i += 1;
      continue;
    }

    if (diagAtPos) {
      const diagClass =
        diagAtPos.severity === "error" ? "tok-diag-error" : "tok-diag-warn";
      out += `<span class="${diagClass}">${escapeHtml(char)}</span>`;
    } else {
      out += escapeHtml(char);
    }
    i += 1;
    previousIdent = "";
  }

  return out;
}

function getCurrentToken(
  code: string,
  caret: number,
): {
  token: string;
  start: number;
} {
  const head = code.slice(0, caret);
  const match = head.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  if (!match) return { token: "", start: caret };
  return { token: match[0], start: caret - match[0].length };
}

function lineColToOffset(code: string, line: number, column: number): number {
  const lines = code.split("\n");
  let offset = 0;
  for (let i = 0; i < line && i < lines.length; i++) {
    offset += lines[i].length + 1;
  }
  const col = Math.max(0, Math.min(column, (lines[line] ?? "").length));
  return offset + col;
}

function getSignatureContext(
  code: string,
  caret: number,
): SignatureContext | null {
  let depth = 0;
  for (let i = caret - 1; i >= 0; i--) {
    const ch = code[i];
    if (ch === ")") {
      depth += 1;
      continue;
    }
    if (ch === "(") {
      if (depth === 0) {
        const before = code.slice(0, i);
        const fnMatch = before.match(/([A-Za-z_][A-Za-z0-9_]*)\s*$/);
        if (!fnMatch) return null;
        const fn = fnMatch[1].toLowerCase();

        let argIndex = 0;
        let nested = 0;
        for (let j = i + 1; j < caret; j++) {
          const c = code[j];
          if (c === "(") nested += 1;
          else if (c === ")") nested = Math.max(0, nested - 1);
          else if (c === "," && nested === 0) argIndex += 1;
        }
        return { fn, argIndex };
      }
      depth -= 1;
    }
  }
  return null;
}

function analyzeDiagnostics(code: string): EditorDiagnostic[] {
  const diagnostics: EditorDiagnostic[] = [];
  const stack: Array<{ ch: string; line: number; col: number }> = [];
  const openerForCloser: Record<string, string> = {
    ")": "(",
    "]": "[",
    "}": "{",
  };

  let line = 0;
  let col = 0;
  let inString: "'" | '"' | null = null;
  let inComment = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    if (ch === "\n") {
      line += 1;
      col = 0;
      inComment = false;
      continue;
    }

    if (inComment) {
      col += 1;
      continue;
    }

    if (!inString && ch === "/" && next === "/") {
      inComment = true;
      col += 1;
      continue;
    }

    if (inString) {
      if (ch === "\\") {
        i += 1;
        col += 2;
        continue;
      }
      if (ch === inString) {
        inString = null;
      }
      col += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      col += 1;
      continue;
    }

    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push({ ch, line, col });
    } else if (ch === ")" || ch === "]" || ch === "}") {
      const expected = openerForCloser[ch];
      const top = stack[stack.length - 1];
      if (!top || top.ch !== expected) {
        diagnostics.push({
          id: `mismatch-${i}`,
          severity: "error",
          message: `Unexpected '${ch}'`,
          line,
          column: col,
          length: 1,
          kind: "mismatch",
        });
      } else {
        stack.pop();
      }
    }

    col += 1;
  }

  if (inString) {
    diagnostics.push({
      id: "string-unclosed",
      severity: "error",
      message: "Unclosed string literal",
      line,
      column: col,
      kind: "string-unclosed",
      quote: inString,
    });
  }

  for (const unclosed of stack.slice(-4)) {
    diagnostics.push({
      id: `unclosed-${unclosed.line}-${unclosed.col}`,
      severity: "error",
      message: `Unclosed '${unclosed.ch}'`,
      line: unclosed.line,
      column: unclosed.col,
      length: 1,
      kind: "unclosed-bracket",
      opener: unclosed.ch as "(" | "[" | "{",
    });
  }

  const functionCallRe = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  const declaredFunctions = new Set<string>();
  const declarationRe =
    /\b(?:const|let|var|function)\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let decl: RegExpExecArray | null;
  while ((decl = declarationRe.exec(code)) !== null) {
    declaredFunctions.add(decl[1].toLowerCase());
  }

  let match: RegExpExecArray | null;
  const warned = new Set<string>();
  while ((match = functionCallRe.exec(code)) !== null) {
    const fn = match[1];
    const lower = fn.toLowerCase();
    const callStart = match.index;
    const prevChar = callStart > 0 ? code[callStart - 1] : "";
    if (
      STRUDEL_KEYWORDS.has(lower) ||
      SIGNATURES[lower] ||
      NON_STRUDEL_FUNCTION_ALLOWLIST.has(lower) ||
      JS_RESERVED_CALL_WORDS.has(lower) ||
      declaredFunctions.has(lower)
    ) {
      continue;
    }

    // Allow property calls on built-ins (e.g. Math.max)
    if (prevChar === ".") continue;

    if (warned.has(lower)) continue;

    const before = code.slice(0, match.index);
    const callLine = (before.match(/\n/g) ?? []).length;
    const lineStart = before.lastIndexOf("\n") + 1;
    const callCol = match.index - lineStart;

    diagnostics.push({
      id: `unknown-${lower}`,
      severity: "warn",
      message: `Unknown function '${fn}'`,
      line: callLine,
      column: callCol,
      length: fn.length,
      kind: "unknown-function",
      token: fn,
      replacement: nearestStrudelKeyword(fn) ?? undefined,
    });
    warned.add(lower);
  }

  return diagnostics.slice(0, 8);
}

function buildDiagnosticOffsetMap(
  code: string,
  diagnostics: EditorDiagnostic[],
): Map<number, { severity: "error" | "warn"; length: number }> {
  const map = new Map<number, { severity: "error" | "warn"; length: number }>();
  for (const d of diagnostics) {
    const offset = lineColToOffset(code, d.line, d.column);
    map.set(offset, {
      severity: d.severity,
      length: Math.max(1, d.length ?? 1),
    });
  }
  return map;
}

function closerForOpener(opener: "(" | "[" | "{"): ")" | "]" | "}" {
  if (opener === "(") return ")";
  if (opener === "[") return "]";
  return "}";
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[a.length][b.length];
}

function nearestStrudelKeyword(token: string): string | null {
  const lower = token.toLowerCase();
  const candidates = Array.from(STRUDEL_KEYWORDS.values());
  let best: string | null = null;
  let bestScore = Infinity;
  for (const candidate of candidates) {
    const score = levenshtein(lower, candidate);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  if (bestScore <= 3) return best;
  return null;
}

function getQuickFixForDiagnostic(
  source: string,
  diagnostic: EditorDiagnostic,
): { label: string; nextCode: string } | null {
  if (diagnostic.kind === "string-unclosed") {
    const q = diagnostic.quote ?? '"';
    return {
      label: `Insert closing ${q}`,
      nextCode: `${source}${q}`,
    };
  }

  if (diagnostic.kind === "unclosed-bracket" && diagnostic.opener) {
    const close = closerForOpener(diagnostic.opener);
    return {
      label: `Insert missing ${close}`,
      nextCode: `${source}${close}`,
    };
  }

  if (diagnostic.kind === "mismatch") {
    const offset = lineColToOffset(source, diagnostic.line, diagnostic.column);
    return {
      label: "Remove unexpected closer",
      nextCode: `${source.slice(0, offset)}${source.slice(offset + 1)}`,
    };
  }

  if (diagnostic.kind === "unknown-function" && diagnostic.replacement) {
    const offset = lineColToOffset(source, diagnostic.line, diagnostic.column);
    const len = Math.max(1, diagnostic.length ?? 1);
    return {
      label: `Replace with ${diagnostic.replacement}`,
      nextCode:
        source.slice(0, offset) +
        diagnostic.replacement +
        source.slice(offset + len),
    };
  }

  return null;
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
  activeNotes = [],
  activeLiterals = [],
  activeControls = [],
  nPulse = 0,
  onCodeChange,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [caretPos, setCaretPos] = useState(0);
  const [activeDiagnosticIndex, setActiveDiagnosticIndex] = useState(0);
  const [quickFixHistory, setQuickFixHistory] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorTopInset = 44;

  const updateCode = useCallback(
    (c: string) => {
      onCodeChange?.(c);
    },
    [onCodeChange],
  );
  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const liveEditErrorPrefix = "Live edit error:";
  const isLiveEditError = Boolean(error?.startsWith(liveEditErrorPrefix));
  const liveEditError = isLiveEditError
    ? (error?.slice(liveEditErrorPrefix.length).trim() ?? "")
    : null;

  const handlePlay = useCallback(() => play(code), [play, code]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (isPlaying) {
          stop();
        } else {
          handlePlay();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, handlePlay, stop]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget,
        s = ta.selectionStart,
        end = ta.selectionEnd;
      updateCode(code.slice(0, s) + "  " + code.slice(end));
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 2;
      });
    }
  };

  // Derive panel alpha from opacity prop
  const bgAlpha = (opacity * 0.75).toFixed(2);
  const theme = EDITOR_THEME[colorPreset];
  const editorFontFamily =
    EDITOR_FONT_FAMILY[fontPreset] ?? EDITOR_FONT_FAMILY.jetbrainsMono;
  const editorFontSize = Math.max(11, Math.min(22, Math.round(fontSize)));
  const diagnostics = useMemo(() => analyzeDiagnostics(code), [code]);
  const diagnosticOffsets = useMemo(
    () => buildDiagnosticOffsetMap(code, diagnostics),
    [code, diagnostics],
  );
  const highlighted = renderHighlightedCode(
    code,
    activeNote,
    activeNotes,
    activeLiterals,
    activeControls,
    nPulse,
    diagnosticOffsets,
  );

  const { token: currentToken, start: tokenStart } = useMemo(
    () => getCurrentToken(code, caretPos),
    [code, caretPos],
  );

  const filteredSuggestions = useMemo(() => {
    const query = currentToken.trim().toLowerCase();
    if (!query && !showSuggestions) return [];
    if (!query) return EDITOR_SUGGESTIONS.slice(0, 8);
    return EDITOR_SUGGESTIONS.filter(
      (item) =>
        item.label.toLowerCase().startsWith(query) ||
        item.label.toLowerCase().includes(query),
    )
      .sort((a, b) => {
        const aStarts = a.label.toLowerCase().startsWith(query);
        const bStarts = b.label.toLowerCase().startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.label.localeCompare(b.label);
      })
      .slice(0, 8);
  }, [currentToken, showSuggestions]);

  const clampedDiagnosticIndex =
    diagnostics.length === 0
      ? 0
      : Math.min(activeDiagnosticIndex, diagnostics.length - 1);
  const currentDiagnostic = diagnostics[clampedDiagnosticIndex] ?? null;

  const lineMarkers = useMemo(() => {
    const seen = new Set<number>();
    return diagnostics
      .filter((d) => {
        if (seen.has(d.line)) return false;
        seen.add(d.line);
        return true;
      })
      .slice(0, 24);
  }, [diagnostics]);

  const signatureContext = useMemo(
    () => getSignatureContext(code, caretPos),
    [code, caretPos],
  );

  const activeSignature = useMemo(() => {
    if (!signatureContext) return null;
    return SIGNATURES[signatureContext.fn] ?? null;
  }, [signatureContext]);

  const clampedSuggestionIndex =
    filteredSuggestions.length === 0
      ? 0
      : Math.min(selectedSuggestion, filteredSuggestions.length - 1);

  const applySuggestion = useCallback(
    (suggestion: EditorSuggestion) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const replacement = suggestion.insertText;
      const before = code.slice(0, tokenStart);
      const after = code.slice(caretPos);
      const next = `${before}${replacement}${after}`;
      const nextCaret = before.length + replacement.length;

      updateCode(next);
      setShowSuggestions(false);

      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = nextCaret;
        setCaretPos(nextCaret);
      });
    },
    [code, tokenStart, caretPos, updateCode],
  );

  const insertSnippet = useCallback(
    (snippetLabel: string) => {
      const found = EDITOR_SUGGESTIONS.find(
        (item) => item.kind === "snippet" && item.label === snippetLabel,
      );
      if (!found) return;
      const ta = textareaRef.current;
      const next = `${code}\n\n${found.insertText}`;
      updateCode(next);
      const nextCaret = next.length;
      requestAnimationFrame(() => {
        if (!ta) return;
        ta.focus();
        ta.selectionStart = ta.selectionEnd = nextCaret;
        setCaretPos(nextCaret);
      });
    },
    [code, updateCode],
  );

  const formatCode = useCallback(() => {
    const lines = code.split("\n");
    let indent = 0;
    const formatted = lines
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.length === 0) return "";
        if (/^[\])}]/.test(trimmed)) {
          indent = Math.max(0, indent - 1);
        }
        const out = `${"  ".repeat(indent)}${trimmed}`;
        const opens = (trimmed.match(/[({[]/g) ?? []).length;
        const closes = (trimmed.match(/[)}\]]/g) ?? []).length;
        indent = Math.max(0, indent + opens - closes);
        return out;
      })
      .join("\n");

    updateCode(formatted);
  }, [code, updateCode]);

  const jumpToDiagnostic = useCallback(
    (diagnostic: EditorDiagnostic) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const offset = lineColToOffset(code, diagnostic.line, diagnostic.column);
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = offset;
        ta.scrollTop = Math.max(0, ta.scrollHeight * (diagnostic.line / 40));
        setCaretPos(offset);
      });
    },
    [code],
  );

  const hasQuickFix = Boolean(
    currentDiagnostic &&
    (currentDiagnostic.kind === "string-unclosed" ||
      currentDiagnostic.kind === "unclosed-bracket" ||
      currentDiagnostic.kind === "mismatch" ||
      (currentDiagnostic.kind === "unknown-function" &&
        currentDiagnostic.replacement)),
  );

  const currentQuickFix = useMemo(() => {
    if (!currentDiagnostic) return null;
    return getQuickFixForDiagnostic(code, currentDiagnostic);
  }, [code, currentDiagnostic]);

  const fixableDiagnosticCount = useMemo(() => {
    return diagnostics.filter((diag) => getQuickFixForDiagnostic(code, diag))
      .length;
  }, [code, diagnostics]);

  const applyQuickFix = useCallback(() => {
    if (!currentQuickFix) return;
    setQuickFixHistory((prev) => {
      const next = [...prev, code];
      return next.length > 20 ? next.slice(next.length - 20) : next;
    });
    updateCode(currentQuickFix.nextCode);
  }, [code, currentQuickFix, updateCode]);

  const applyAllSafeFixes = useCallback(() => {
    let nextCode = code;
    for (let i = 0; i < 12; i++) {
      const nextDiagnostics = analyzeDiagnostics(nextCode);
      const nextFix = nextDiagnostics
        .map((diag) => getQuickFixForDiagnostic(nextCode, diag))
        .find((fix): fix is { label: string; nextCode: string } =>
          Boolean(fix),
        );
      if (!nextFix) break;
      if (nextFix.nextCode === nextCode) break;
      nextCode = nextFix.nextCode;
    }

    if (nextCode !== code) {
      setQuickFixHistory((prev) => {
        const next = [...prev, code];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });
      updateCode(nextCode);
    }
  }, [code, updateCode]);

  const revertLastQuickFix = useCallback(() => {
    let restored = "";
    setQuickFixHistory((prev) => {
      if (prev.length === 0) return prev;
      restored = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    if (restored) {
      updateCode(restored);
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        ta.selectionStart = ta.selectionEnd = restored.length;
        setCaretPos(restored.length);
      });
    }
  }, [updateCode]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: 10,
        overflow: "hidden",
        background: `rgba(5,5,12,${bgAlpha})`,
        border: `1px solid ${theme.border}`,
        boxShadow: `0 0 40px ${theme.glow}, inset 0 0 30px rgba(0,0,0,0.2)`,
        backdropFilter: `blur(${Math.round(opacity * 16)}px)`,
      }}
    >
      {/* loading overlay */}
      {isLoading && <LoadingOverlay message={loadMsg} />}

      {/* error bar */}
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

      {/* textarea */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => {
          updateCode(e.target.value);
          setCaretPos(e.target.selectionStart);
        }}
        onClick={(e) => {
          setCaretPos(e.currentTarget.selectionStart);
        }}
        onKeyUp={(e) => {
          setCaretPos(e.currentTarget.selectionStart);
          const { token } = getCurrentToken(
            e.currentTarget.value,
            e.currentTarget.selectionStart,
          );
          setShowSuggestions(token.length > 0);
        }}
        onScroll={(e) => {
          setScrollTop(e.currentTarget.scrollTop);
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
            e.preventDefault();
            setShowSuggestions(true);
            setSelectedSuggestion(0);
            return;
          }

          if (showSuggestions && filteredSuggestions.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedSuggestion(
                (prev) => (prev + 1) % filteredSuggestions.length,
              );
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedSuggestion(
                (prev) =>
                  (prev - 1 + filteredSuggestions.length) %
                  filteredSuggestions.length,
              );
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              applySuggestion(filteredSuggestions[clampedSuggestionIndex]);
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setShowSuggestions(false);
              return;
            }
          }

          onKeyDown(e);
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          resize: "none",
          border: "none",
          outline: "none",
          padding: `${editorTopInset}px 18px 16px`,
          fontFamily: editorFontFamily,
          fontSize: editorFontSize,
          lineHeight: 1.75,
          color: "transparent",
          background: "transparent",
          caretColor: theme.caret,
          whiteSpace: "pre-wrap",
          overflowX: "hidden",
          overflowY: "auto",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      />

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
            color: theme.punct,
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
          onClick={() => insertSnippet("Basic Beat")}
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.22)",
            color: theme.punct,
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
            color: theme.punct,
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

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            right: 14,
            bottom: 12,
            width: 320,
            maxHeight: 220,
            overflowY: "auto",
            zIndex: 4,
            background: "rgba(8,12,18,0.94)",
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            boxShadow: `0 12px 30px ${theme.glow}`,
            backdropFilter: "blur(8px)",
          }}
        >
          {filteredSuggestions.map((item, idx) => {
            const active = idx === clampedSuggestionIndex;
            return (
              <button
                key={`${item.label}-${idx}`}
                onClick={() => applySuggestion(item)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderBottom:
                    idx < filteredSuggestions.length - 1
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
                  background: active ? "rgba(0,255,136,0.14)" : "transparent",
                  color: active ? "#d9ffee" : theme.text,
                  padding: "8px 10px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: editorFontFamily,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontFamily: editorFontFamily,
                      fontSize: 10,
                      opacity: 0.72,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.detail}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: editorFontFamily,
                    fontSize: 10,
                    opacity: 0.78,
                  }}
                >
                  {item.doc}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeSignature && signatureContext && (
        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: diagnostics.length > 0 ? 72 : 12,
            maxWidth: 420,
            zIndex: 4,
            background: "rgba(8,12,18,0.94)",
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            boxShadow: `0 10px 24px ${theme.glow}`,
            padding: "8px 10px",
            fontFamily: editorFontFamily,
          }}
        >
          <div style={{ fontSize: 11, color: "#d9ffee", marginBottom: 4 }}>
            {activeSignature.name}(
            {activeSignature.params.map((param, idx) => (
              <span
                key={`${param}-${idx}`}
                style={{
                  color:
                    idx === signatureContext.argIndex ? "#00ff88" : theme.text,
                  fontWeight: idx === signatureContext.argIndex ? 700 : 400,
                }}
              >
                {idx > 0 ? ", " : ""}
                {param}
              </span>
            ))}
            )
          </div>
          <div style={{ fontSize: 10, color: theme.comment }}>
            {activeSignature.doc}
          </div>
          {activeSignature.example && (
            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                color: theme.string,
                opacity: 0.95,
              }}
            >
              e.g. {activeSignature.example}
            </div>
          )}
        </div>
      )}

      {diagnostics.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 10,
            zIndex: 4,
            background: "rgba(38,18,18,0.86)",
            border: "1px solid rgba(255,130,130,0.35)",
            borderRadius: 8,
            padding: "6px 8px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: editorFontFamily,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: diagnostics.some((d) => d.severity === "error")
                ? "#ff9b9b"
                : "#ffd39b",
              textTransform: "uppercase",
              letterSpacing: 0.6,
              fontWeight: 700,
            }}
          >
            Diagnostics {activeDiagnosticIndex + 1}/{diagnostics.length}
          </span>

          <button
            onClick={() =>
              setActiveDiagnosticIndex(
                (prev) => (prev - 1 + diagnostics.length) % diagnostics.length,
              )
            }
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.22)",
              color: "#f3d4d4",
              borderRadius: 4,
              padding: "1px 6px",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            ‹
          </button>

          <button
            onClick={() =>
              setActiveDiagnosticIndex(
                (prev) => (prev + 1) % diagnostics.length,
              )
            }
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.22)",
              color: "#f3d4d4",
              borderRadius: 4,
              padding: "1px 6px",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            ›
          </button>

          {currentDiagnostic && (
            <button
              onClick={() => jumpToDiagnostic(currentDiagnostic)}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                color: "#ffd8d8",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 10,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title="Jump to diagnostic"
            >
              {currentDiagnostic.message} at line {currentDiagnostic.line + 1},
              col {currentDiagnostic.column + 1}
            </button>
          )}

          {hasQuickFix && (
            <>
              <button
                onClick={applyQuickFix}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.22)",
                  color: "#ffe8cf",
                  borderRadius: 4,
                  padding: "2px 8px",
                  cursor: "pointer",
                  fontSize: 10,
                  whiteSpace: "nowrap",
                }}
              >
                Quick Fix
              </button>

              {currentQuickFix && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#f9dfba",
                    opacity: 0.95,
                    whiteSpace: "nowrap",
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={currentQuickFix.label}
                >
                  {currentQuickFix.label}
                </span>
              )}
            </>
          )}

          {fixableDiagnosticCount > 1 && (
            <button
              onClick={applyAllSafeFixes}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.28)",
                color: "#ffe8cf",
                borderRadius: 4,
                padding: "2px 8px",
                cursor: "pointer",
                fontSize: 10,
                whiteSpace: "nowrap",
              }}
              title="Apply a chain of non-destructive quick fixes"
            >
              Apply All Safe ({fixableDiagnosticCount})
            </button>
          )}

          {quickFixHistory.length > 0 && (
            <button
              onClick={revertLastQuickFix}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.28)",
                color: "#d7ecff",
                borderRadius: 4,
                padding: "2px 8px",
                cursor: "pointer",
                fontSize: 10,
                whiteSpace: "nowrap",
              }}
              title="Undo the most recent quick-fix operation"
            >
              Revert Last Fix
            </button>
          )}
        </div>
      )}

      {lineMarkers.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 2,
            top: editorTopInset,
            bottom: 56,
            width: 10,
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          {lineMarkers.map((marker) => {
            const top = marker.line * editorFontSize * 1.75 - scrollTop;
            const visible = top > -10 && top < 9999;
            if (!visible) return null;
            return (
              <button
                key={marker.id}
                onClick={() => jumpToDiagnostic(marker)}
                title={`Line ${marker.line + 1}: ${marker.message}`}
                style={{
                  position: "absolute",
                  top,
                  left: 1,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "none",
                  background:
                    marker.severity === "error" ? "#ff7d7d" : "#ffcf7d",
                  boxShadow:
                    marker.severity === "error"
                      ? "0 0 8px rgba(255,125,125,0.6)"
                      : "0 0 8px rgba(255,207,125,0.6)",
                  cursor: "pointer",
                  pointerEvents: "auto",
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      )}

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          overflow: "hidden",
          pointerEvents: "none",
          fontFamily: editorFontFamily,
          fontSize: editorFontSize,
          lineHeight: 1.75,
          color: theme.text,
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: `${editorTopInset}px 18px 16px`,
            fontFamily: editorFontFamily,
            fontSize: editorFontSize,
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            transform: `translate(0px, ${-scrollTop}px)`,
          }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>

      <style>{`
        .active-note-token {
          background: ${theme.activeBg};
          color: #ffffff;
          border-radius: 3px;
          box-shadow: ${theme.activeShadow};
        }
        .tok-comment {
          color: ${theme.comment};
          font-style: italic;
        }
        .tok-string {
          color: ${theme.string};
        }
        .tok-number {
          color: ${theme.number};
        }
        .tok-keyword {
          color: ${theme.keyword};
          font-weight: 600;
        }
        .tok-ident {
          color: ${theme.ident};
        }
        .tok-note {
          color: ${theme.note};
          text-shadow: 0 0 10px ${theme.glow};
        }
        .tok-punct {
          color: ${theme.punct};
        }
        .tok-operator {
          color: ${theme.operator};
        }
        .tok-diag-error {
          text-decoration-line: underline;
          text-decoration-style: wavy;
          text-decoration-color: rgba(255, 115, 115, 0.95);
          text-decoration-thickness: 1.5px;
        }
        .tok-diag-warn {
          text-decoration-line: underline;
          text-decoration-style: wavy;
          text-decoration-color: rgba(255, 196, 112, 0.95);
          text-decoration-thickness: 1.5px;
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          right: 14,
          top: 10,
          zIndex: 3,
          fontFamily: editorFontFamily,
          fontSize: 10,
          color: theme.comment,
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
            bottom: diagnostics.length > 0 ? 58 : 12,
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
