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

type SynthWaveform =
  | "sine"
  | "triangle"
  | "sawtooth"
  | "square"
  | "white"
  | "pink"
  | "brown";

type SynthFxBuilderState = {
  waveform: SynthWaveform;
  notes: string;
  cpm: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  lpf: number;
  room: number;
  delay: number;
  phaser: number;
  pan: number;
  distort: number;
  crush: number;
  gain: number;
};

const SYNTH_MACROS: Array<{ id: string; label: string; code: string }> = [
  {
    id: "macro-lofi-hat",
    label: "Lo-fi Hat",
    code: 's("hh*16").bank("RolandTR909").gain(0.18).hpf(7200).crush(6).cpm(124)',
  },
  {
    id: "macro-dub-lead",
    label: "Dub Delay Lead",
    code: 'note("d4 f4 a4 c5").sound("sawtooth").adsr("0.01:0.08:0.5:0.22").lpf(1800).delay(0.72).delaytime(0.25).delayfeedback(0.55).room(0.35).gain(0.55).cpm(88)',
  },
  {
    id: "macro-sidechain-pad",
    label: "Sidechain Pad",
    code: 'stack(\n  note("c4 e4 g4 b4").sound("triangle").adsr("0.08:0.2:0.7:0.4").room(0.55).orbit(2).gain(0.4),\n  s("bd*4").bank("RolandTR909").duckorbit(2).duckattack(0.15).duckdepth(1)\n).cpm(120)',
  },
];

const DEFAULT_BUILDER: SynthFxBuilderState = {
  waveform: "triangle",
  notes: "c3 e3 g3 b3",
  cpm: 110,
  attack: 0.01,
  decay: 0.08,
  sustain: 0.6,
  release: 0.2,
  lpf: 1400,
  room: 0.22,
  delay: 0.0,
  phaser: 0.0,
  pan: 0.5,
  distort: 0.0,
  crush: 0,
  gain: 0.55,
};

function formatNumber(value: number, digits = 3): string {
  return Number.parseFloat(value.toFixed(digits)).toString();
}

function buildSynthFxChain(state: SynthFxBuilderState): string {
  const parts = [
    `note("${state.notes.trim() || DEFAULT_BUILDER.notes}")`,
    `.sound("${state.waveform}")`,
    `.adsr("${formatNumber(state.attack)}:${formatNumber(state.decay)}:${formatNumber(state.sustain)}:${formatNumber(state.release)}")`,
    `.gain(${formatNumber(state.gain)})`,
    `.pan(${formatNumber(state.pan)})`,
  ];

  if (state.lpf > 0) parts.push(`.lpf(${Math.round(state.lpf)})`);
  if (state.room > 0) parts.push(`.room(${formatNumber(state.room)})`);
  if (state.delay > 0) parts.push(`.delay(${formatNumber(state.delay)})`);
  if (state.phaser > 0) parts.push(`.phaser(${formatNumber(state.phaser)})`);
  if (state.distort > 0) parts.push(`.distort(${formatNumber(state.distort)})`);
  if (state.crush > 0) parts.push(`.crush(${Math.round(state.crush)})`);

  parts.push(`.cpm(${Math.round(state.cpm)})`);
  return parts.join("");
}

