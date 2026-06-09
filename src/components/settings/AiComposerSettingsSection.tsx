import { useState } from "react";
import type { AiApplyMode, AiProvider } from "../../hooks/useAiMusicComposer";

type AiComposerSettingsSectionProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  provider: AiProvider;
  onProviderChange: (provider: AiProvider) => void;
  applyMode: AiApplyMode;
  onApplyModeChange: (mode: AiApplyMode) => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onClearApiKey: () => void;
  rememberApiKey: boolean;
  onRememberApiKeyChange: (remember: boolean) => void;
};

export function AiComposerSettingsSection({
  enabled,
  onEnabledChange,
  provider,
  onProviderChange,
  applyMode,
  onApplyModeChange,
  apiKey,
  onApiKeyChange,
  onClearApiKey,
  rememberApiKey,
  onRememberApiKeyChange,
}: AiComposerSettingsSectionProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <section>
      <p
        style={{
          fontSize: 10,
          color: "#333",
          marginBottom: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          fontFamily: '"JetBrains Mono",monospace',
        }}
      >
        AI Composer
      </p>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          fontFamily: '"JetBrains Mono",monospace',
          fontSize: 11,
          color: "#555",
        }}
      >
        Enable AI Prompt Composer
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
      </label>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          opacity: enabled ? 1 : 0.62,
          pointerEvents: enabled ? "auto" : "none",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 10,
              color: "#333",
              marginBottom: 6,
              letterSpacing: 1,
              textTransform: "uppercase",
              fontFamily: '"JetBrains Mono",monospace',
            }}
          >
            Provider
          </p>
          <select
            value={provider}
            onChange={(event) =>
              onProviderChange(event.target.value as AiProvider)
            }
            style={{
              width: "100%",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.03)",
              color: "#9ec3b8",
              padding: "8px 10px",
              fontSize: 12,
              fontFamily: '"JetBrains Mono",monospace',
            }}
          >
            <option value="chatgpt">ChatGPT (OpenAI)</option>
            <option value="gemini">Gemini (Google)</option>
          </select>
        </div>

        <div>
          <p
            style={{
              fontSize: 10,
              color: "#333",
              marginBottom: 6,
              letterSpacing: 1,
              textTransform: "uppercase",
              fontFamily: '"JetBrains Mono",monospace',
            }}
          >
            Apply Mode
          </p>
          <select
            value={applyMode}
            onChange={(event) =>
              onApplyModeChange(event.target.value as AiApplyMode)
            }
            style={{
              width: "100%",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.03)",
              color: "#9ec3b8",
              padding: "8px 10px",
              fontSize: 12,
              fontFamily: '"JetBrains Mono",monospace',
            }}
          >
            <option value="replace">Replace editor code</option>
            <option value="append">Append to current code</option>
          </select>
        </div>

        <div>
          <p
            style={{
              fontSize: 10,
              color: "#333",
              marginBottom: 6,
              letterSpacing: 1,
              textTransform: "uppercase",
              fontFamily: '"JetBrains Mono",monospace',
            }}
          >
            API Key
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(event) => onApiKeyChange(event.target.value)}
              placeholder={provider === "chatgpt" ? "sk-..." : "AIza..."}
              style={{
                flex: 1,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.03)",
                color: "#9ec3b8",
                padding: "8px 10px",
                fontSize: 12,
                fontFamily: '"JetBrains Mono",monospace',
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              style={{
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                color: "#7fb4a3",
                padding: "0 10px",
                fontSize: 11,
                fontFamily: '"JetBrains Mono",monospace',
                cursor: "pointer",
              }}
            >
              {showKey ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              onClick={onClearApiKey}
              style={{
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                color: "#7fb4a3",
                padding: "0 10px",
                fontSize: 11,
                fontFamily: '"JetBrains Mono",monospace',
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: 11,
            color: "#555",
          }}
        >
          Remember API key locally
          <input
            type="checkbox"
            checked={rememberApiKey}
            onChange={(event) => onRememberApiKeyChange(event.target.checked)}
          />
        </label>
      </div>
    </section>
  );
}
