import { useCallback, useMemo, useState } from "react";

export type SampleCategory =
  | "drums"
  | "perc"
  | "fx"
  | "instruments"
  | "synths"
  | "user";

export type SampleKind = "sample" | "synth";

export type SampleCatalogItem = {
  id: string;
  label: string;
  token: string;
  description: string;
  category: SampleCategory;
  kind: SampleKind;
  bank?: string;
};

export type CustomSampleSource = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SynthWaveform =
  | "sine"
  | "triangle"
  | "sawtooth"
  | "square"
  | "white"
  | "pink"
  | "brown";

export type SynthFxBuilderState = {
  notePattern: string;
  waveform: SynthWaveform;
  cpm: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  gain: number;
  lpf: number;
  room: number;
  delay: number;
  phaser: number;
  pan: number;
  distort: number;
  crush: number;
};

export type SynthFxMacro = {
  id: string;
  label: string;
  description: string;
  snippet: string;
};

const CUSTOM_SOURCES_KEY = "strudel:sample-workspace:sources:v1";
const RECENT_TOKENS_KEY = "strudel:sample-workspace:recent:v1";
const MAX_RECENT_TOKENS = 10;

export const DEFAULT_SYNTH_FX_STATE: SynthFxBuilderState = {
  notePattern: "c3 eb3 g3 bb3",
  waveform: "sawtooth",
  cpm: 90,
  attack: 0.01,
  decay: 0.1,
  sustain: 0.55,
  release: 0.2,
  gain: 0.6,
  lpf: 1200,
  room: 0.2,
  delay: 0,
  phaser: 0,
  pan: 0.5,
  distort: 0,
  crush: 16,
};

export const SYNTH_FX_MACROS: SynthFxMacro[] = [
  {
    id: "macro-lofi-hat",
    label: "Lo-fi Hat",
    description: "Noisy hat line with crusher and tight envelope",
    snippet:
      's("hh*16").bank("RolandTR909").gain(0.24).crush(5).hpf(5500).room(0.12).pan("0.35 0.65")',
  },
  {
    id: "macro-dub-delay-lead",
    label: "Dub Delay Lead",
    description: "Melodic saw lead with delay and room",
    snippet:
      'note("c4 eb4 g4 bb4").sound("sawtooth").adsr("0.01:0.1:0.55:0.25").lpf(2200).delay(0.62).delaytime(0.25).delayfeedback(0.55).room(0.35).gain(0.48)',
  },
  {
    id: "macro-sidechain-pad",
    label: "Sidechain Pad",
    description: "Wide pad with ducking-ready shape",
    snippet:
      'note("<[c4 eb4 g4 bb4] [bb3 d4 f4 a4]>*2").sound("triangle").adsr("0.08:0.2:0.65:0.35").lpf(1800).room(0.55).pan("0.2 0.8").gain(0.4)',
  },
];

