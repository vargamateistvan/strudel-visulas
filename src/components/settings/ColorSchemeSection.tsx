import type { ColorScheme, CustomColorPreset } from "../SettingsDrawer";

type ColorSchemeSectionProps = {
  colorScheme: ColorScheme;
  onColorScheme: (scheme: ColorScheme) => void;
  customColorPresets: CustomColorPreset[];
  activeCustomColorPresetId: string | null;
  onSelectCustomColorPreset: (id: string) => void;
  onCreateCustomColorPreset: () => void;
  onUpdateCustomColorPresetColor: (
    id: string,
    index: 0 | 1 | 2,
    color: string,
  ) => void;
  onRenameCustomColorPreset: (id: string, name: string) => void;
  onDeleteCustomColorPreset: (id: string) => void;
};

const SCHEMES: { key: ColorScheme; label: string; colors: string[] }[] = [
  { key: "neon", label: "Neon", colors: ["#00ff88", "#00ffff", "#ff00ff"] },
  { key: "pastel", label: "Pastel", colors: ["#87CEEB", "#DDA0DD", "#F0E68C"] },
  { key: "fire", label: "Fire", colors: ["#ff0000", "#ff7700", "#ffff00"] },
  { key: "ocean", label: "Ocean", colors: ["#001a4d", "#0073e6", "#00d9ff"] },
];

export function ColorSchemeSection({
  colorScheme,
  onColorScheme,
  customColorPresets,
  activeCustomColorPresetId,
  onSelectCustomColorPreset,
  onCreateCustomColorPreset,
  onUpdateCustomColorPresetColor,
  onRenameCustomColorPreset,
  onDeleteCustomColorPreset,
}: ColorSchemeSectionProps) {
  return (
    <section>
      <p
        style={{
          fontSize: 10,
          color: "var(--text-dim)",
          marginBottom: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          fontFamily: '"JetBrains Mono",monospace',
        }}
      >
        Color Scheme
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {SCHEMES.map(({ key, label, colors }) => (
          <button
            key={key}
            onClick={() => onColorScheme(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 6,
              border:
                colorScheme === key
                  ? `1px solid ${colors[0]}66`
                  : "1px solid var(--border-faint)",
              background:
                colorScheme === key ? `${colors[0]}18` : "var(--surface-1)",
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", gap: 3 }}>
              {colors.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: c,
                    boxShadow: colorScheme === key ? `0 0 6px ${c}` : "none",
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontSize: 12,
                fontFamily: '"JetBrains Mono",monospace',
                color: colorScheme === key ? colors[0] : "var(--text-soft)",
                fontWeight: colorScheme === key ? 700 : 400,
              }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 10,
          borderTop: "1px solid var(--surface-2)",
          paddingTop: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
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
              fontSize: 10,
              fontFamily: '"JetBrains Mono",monospace',
              letterSpacing: 1,
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}
          >
            Custom Presets
          </span>
          <button
            onClick={onCreateCustomColorPreset}
            style={{
              borderRadius: 6,
              border: "1px solid var(--border-accent)",
              background: "var(--surface-active)",
              color: "var(--primary)",
              fontSize: 10,
              fontFamily: '"JetBrains Mono",monospace',
              letterSpacing: 1,
              padding: "4px 7px",
              cursor: "pointer",
            }}
          >
            + Add
          </button>
        </div>

        {customColorPresets.map((preset) => {
          const isActive =
            colorScheme === "custom" && activeCustomColorPresetId === preset.id;
          return (
            <div
              key={preset.id}
              style={{
                borderRadius: 6,
                border: isActive
                  ? "1px solid var(--border-accent)"
                  : "1px solid var(--border-faint)",
                background: isActive
                  ? "var(--surface-active)"
                  : "var(--surface-1)",
                padding: "8px 8px 9px",
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  value={preset.name}
                  onChange={(e) =>
                    onRenameCustomColorPreset(preset.id, e.target.value)
                  }
                  onFocus={() => onSelectCustomColorPreset(preset.id)}
                  style={{
                    flex: 1,
                    background: "var(--surface-1)",
                    color: isActive ? "var(--primary)" : "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 5,
                    fontSize: 11,
                    fontFamily: '"JetBrains Mono",monospace',
                    padding: "4px 6px",
                  }}
                />
                <button
                  onClick={() => onSelectCustomColorPreset(preset.id)}
                  style={{
                    borderRadius: 5,
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface-1)",
                    color: "var(--text-soft)",
                    fontSize: 10,
                    fontFamily: '"JetBrains Mono",monospace',
                    letterSpacing: 1,
                    padding: "4px 6px",
                    cursor: "pointer",
                  }}
                >
                  Use
                </button>
                <button
                  onClick={() => onDeleteCustomColorPreset(preset.id)}
                  style={{
                    borderRadius: 5,
                    border: "1px solid rgba(255,122,122,0.24)",
                    background: "rgba(255,122,122,0.08)",
                    color: "#ff9a9a",
                    fontSize: 10,
                    fontFamily: '"JetBrains Mono",monospace',
                    letterSpacing: 1,
                    padding: "4px 6px",
                    cursor: "pointer",
                  }}
                >
                  Del
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {preset.colors.map((c, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      flex: 1,
                    }}
                  >
                    <input
                      type="color"
                      value={c}
                      onChange={(e) =>
                        onUpdateCustomColorPresetColor(
                          preset.id,
                          idx as 0 | 1 | 2,
                          e.target.value,
                        )
                      }
                      style={{
                        width: 26,
                        height: 20,
                        padding: 0,
                        border: "none",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: '"JetBrains Mono",monospace',
                        color: "var(--text-dim)",
                        textTransform: "uppercase",
                      }}
                    >
                      {idx + 1}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
