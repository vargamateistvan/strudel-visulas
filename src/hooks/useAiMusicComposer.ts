import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildMusicCreationSkillInstruction,
  getMusicCreationSkillSystemPrompt,
} from "../ai/musicCreationSkill";

const AI_COMPOSER_ENABLED_KEY = "strudel:ai-composer:enabled:v1";
const AI_COMPOSER_PROVIDER_KEY = "strudel:ai-composer:provider:v1";
const AI_COMPOSER_PROMPT_KEY = "strudel:ai-composer:prompt:v1";
const AI_COMPOSER_APPLY_MODE_KEY = "strudel:ai-composer:apply-mode:v1";
const AI_COMPOSER_REMEMBER_KEY_KEY = "strudel:ai-composer:remember-key:v1";
const AI_COMPOSER_API_KEY_KEY = "strudel:ai-composer:api-key:v1";
const GEMINI_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

export type AiProvider = "chatgpt" | "gemini";
export type AiApplyMode = "replace" | "append";
export type AiGenerationIntent = "new" | "refine" | "variation";

type GenerateOptions = {
  currentCode: string;
  intent: AiGenerationIntent;
  promptOverride?: string;
};

function readBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value === "true";
}

function readProvider(value: string | null): AiProvider {
  return value === "gemini" ? "gemini" : "chatgpt";
}

function readApplyMode(value: string | null): AiApplyMode {
  return value === "append" ? "append" : "replace";
}

function stripCodeFence(content: string): string {
  const fenced = content.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return content.trim();
}

