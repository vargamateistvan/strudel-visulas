import { useCallback, useMemo, useState } from "react";

export interface CodePreset {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

const PRESETS_KEY = "strudel:presets:v1";
const DRAFT_KEY = "strudel:draft:v1";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useLocalPresets = () => {
  const [presets, setPresets] = useState<CodePreset[]>(() => {
    const data = safeJsonParse<CodePreset[]>(
      localStorage.getItem(PRESETS_KEY),
      [],
    );
    return data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });

  const persist = useCallback((next: CodePreset[]) => {
    setPresets(next);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
  }, []);

  const saveAsNew = useCallback(
    (name: string, code: string) => {
      const ts = nowIso();
      const preset: CodePreset = {
        id: genId(),
        name: name.trim() || "Untitled Pattern",
        code,
        createdAt: ts,
        updatedAt: ts,
      };
      const next = [preset, ...presets].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
      persist(next);
      return preset;
    },
    [persist, presets],
  );

  const overwrite = useCallback(
    (id: string, code: string, name?: string) => {
      const ts = nowIso();
      const next = presets
        .map((p) =>
          p.id === id
            ? {
                ...p,
                code,
                name: (name ?? p.name).trim() || "Untitled Pattern",
                updatedAt: ts,
              }
            : p,
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      persist(next);
    },
    [persist, presets],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const ts = nowIso();
      const next = presets
        .map((p) =>
          p.id === id
            ? { ...p, name: name.trim() || "Untitled Pattern", updatedAt: ts }
            : p,
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      persist(next);
    },
    [persist, presets],
  );

  const remove = useCallback(
    (id: string) => {
      persist(presets.filter((p) => p.id !== id));
    },
    [persist, presets],
  );

  const getById = useCallback(
    (id: string) => presets.find((p) => p.id === id) ?? null,
    [presets],
  );

  const loadDraft = useCallback(() => localStorage.getItem(DRAFT_KEY), []);

  const saveDraft = useCallback((code: string) => {
    localStorage.setItem(DRAFT_KEY, code);
  }, []);

  return useMemo(
    () => ({
      presets,
      saveAsNew,
      overwrite,
      rename,
      remove,
      getById,
      loadDraft,
      saveDraft,
    }),
    [
      presets,
      saveAsNew,
      overwrite,
      rename,
      remove,
      getById,
      loadDraft,
      saveDraft,
    ],
  );
};
