import React, { useMemo, useState } from "react";
import type { CodePreset } from "../hooks/useLocalPresets";

interface PresetsDialogProps {
  open: boolean;
  onClose: () => void;
  currentCode: string;
  presets: CodePreset[];
  onSaveAsNew: (name: string, code: string) => void;
  onOverwrite: (id: string, code: string, name?: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onLoad: (id: string) => void;
}

function slugifyName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildExportBaseName(newName: string): string {
  const fromName = slugifyName(newName);
  if (fromName) return fromName;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `strudel-pattern-${stamp}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createHtmlExport(code: string): string {
  const escaped = escapeHtml(code);
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    "  <title>Strudel Pattern Export</title>",
    "  <style>",
    "    body { margin: 0; padding: 24px; background: #090d14; color: #d6ffe7; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace; }",
    "    h1 { margin: 0 0 12px; font-size: 16px; color: #00ff88; letter-spacing: 0.08em; }",
    "    pre { margin: 0; padding: 16px; border: 1px solid rgba(0,255,136,0.35); border-radius: 10px; background: rgba(255,255,255,0.03); overflow: auto; white-space: pre-wrap; }",
    "  </style>",
    "</head>",
    "<body>",
    "  <h1>Strudel Pattern</h1>",
    `  <pre><code>${escaped}</code></pre>`,
    "</body>",
    "</html>",
  ].join("\n");
}

function downloadContent(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export const PresetsDialog: React.FC<PresetsDialogProps> = ({
  open,
  onClose,
  currentCode,
  presets,
  onSaveAsNew,
  onOverwrite,
  onRename,
  onDelete,
  onLoad,
}) => {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter((p) => p.name.toLowerCase().includes(q));
  }, [presets, query]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(820px, 94vw)",
          maxHeight: "82vh",
          overflow: "hidden",
          borderRadius: 12,
          border: "1px solid rgba(0,255,136,0.22)",
          background: "rgba(6,8,14,0.96)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.45), 0 0 36px rgba(0,255,136,0.16)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontWeight: 700,
              letterSpacing: 2,
              color: "#00ff88",
              fontSize: 12,
            }}
          >
            PRESETS
          </div>
          <div style={{ color: "#667", fontSize: 12 }}>
            {presets.length} saved
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#889",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: 11,
            }}
          >
            CLOSE
          </button>
        </div>

        <div
          style={{
            padding: 16,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Preset name"
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#d8ffe8",
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: 12,
            }}
          />
          <button
            onClick={() => {
              onSaveAsNew(newName, currentCode);
              setNewName("");
            }}
            style={{
              background: "linear-gradient(135deg,#00ff88,#00ffcc)",
              border: "none",
              color: "#03140c",
              borderRadius: 8,
              padding: "10px 14px",
              fontFamily: '"JetBrains Mono",monospace',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            SAVE AS NEW
          </button>
          <button
            onClick={() => {
              const base = buildExportBaseName(newName);
              downloadContent(
                `${base}.txt`,
                currentCode,
                "text/plain;charset=utf-8",
              );
            }}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#d3dde8",
              borderRadius: 8,
              padding: "10px 12px",
              fontFamily: '"JetBrains Mono",monospace',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 0.8,
              cursor: "pointer",
            }}
          >
            EXPORT .TXT
          </button>
          <button
            onClick={() => {
              const base = buildExportBaseName(newName);
              const html = createHtmlExport(currentCode);
              downloadContent(`${base}.html`, html, "text/html;charset=utf-8");
            }}
            style={{
              background: "rgba(0,220,255,0.12)",
              border: "1px solid rgba(0,220,255,0.28)",
              color: "#7ae6ff",
              borderRadius: 8,
              padding: "10px 12px",
              fontFamily: '"JetBrains Mono",monospace',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 0.8,
              cursor: "pointer",
            }}
          >
            EXPORT .HTML
          </button>
        </div>

        <div style={{ padding: "10px 16px" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search presets"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "9px 12px",
              color: "#cbe9d6",
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: 12,
            }}
          />
        </div>

        <div style={{ padding: "0 16px 16px", overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div
              style={{
                color: "#667",
                fontSize: 12,
                textAlign: "center",
                padding: 24,
              }}
            >
              No presets found.
            </div>
          ) : (
            filtered.map((preset) => (
              <div
                key={preset.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {editingId === preset.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(0,255,136,0.2)",
                        borderRadius: 6,
                        padding: "6px 8px",
                        color: "#d8ffe8",
                        fontFamily: '"JetBrains Mono",monospace',
                        fontSize: 12,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        color: "#d8ffe8",
                        fontFamily: '"JetBrains Mono",monospace',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {preset.name}
                    </div>
                  )}

                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button
                      onClick={() => onLoad(preset.id)}
                      style={{
                        background: "rgba(0,255,136,0.14)",
                        border: "1px solid rgba(0,255,136,0.35)",
                        color: "#00ff88",
                        borderRadius: 6,
                        padding: "6px 9px",
                        cursor: "pointer",
                        fontFamily: '"JetBrains Mono",monospace',
                        fontSize: 10,
                      }}
                    >
                      LOAD
                    </button>
                    <button
                      onClick={() => onOverwrite(preset.id, currentCode)}
                      style={{
                        background: "rgba(0,220,255,0.1)",
                        border: "1px solid rgba(0,220,255,0.28)",
                        color: "#7ae6ff",
                        borderRadius: 6,
                        padding: "6px 9px",
                        cursor: "pointer",
                        fontFamily: '"JetBrains Mono",monospace',
                        fontSize: 10,
                      }}
                    >
                      OVERWRITE
                    </button>
                    <button
                      onClick={() => {
                        const base = buildExportBaseName(preset.name);
                        downloadContent(
                          `${base}.txt`,
                          preset.code,
                          "text/plain;charset=utf-8",
                        );
                      }}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        color: "#cfd7e2",
                        borderRadius: 6,
                        padding: "6px 9px",
                        cursor: "pointer",
                        fontFamily: '"JetBrains Mono",monospace',
                        fontSize: 10,
                      }}
                    >
                      TXT
                    </button>
                    <button
                      onClick={() => {
                        const base = buildExportBaseName(preset.name);
                        const html = createHtmlExport(preset.code);
                        downloadContent(
                          `${base}.html`,
                          html,
                          "text/html;charset=utf-8",
                        );
                      }}
                      style={{
                        background: "rgba(0,220,255,0.1)",
                        border: "1px solid rgba(0,220,255,0.28)",
                        color: "#7ae6ff",
                        borderRadius: 6,
                        padding: "6px 9px",
                        cursor: "pointer",
                        fontFamily: '"JetBrains Mono",monospace',
                        fontSize: 10,
                      }}
                    >
                      HTML
                    </button>
                    {editingId === preset.id ? (
                      <button
                        onClick={() => {
                          onRename(preset.id, editingName);
                          setEditingId(null);
                          setEditingName("");
                        }}
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.18)",
                          color: "#d9dfe8",
                          borderRadius: 6,
                          padding: "6px 9px",
                          cursor: "pointer",
                          fontFamily: '"JetBrains Mono",monospace',
                          fontSize: 10,
                        }}
                      >
                        OK
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(preset.id);
                          setEditingName(preset.name);
                        }}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.14)",
                          color: "#b7bfca",
                          borderRadius: 6,
                          padding: "6px 9px",
                          cursor: "pointer",
                          fontFamily: '"JetBrains Mono",monospace',
                          fontSize: 10,
                        }}
                      >
                        RENAME
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (
                          window.confirm(`Delete preset "${preset.name}"?`)
                        ) {
                          onDelete(preset.id);
                        }
                      }}
                      style={{
                        background: "rgba(255,56,96,0.1)",
                        border: "1px solid rgba(255,56,96,0.28)",
                        color: "#ff7d99",
                        borderRadius: 6,
                        padding: "6px 9px",
                        cursor: "pointer",
                        fontFamily: '"JetBrains Mono",monospace',
                        fontSize: 10,
                      }}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    color: "#63707d",
                    fontSize: 10,
                    marginTop: 6,
                    fontFamily: '"JetBrains Mono",monospace',
                  }}
                >
                  updated {formatDate(preset.updatedAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