function normalizeAiGeneratedCode(source: string): string {
  let code = source;

  const normalizePitchBody = (body: string): string => {
    return body
      .replace(
        /\b([a-g](?:#|b)?)(?:m|maj|min|dim|aug)?\s*,\s*(-?\d+)\b/gi,
        "$1$2",
      )
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // If n() contains note names (letters), convert it to note() to avoid
  // "invalid scale step" errors from Strudel's numeric scale-step parser.
  code = code.replace(
    /\bn\(\s*(["'])([^"']*[A-Za-z][^"']*)\1\s*\)/g,
    (_match, _quote, body: string) => `note("${normalizePitchBody(body)}")`,
  );

  // Remove commas inside note/scale/chord-like string arguments.
  // This fixes common AI output like "g,5" or "em,5".
  code = code.replace(
    /(\b(?:note|chord|scale)\s*\(\s*["'])([^"']*)(["']\s*\))/g,
    (_match, head: string, body: string, tail: string) => {
      const normalizedBody = normalizePitchBody(body);
      return `${head}${normalizedBody}${tail}`;
    },
  );

  // Replace unknown sample token "sub" with a reliable kick token in
  // sound-pattern strings to avoid "sound sub not found" runtime failures.
  code = code.replace(
    /(\bsound\(\s*["'])([^"']*)(["']\s*\))/g,
    (_match, head: string, body: string, tail: string) => {
      const normalizedBody = body.replace(/\bsub\b/gi, "bd");
      return `${head}${normalizedBody}${tail}`;
    },
  );

  return code;
}

function parseProviderErrorBody(raw: string): {
  message: string;
  code: string | null;
  type: string | null;
} {
  try {
    const parsed = JSON.parse(raw) as {
      error?: {
        message?: string;
        code?: string | null;
        type?: string | null;
      };
    };
    return {
      message: parsed.error?.message ?? raw,
      code: parsed.error?.code ?? null,
      type: parsed.error?.type ?? null,
    };
  } catch {
    return {
      message: raw,
      code: null,
      type: null,
    };
  }
}

function toFriendlyProviderError(
  provider: AiProvider,
  status: number,
  rawBody: string,
): string {
  const parsed = parseProviderErrorBody(rawBody);
  const bodyMessage = parsed.message.trim();

  if (
    provider === "chatgpt" &&
    status === 429 &&
    (parsed.code === "insufficient_quota" ||
      bodyMessage.toLowerCase().includes("insufficient_quota") ||
      bodyMessage.toLowerCase().includes("exceeded your current quota"))
  ) {
    return "OpenAI quota exceeded for this API key. Update billing/quota in your OpenAI account, or switch provider to Gemini in Settings.";
  }

  if (status === 401 || status === 403) {
    return provider === "chatgpt"
      ? "OpenAI authentication failed. Verify your ChatGPT API key in Settings."
      : "Gemini authentication failed. Verify your Gemini API key in Settings.";
  }

  if (status === 429) {
    return provider === "chatgpt"
      ? "OpenAI rate limit reached. Wait a moment and retry, or switch provider to Gemini in Settings."
      : "Gemini rate limit reached. Wait a moment and retry.";
  }

  if (
    provider === "gemini" &&
    status === 404 &&
    bodyMessage.toLowerCase().includes("model")
  ) {
    return "Gemini model is unavailable or deprecated. The app will try fallback Gemini models automatically. If it still fails, update your Gemini API access/project settings.";
  }

  const label = provider === "chatgpt" ? "ChatGPT" : "Gemini";
  return `${label} request failed (${status}): ${bodyMessage}`;
}

async function requestChatGptCode(
  apiKey: string,
  systemInstruction: string,
  instruction: string,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: instruction,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(toFriendlyProviderError("chatgpt", response.status, text));
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content || content.trim().length === 0) {
    throw new Error("ChatGPT returned an empty response.");
  }

  return stripCodeFence(content);
}

async function requestGeminiCode(
  apiKey: string,
  systemInstruction: string,
  instruction: string,
): Promise<string> {
  let lastErrorMessage = "Gemini request failed.";

  for (const model of GEMINI_MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.8,
        },
        contents: [
          {
            role: "user",
            parts: [{ text: instruction }],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: systemInstruction,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      lastErrorMessage = toFriendlyProviderError(
        "gemini",
        response.status,
        text,
      );

      const isModelNotFound =
        response.status === 404 && text.toLowerCase().includes("model");

      if (isModelNotFound) {
        continue;
      }

      throw new Error(lastErrorMessage);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const content = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim();

    if (!content || content.length === 0) {
      throw new Error("Gemini returned an empty response.");
    }

    return stripCodeFence(content);
  }

  throw new Error(lastErrorMessage);
}

export function useAiMusicComposer() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    return readBoolean(localStorage.getItem(AI_COMPOSER_ENABLED_KEY), false);
  });
  const [provider, setProvider] = useState<AiProvider>(() => {
    return readProvider(localStorage.getItem(AI_COMPOSER_PROVIDER_KEY));
  });
  const [prompt, setPrompt] = useState<string>(() => {
    return (
      localStorage.getItem(AI_COMPOSER_PROMPT_KEY) ??
      "Warm melodic house groove at 118 BPM with soft bass and shimmering chords"
    );
  });
  const [applyMode, setApplyMode] = useState<AiApplyMode>(() => {
    return readApplyMode(localStorage.getItem(AI_COMPOSER_APPLY_MODE_KEY));
  });
  const [rememberApiKey, setRememberApiKey] = useState<boolean>(() => {
    return readBoolean(
      localStorage.getItem(AI_COMPOSER_REMEMBER_KEY_KEY),
      false,
    );
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    const remembered = readBoolean(
      localStorage.getItem(AI_COMPOSER_REMEMBER_KEY_KEY),
      false,
    );
    return remembered
      ? (localStorage.getItem(AI_COMPOSER_API_KEY_KEY) ?? "")
      : "";
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(AI_COMPOSER_ENABLED_KEY, String(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem(AI_COMPOSER_PROVIDER_KEY, provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem(AI_COMPOSER_PROMPT_KEY, prompt);
  }, [prompt]);

  useEffect(() => {
    localStorage.setItem(AI_COMPOSER_APPLY_MODE_KEY, applyMode);
  }, [applyMode]);

  useEffect(() => {
    localStorage.setItem(AI_COMPOSER_REMEMBER_KEY_KEY, String(rememberApiKey));
    if (rememberApiKey) {
      localStorage.setItem(AI_COMPOSER_API_KEY_KEY, apiKey);
      return;
    }
    localStorage.removeItem(AI_COMPOSER_API_KEY_KEY);
  }, [apiKey, rememberApiKey]);

  const canGenerate = useMemo(() => {
    return enabled && apiKey.trim().length > 0 && prompt.trim().length > 0;
  }, [apiKey, enabled, prompt]);

  const generate = useCallback(
    async ({
      currentCode,
      intent,
      promptOverride,
    }: GenerateOptions): Promise<string> => {
      const activePrompt = (promptOverride ?? prompt).trim();

      if (!enabled) {
        throw new Error("AI Composer is disabled.");
      }
      if (apiKey.trim().length === 0) {
        throw new Error("Add your API key first.");
      }
      if (activePrompt.length === 0) {
        throw new Error("Write a prompt first.");
      }

      setIsGenerating(true);
      setError(null);
      try {
        const systemInstruction = getMusicCreationSkillSystemPrompt();
        const instruction = buildMusicCreationSkillInstruction({
          prompt: activePrompt,
          currentCode,
          intent,
        });
        const nextCode =
          provider === "chatgpt"
            ? await requestChatGptCode(
                apiKey.trim(),
                systemInstruction,
                instruction,
              )
            : await requestGeminiCode(
                apiKey.trim(),
                systemInstruction,
                instruction,
              );
        const normalizedCode = normalizeAiGeneratedCode(nextCode);
        setLastUpdatedAt(Date.now());
        return normalizedCode;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : String(err ?? "Unknown error");
        setError(message);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiKey, enabled, prompt, provider],
  );

  const clearApiKey = useCallback(() => {
    setApiKey("");
    localStorage.removeItem(AI_COMPOSER_API_KEY_KEY);
  }, []);

  return {
    enabled,
    setEnabled,
    provider,
    setProvider,
    prompt,
    setPrompt,
    applyMode,
    setApplyMode,
    rememberApiKey,
    setRememberApiKey,
    apiKey,
    setApiKey,
    clearApiKey,
    isGenerating,
    error,
    setError,
    lastUpdatedAt,
    canGenerate,
    generate,
  };
}
