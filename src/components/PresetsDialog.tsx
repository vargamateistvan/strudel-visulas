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
                          window.confirm(`Delete preset \"${preset.name}\"?`)
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