const DEFAULT_SOURCES: CustomSampleSource[] = [
  {
    id: "source-dirt-samples",
    name: "Dirt Samples (GitHub)",
    url: "github:tidalcycles/dirt-samples",
    enabled: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "source-eddyflux-crate",
    name: "Eddyflux Crate",
    url: "github:eddyflux/crate",
    enabled: false,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];

export const SAMPLE_CATALOG: SampleCatalogItem[] = [
  {
    id: "sample-bd",
    label: "Kick",
    token: "bd",
    description: "Bass drum / kick",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-sd",
    label: "Snare",
    token: "sd",
    description: "Snare drum",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-hh",
    label: "Hi-hat",
    token: "hh",
    description: "Closed hi-hat",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-oh",
    label: "Open Hat",
    token: "oh",
    description: "Open hi-hat",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-cp",
    label: "Clap",
    token: "cp",
    description: "Drum clap",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-rim",
    label: "Rim",
    token: "rim",
    description: "Rimshot",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-cr",
    label: "Crash",
    token: "cr",
    description: "Crash cymbal",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-rd",
    label: "Ride",
    token: "rd",
    description: "Ride cymbal",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-ht",
    label: "High Tom",
    token: "ht",
    description: "High tom",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-mt",
    label: "Mid Tom",
    token: "mt",
    description: "Mid tom",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-lt",
    label: "Low Tom",
    token: "lt",
    description: "Low tom",
    category: "drums",
    kind: "sample",
  },
  {
    id: "sample-perc",
    label: "Perc",
    token: "perc",
    description: "General percussions",
    category: "perc",
    kind: "sample",
  },
  {
    id: "sample-sh",
    label: "Shaker",
    token: "sh",
    description: "Shakers and maracas",
    category: "perc",
    kind: "sample",
  },
  {
    id: "sample-cb",
    label: "Cowbell",
    token: "cb",
    description: "Cowbell",
    category: "perc",
    kind: "sample",
  },
  {
    id: "sample-fx",
    label: "FX",
    token: "fx",
    description: "Effects one-shots",
    category: "fx",
    kind: "sample",
  },
  {
    id: "sample-misc",
    label: "Misc",
    token: "misc",
    description: "Miscellaneous samples",
    category: "fx",
    kind: "sample",
  },
  {
    id: "sample-casio",
    label: "Casio",
    token: "casio",
    description: "Classic workshop sample",
    category: "instruments",
    kind: "sample",
  },
  {
    id: "sample-space",
    label: "Space",
    token: "space",
    description: "Atmospheric sample",
    category: "instruments",
    kind: "sample",
  },
  {
    id: "sample-jazz",
    label: "Jazz",
    token: "jazz",
    description: "Melodic sample",
    category: "instruments",
    kind: "sample",
  },
  {
    id: "sample-numbers",
    label: "Numbers",
    token: "numbers",
    description: "Spoken number snippets",
    category: "instruments",
    kind: "sample",
  },
  {
    id: "sample-tr909",
    label: "TR909 Kit",
    token: "bd sd hh oh",
    description: "Short kit pattern using RolandTR909",
    category: "drums",
    kind: "sample",
    bank: "RolandTR909",
  },
  {
    id: "sample-tr808",
    label: "TR808 Kit",
    token: "bd sd hh cp",
    description: "Short kit pattern using RolandTR808",
    category: "drums",
    kind: "sample",
    bank: "RolandTR808",
  },
  {
    id: "synth-sine",
    label: "Sine",
    token: "sine",
    description: "Clean oscillator",
    category: "synths",
    kind: "synth",
  },
  {
    id: "synth-triangle",
    label: "Triangle",
    token: "triangle",
    description: "Default Strudel synth",
    category: "synths",
    kind: "synth",
  },
  {
    id: "synth-sawtooth",
    label: "Sawtooth",
    token: "sawtooth",
    description: "Bright rich waveform",
    category: "synths",
    kind: "synth",
  },
  {
    id: "synth-square",
    label: "Square",
    token: "square",
    description: "Pulse-like oscillator",
    category: "synths",
    kind: "synth",
  },
  {
    id: "synth-white",
    label: "White Noise",
    token: "white",
    description: "Noise source for hats and texture",
    category: "synths",
    kind: "synth",
  },
  {
    id: "synth-pink",
    label: "Pink Noise",
    token: "pink",
    description: "Softer noise texture",
    category: "synths",
    kind: "synth",
  },
  {
    id: "synth-brown",
    label: "Brown Noise",
    token: "brown",
    description: "Dark noise texture",
    category: "synths",
    kind: "synth",
  },
];

function safeParse<T>(raw: string | null, fallback: T): T {
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

function normalizeSources(saved: CustomSampleSource[]): CustomSampleSource[] {
  const map = new Map<string, CustomSampleSource>();
  for (const source of DEFAULT_SOURCES) {
    map.set(source.id, source);
  }

  for (const source of saved) {
    if (!source.id || !source.url) continue;
    map.set(source.id, source);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export function buildSampleInsertSnippet(item: SampleCatalogItem): string {
  if (item.kind === "synth") {
    return `note("c3 e3 g3 b3").sound("${item.token}")`;
  }

  if (item.bank) {
    return `s("${item.token}").bank("${item.bank}")`;
  }

  return `s("${item.token}")`;
}

export function buildSampleAuditionSnippet(item: SampleCatalogItem): string {
  if (item.kind === "synth") {
    return `stack(\n  note("c3 e3 g3 b3").sound("${item.token}").adsr("0.01:0.08:0.5:0.2"),\n  s("bd ~ sd ~").bank("RolandTR909").gain(0.5)\n).cpm(90)`;
  }

  if (item.bank) {
    return `stack(\n  s("${item.token}").bank("${item.bank}"),\n  s("hh*8").bank("${item.bank}").gain(0.3)\n).cpm(110)`;
  }

  return `s("${item.token}*4").cpm(110)`;
}

export function buildSourceInsertSnippet(source: CustomSampleSource): string {
  return `samples("${source.url}")`;
}

function toFixedCompact(value: number, precision = 3): string {
  return Number(value.toFixed(precision)).toString();
}

export function buildSynthFxSnippet(state: SynthFxBuilderState): string {
  const chain = [
    `note("${state.notePattern.trim() || DEFAULT_SYNTH_FX_STATE.notePattern}")`,
    `sound("${state.waveform}")`,
    `adsr("${toFixedCompact(state.attack)}:${toFixedCompact(state.decay)}:${toFixedCompact(state.sustain)}:${toFixedCompact(state.release)}")`,
    `gain(${toFixedCompact(state.gain)})`,
    `lpf(${Math.round(state.lpf)})`,
  ];

  if (state.room > 0) chain.push(`room(${toFixedCompact(state.room)})`);
  if (state.delay > 0) chain.push(`delay(${toFixedCompact(state.delay)})`);
  if (state.phaser > 0) chain.push(`phaser(${toFixedCompact(state.phaser)})`);
  if (state.pan !== 0.5) chain.push(`pan(${toFixedCompact(state.pan)})`);
  if (state.distort > 0)
    chain.push(`distort(${toFixedCompact(state.distort)})`);
  if (state.crush < 16) chain.push(`crush(${Math.round(state.crush)})`);

  return `${chain.join(".")}.cpm(${Math.round(state.cpm)})`;
}

export function buildSynthFxAuditionSnippet(
  state: SynthFxBuilderState,
): string {
  const synth = buildSynthFxSnippet(state).replace(/\.cpm\(\d+\)$/, "");
  return `stack(\n  ${synth},\n  s("bd ~ sd ~").bank("RolandTR909").gain(0.5)\n).cpm(${Math.round(state.cpm)})`;
}

export function useSampleWorkspace() {
  const [category, setCategory] = useState<SampleCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [recentTokens, setRecentTokens] = useState<string[]>(() =>
    safeParse<string[]>(localStorage.getItem(RECENT_TOKENS_KEY), []),
  );
  const [customSources, setCustomSources] = useState<CustomSampleSource[]>(
    () => {
      const saved = safeParse<CustomSampleSource[]>(
        localStorage.getItem(CUSTOM_SOURCES_KEY),
        [],
      );
      const merged = normalizeSources(saved);
      localStorage.setItem(CUSTOM_SOURCES_KEY, JSON.stringify(merged));
      return merged;
    },
  );

  const persistSources = useCallback((next: CustomSampleSource[]) => {
    setCustomSources(next);
    localStorage.setItem(CUSTOM_SOURCES_KEY, JSON.stringify(next));
  }, []);

  const persistRecents = useCallback((next: string[]) => {
    setRecentTokens(next);
    localStorage.setItem(RECENT_TOKENS_KEY, JSON.stringify(next));
  }, []);

  const addRecentToken = useCallback(
    (token: string) => {
      const trimmed = token.trim();
      if (!trimmed) return;
      const next = [
        trimmed,
        ...recentTokens.filter((value) => value !== trimmed),
      ].slice(0, MAX_RECENT_TOKENS);
      persistRecents(next);
    },
    [persistRecents, recentTokens],
  );

  const addSource = useCallback(
    (name: string, url: string) => {
      const trimmedName = name.trim();
      const trimmedUrl = url.trim();
      if (!trimmedName || !trimmedUrl) {
        throw new Error("Source name and URL are required.");
      }

      const duplicate = customSources.some(
        (source) => source.url.toLowerCase() === trimmedUrl.toLowerCase(),
      );
      if (duplicate) {
        throw new Error("This source URL already exists.");
      }

      const ts = nowIso();
      const next = [
        ...customSources,
        {
          id: genId(),
          name: trimmedName,
          url: trimmedUrl,
          enabled: true,
          createdAt: ts,
          updatedAt: ts,
        },
      ];
      persistSources(next);
    },
    [customSources, persistSources],
  );

  const removeSource = useCallback(
    (id: string) => {
      const next = customSources.filter((source) => source.id !== id);
      persistSources(next);
    },
    [customSources, persistSources],
  );

  const toggleSource = useCallback(
    (id: string) => {
      const ts = nowIso();
      const next = customSources.map((source) =>
        source.id === id
          ? { ...source, enabled: !source.enabled, updatedAt: ts }
          : source,
      );
      persistSources(next);
    },
    [customSources, persistSources],
  );

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_CATALOG.filter((item) => {
      if (category !== "all" && item.category !== category) {
        return false;
      }

      if (!q) return true;

      const searchText = [
        item.label,
        item.token,
        item.description,
        item.bank ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return searchText.includes(q);
    });
  }, [category, query]);

  const recentItems = useMemo(() => {
    const byToken = new Map(SAMPLE_CATALOG.map((item) => [item.token, item]));
    return recentTokens
      .map((token) => byToken.get(token))
      .filter((item): item is SampleCatalogItem => Boolean(item));
  }, [recentTokens]);

  return {
    category,
    setCategory,
    query,
    setQuery,
    filteredCatalog,
    recentItems,
    customSources,
    addRecentToken,
    addSource,
    removeSource,
    toggleSource,
  };
}
