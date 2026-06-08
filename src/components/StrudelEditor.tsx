import React, { useCallback, useEffect, useState } from "react";
import { DEFAULT_PATTERN, type StrudelStatus } from "../hooks/useStrudel";
import { LoadingOverlay } from "./LoadingOverlay";

interface StrudelEditorProps {
  play: (code: string) => Promise<void>;
  stop: () => void;
  status: StrudelStatus;
  error: string | null;
  loadMsg: string;
  opacity: number;
  activeNote: string | null;
  onCodeChange?: (code: string) => void;
}

const NOTE_TOKEN_RE = /\b([a-g](?:b|#)?\d*)\b/gi;
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

function renderHighlightedCode(
  code: string,
  activeNote: string | null,
): string {
  const activePitchClass = normalizePitchClass(activeNote);
  let out = "";

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
      out += `<span class="tok-string">${escapeHtml(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    const numberMatch = code.slice(i).match(NUMBER_RE);
    if (numberMatch) {
      out += `<span class="tok-number">${escapeHtml(numberMatch[0])}</span>`;
      i += numberMatch[0].length;
      continue;
    }

    NOTE_TOKEN_RE.lastIndex = 0;
    const noteMatch = code.slice(i).match(/^([a-g](?:b|#)?\d*)\b/i);
    if (noteMatch) {
      const token = noteMatch[0];
      const normalized = normalizePitchClass(token);
      const active = activePitchClass !== "" && normalized === activePitchClass;
      const classes = active ? "tok-note active-note-token" : "tok-note";
      out += `<span class="${classes}">${escapeHtml(token)}</span>`;
      i += token.length;
      continue;
    }

    const identMatch = code.slice(i).match(IDENT_RE);
    if (identMatch) {
      const token = identMatch[0];
      if (STRUDEL_KEYWORDS.has(token)) {
        out += `<span class="tok-keyword">${escapeHtml(token)}</span>`;
      } else {
        out += `<span class="tok-ident">${escapeHtml(token)}</span>`;
      }
      i += token.length;
      continue;
    }

    if ("[](){}<>.,:;~".includes(char)) {
      out += `<span class="tok-punct">${escapeHtml(char)}</span>`;
      i += 1;
      continue;
    }

    if ("+-*/=%!&|".includes(char)) {
      out += `<span class="tok-operator">${escapeHtml(char)}</span>`;
      i += 1;
      continue;
    }

    if (isWhitespace(char)) {
      out += char === " " ? "&nbsp;" : char === "\t" ? "&nbsp;&nbsp;" : char;
      i += 1;
      continue;
    }

    out += escapeHtml(char);
    i += 1;
  }

  return out;
}

export const StrudelEditor: React.FC<StrudelEditorProps> = ({
  play,
  stop,
  status,
  error,
  loadMsg,
  opacity,
  activeNote,
  onCodeChange,
}) => {
  const [code, setCode] = useState(DEFAULT_PATTERN);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const updateCode = (c: string) => {
    setCode(c);
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
  const highlighted = renderHighlightedCode(code, activeNote);

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
        border: "1px solid rgba(0,255,136,0.12)",
        boxShadow:
          "0 0 40px rgba(0,255,136,0.08), inset 0 0 30px rgba(0,0,0,0.2)",
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
          setScrollLeft(e.currentTarget.scrollLeft);
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
          caretColor: "#00ff88",
          whiteSpace: "pre",
          overflow: "auto",
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
          color: `rgba(200,255,220,${Math.max(opacity, 0.6)})`,
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: "16px 18px",
            whiteSpace: "pre",
            transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
          }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>

      <style>{`
        .active-note-token {
          background: rgba(0, 255, 136, 0.28);
          color: #ffffff;
          border-radius: 3px;
          box-shadow: 0 0 14px rgba(0, 255, 136, 0.55);
        }
        .tok-comment {
          color: rgba(120, 140, 140, 0.9);
          font-style: italic;
        }
        .tok-string {
          color: #b7f7d3;
        }
        .tok-number {
          color: #f3d17a;
        }
        .tok-keyword {
          color: #7ae6ff;
          font-weight: 600;
        }
        .tok-ident {
          color: rgba(200,255,220,${Math.max(opacity, 0.72)});
        }
        .tok-note {
          color: #8dffb8;
          text-shadow: 0 0 10px rgba(0, 255, 136, 0.16);
        }
        .tok-punct {
          color: rgba(182, 255, 214, 0.9);
        }
        .tok-operator {
          color: #6fdcff;
        }
      `}</style>
    </div>
  );
};