function buildFxTail(state: SynthFxBuilderState): string {
  const parts: string[] = [];
  if (state.lpf > 0) parts.push(`.lpf(${Math.round(state.lpf)})`);
  if (state.room > 0) parts.push(`.room(${formatNumber(state.room)})`);
  if (state.delay > 0) parts.push(`.delay(${formatNumber(state.delay)})`);
  if (state.phaser > 0) parts.push(`.phaser(${formatNumber(state.phaser)})`);
  if (state.distort > 0) parts.push(`.distort(${formatNumber(state.distort)})`);
  if (state.crush > 0) parts.push(`.crush(${Math.round(state.crush)})`);
  parts.push(`.gain(${formatNumber(state.gain)})`);
  return parts.join("");
}

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
  const [builder, setBuilder] = useState<SynthFxBuilderState>(DEFAULT_BUILDER);
  const [auditionStatusById, setAuditionStatusById] = useState<
    Record<string, AuditionStatus>
  >({});

  const chainSnippet = buildSynthFxChain(builder);
  const fxTailSnippet = buildFxTail(builder);

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
          borderBottom: "1px solid rgba(255,255,255,0.08)",
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
          SYNTH + FX BUILDER
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
          >
            <select
              value={builder.waveform}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  waveform: event.target.value as SynthWaveform,
                }))
              }
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                color: "#d7e8fb",
                fontSize: 12,
                padding: "7px 9px",
              }}
            >
              <option value="triangle">triangle</option>
              <option value="sine">sine</option>
              <option value="sawtooth">sawtooth</option>
              <option value="square">square</option>
              <option value="white">white</option>
              <option value="pink">pink</option>
              <option value="brown">brown</option>
            </select>
            <input
              value={builder.cpm}
              type="number"
              min={40}
              max={220}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  cpm: Number(event.target.value || prev.cpm),
                }))
              }
              placeholder="cpm"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                color: "#d7e8fb",
                fontSize: 12,
                padding: "7px 9px",
              }}
            />
          </div>

          <input
            value={builder.notes}
            onChange={(event) =>
              setBuilder((prev) => ({ ...prev, notes: event.target.value }))
            }
            placeholder="Notes pattern, e.g. c3 e3 g3 b3"
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

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
          >
            <input
              value={builder.attack}
              type="number"
              step={0.01}
              min={0}
              max={2}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  attack: Number(event.target.value || prev.attack),
                }))
              }
              placeholder="attack"
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
              value={builder.decay}
              type="number"
              step={0.01}
              min={0}
              max={2}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  decay: Number(event.target.value || prev.decay),
                }))
              }
              placeholder="decay"
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
              value={builder.sustain}
              type="number"
              step={0.01}
              min={0}
              max={1}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  sustain: Number(event.target.value || prev.sustain),
                }))
              }
              placeholder="sustain"
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
              value={builder.release}
              type="number"
              step={0.01}
              min={0}
              max={3}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  release: Number(event.target.value || prev.release),
                }))
              }
              placeholder="release"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                color: "#d7e8fb",
                fontSize: 12,
                padding: "7px 9px",
              }}
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
          >
            <input
              value={builder.lpf}
              type="number"
              min={0}
              max={20000}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  lpf: Number(event.target.value || 0),
                }))
              }
              placeholder="lpf"
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
              value={builder.room}
              type="number"
              step={0.01}
              min={0}
              max={1}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  room: Number(event.target.value || 0),
                }))
              }
              placeholder="room"
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
              value={builder.delay}
              type="number"
              step={0.01}
              min={0}
              max={1}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  delay: Number(event.target.value || 0),
                }))
              }
              placeholder="delay"
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
              value={builder.phaser}
              type="number"
              step={0.1}
              min={0}
              max={12}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  phaser: Number(event.target.value || 0),
                }))
              }
              placeholder="phaser"
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
              value={builder.pan}
              type="number"
              step={0.01}
              min={0}
              max={1}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  pan: Number(event.target.value || 0.5),
                }))
              }
              placeholder="pan"
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
              value={builder.gain}
              type="number"
              step={0.01}
              min={0}
              max={2}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  gain: Number(event.target.value || 0.5),
                }))
              }
              placeholder="gain"
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
              value={builder.distort}
              type="number"
              step={0.1}
              min={0}
              max={12}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  distort: Number(event.target.value || 0),
                }))
              }
              placeholder="distort"
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
              value={builder.crush}
              type="number"
              step={1}
              min={0}
              max={16}
              onChange={(event) =>
                setBuilder((prev) => ({
                  ...prev,
                  crush: Number(event.target.value || 0),
                }))
              }
              placeholder="crush"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                color: "#d7e8fb",
                fontSize: 12,
                padding: "7px 9px",
              }}
            />
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.53)",
              fontSize: 10,
              fontFamily: '"JetBrains Mono", monospace',
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "6px 8px",
              maxHeight: 56,
              overflow: "auto",
            }}
          >
            {chainSnippet}
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
          >
            <button
              type="button"
              onClick={() => onInsertCode(chainSnippet)}
              style={{
                border: "1px solid rgba(0,255,136,0.34)",
                borderRadius: 8,
                background: "rgba(0,255,136,0.1)",
                color: "#b6ffdb",
                fontSize: 11,
                padding: "6px 8px",
                cursor: "pointer",
              }}
            >
              Insert Synth Chain
            </button>
            <button
              type="button"
              onClick={() => {
                setAuditionStatusById((prev) => ({
                  ...prev,
                  "builder-main": "loading",
                }));
                void onAuditionCode(chainSnippet)
                  .then(() => {
                    setAuditionStatusById((prev) => ({
                      ...prev,
                      "builder-main": "ready",
                    }));
                  })
                  .catch(() => {
                    setAuditionStatusById((prev) => ({
                      ...prev,
                      "builder-main": "error",
                    }));
                  });
              }}
              style={{
                border: "1px solid rgba(122,230,255,0.35)",
                borderRadius: 8,
                background: "rgba(122,230,255,0.11)",
                color: "#c6f5ff",
                fontSize: 11,
                padding: "6px 8px",
                cursor: "pointer",
              }}
            >
              Audition Chain
            </button>
          </div>

          <button
            type="button"
            onClick={() => onInsertCode(fxTailSnippet)}
            style={{
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 8,
              background: "rgba(255,255,255,0.08)",
              color: "#e8edf4",
              fontSize: 11,
              padding: "6px 8px",
              cursor: "pointer",
            }}
          >
            Insert FX Tail
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SYNTH_MACROS.map((macro) => (
            <button
              key={macro.id}
              type="button"
              onClick={() => onInsertCode(macro.code)}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                color: "#d6deea",
                fontSize: 10,
                padding: "4px 9px",
                cursor: "pointer",
              }}
              title={macro.code}
            >
              {macro.label}
            </button>
          ))}
        </div>
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
