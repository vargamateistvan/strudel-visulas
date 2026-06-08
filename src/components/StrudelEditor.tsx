import React, { useCallback, useEffect, useState } from "react";
import { type StrudelStatus } from "../hooks/useStrudel";
import { type EditorColorPreset } from "./SettingsDrawer";
import { LoadingOverlay } from "./LoadingOverlay";

interface StrudelEditorProps {
  code: string;
  play: (code: string) => Promise<void>;
  stop: () => void;
  status: StrudelStatus;
  error: string | null;
  loadMsg: string;
  opacity: number;
  colorPreset: EditorColorPreset;
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
      out += `<span class="tok-number">${escapeHtml(numberMatch[0])}</span>`;
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
      const classes = active ? "tok-note active-note-token" : "tok-note";
      out += `<span class="${classes}">${escapeHtml(token)}</span>`;
      i += token.length;
      previousIdent = "";
      continue;
    }

    const identMatch = code.slice(i).match(IDENT_RE);
    if (identMatch) {
      const token = identMatch[0];
      const isActiveControl = controlSet.has(token.toLowerCase());
      if (STRUDEL_KEYWORDS.has(token)) {
        const klass = isActiveControl
          ? "tok-keyword active-note-token"
          : "tok-keyword";
        out += `<span class="${klass}">${escapeHtml(token)}</span>`;
      } else {
        const klass = isActiveControl
          ? "tok-ident active-note-token"
          : "tok-ident";
        out += `<span class="${klass}">${escapeHtml(token)}</span>`;
      }
      i += token.length;
      previousIdent = token;
      continue;
    }

    if ("[](){}<>.,:;~".includes(char)) {
      out += `<span class="tok-punct">${escapeHtml(char)}</span>`;
      i += 1;
      if (!isWhitespace(char)) previousIdent = "";
      continue;
    }

    if ("+-*/=%!&|".includes(char)) {
      out += `<span class="tok-operator">${escapeHtml(char)}</span>`;
      i += 1;
      previousIdent = "";
      continue;
    }

    if (isWhitespace(char)) {
      out += char === "\t" ? "  " : char;
      i += 1;
      continue;
    }

    out += escapeHtml(char);
    i += 1;
    previousIdent = "";
  }

  return out;
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
  activeNote,
  activeNotes = [],
  activeLiterals = [],
  activeControls = [],
  nPulse = 0,
  onCodeChange,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const updateCode = (c: string) => {
    onCodeChange?.(c);
  };
  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  const handlePlay = useCallback(() => play(code), [play, code]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        isPlaying ? stop() : handlePlay();
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
  const highlighted = renderHighlightedCode(
    code,
    activeNote,
    activeNotes,
    activeLiterals,
    activeControls,
    nPulse,
  );

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
      {error && (
        <div
          style={{
            padding: "6px 14px",
            flexShrink: 0,
            background: "rgba(255,51,102,0.1)",
            borderBottom: "1px solid rgba(255,51,102,0.2)",
            fontSize: 11,
            fontFamily: '"JetBrains Mono",monospace',
            color: "#ff3366",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      {/* textarea */}
      <textarea
        value={code}
        onChange={(e) => updateCode(e.target.value)}
        onScroll={(e) => {
          setScrollTop(e.currentTarget.scrollTop);
        }}
        onKeyDown={onKeyDown}
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
          padding: "16px 18px",
          fontFamily: '"JetBrains Mono",ui-monospace,monospace',
          fontSize: 13,
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
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          overflow: "hidden",
          pointerEvents: "none",
          fontFamily: '"JetBrains Mono",ui-monospace,monospace',
          fontSize: 13,
          lineHeight: 1.75,
          color: theme.text,
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: "16px 18px",
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
      `}</style>
    </div>
  );
};
