import { useState } from "react";
import {
  buildSampleAuditionSnippet,
  buildSampleInsertSnippet,
  buildSourceInsertSnippet,
  type CustomSampleSource,
  type SampleCategory,
  type SampleCatalogItem,
} from "../../hooks/useSampleWorkspace";

type AuditionStatus = "idle" | "loading" | "ready" | "error";

type SampleBrowserPanelProps = {
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
  onAddSource,
  onRemoveSource,
  onToggleSource,
}: SampleBrowserPanelProps) {
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [auditionStatusById, setAuditionStatusById] = useState<
    Record<string, AuditionStatus>
  >({});

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

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        border: "1px solid rgba(122,230,255,0.2)",
        background:
          "linear-gradient(180deg, rgba(9,14,24,0.95), rgba(6,10,16,0.92))",
        boxShadow: "0 18px 40px rgba(0,0,0,0.38)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            fontWeight: 700,
            color: "#7ae6ff",
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
                    ? "1px solid rgba(122,230,255,0.4)"
                    : "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  background: active
                    ? "rgba(122,230,255,0.16)"
                    : "rgba(255,255,255,0.03)",
                  color: active ? "#c8f6ff" : "rgba(255,255,255,0.74)",
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
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "8px 12px 10px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.56)",
            marginBottom: 6,
          }}
        >
          RECENT SOUNDS
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 12px 12px",
          display: "grid",
          gap: 8,
        }}
      >
        {filteredCatalog.map((item) => {
          const status = auditionStatusById[item.id] ?? "idle";
          const badge = badgeStyle(status);
          return (
            <div
              key={item.id}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                padding: 10,
                display: "grid",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ color: "#dbf3ff", fontSize: 12 }}>
                  {item.label}
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

              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                {item.description}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#9be8ff",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {item.bank ? `${item.token} · bank(${item.bank})` : item.token}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    onInsertCode(buildSampleInsertSnippet(item));
                    onAddRecentToken(item.token);
                  }}
                  style={{
                    flex: 1,
                    border: "1px solid rgba(0,255,136,0.34)",
                    borderRadius: 8,
                    background: "rgba(0,255,136,0.1)",
                    color: "#b6ffdb",
                    fontSize: 11,
                    padding: "6px 8px",
                    cursor: "pointer",
                  }}
                >
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleAudition(item);
                  }}
                  style={{
                    flex: 1,
                    border: "1px solid rgba(122,230,255,0.35)",
                    borderRadius: 8,
                    background: "rgba(122,230,255,0.11)",
                    color: "#c6f5ff",
                    fontSize: 11,
                    padding: "6px 8px",
                    cursor: "pointer",
                  }}
                >
                  Audition
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "10px 12px 12px",
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.56)",
          }}
        >
          CUSTOM SAMPLE SOURCES
        </div>

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
              fontSize: 12,
              padding: "7px 9px",
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
              fontSize: 12,
              padding: "7px 9px",
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
              background: "rgba(255,255,255,0.08)",
              color: "#f0f4f9",
              fontSize: 11,
              padding: "7px 9px",
              cursor: "pointer",
            }}
          >
            Add Source
          </button>
          {sourceError && (
            <div style={{ color: "#ff9fb3", fontSize: 11 }}>{sourceError}</div>
          )}
        </div>

        <div
          style={{ display: "grid", gap: 6, maxHeight: 180, overflowY: "auto" }}
        >
          {customSources.map((source) => {
            const status = auditionStatusById[source.id] ?? "idle";
            const badge = badgeStyle(status);
            return (
              <div
                key={source.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  padding: "7px 8px",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                      border: "1px solid rgba(122,230,255,0.35)",
                      borderRadius: 6,
                      background: "rgba(122,230,255,0.11)",
                      color: "#c6f5ff",
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
    </div>
  );
}
