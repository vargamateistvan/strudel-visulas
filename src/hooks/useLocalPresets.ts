import { useCallback, useMemo, useState } from "react";

export interface CodePreset {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

type BuiltinPreset = {
  id: string;
  name: string;
  code: string;
};

const PRESETS_KEY = "strudel:presets:v1";
const DRAFT_KEY = "strudel:draft:v1";

const BUILTIN_PRESETS: BuiltinPreset[] = [
  {
    id: "builtin-rhythm-of-the-night-wip",
    name: "Rhythm Of The Night (WIP)",
    code: `// "The Rhythm Of The Night" - Work In Progress
// song @by Corona
// script @by eeefano
setDefaultVoicings('legacy')
const as = register('as', (mapping, pat) => { mapping = Array.isArray(mapping) ? mapping : [mapping];
  return pat.fmap((v) => { v = Array.isArray(v) ? v : [v, 0];
    return Object.fromEntries(mapping.map((prop, i) => [prop, v[i]])); }); });

const crdpart = "<~ 0@10 1@24 0@19>".pickRestart(
["Ab Cm Bb F@2".slow(5)
,"Bb@3 Ab@3 Cm@2".slow(8)
]);
stack 
("<0 1@4 0 1@4 ~@8 2 3@7 2 3@7 0 1@4 0 1@4 0 1@4 0 1@4>".pickRestart(
  ["~ [4@3 ~]!3 7:5 6 4 3"
  ,"2:-1 0:-2 ~@4 6:1 4:-1 6 4:2 ~@4 [4:2 3]@3 ~@6 4 7:5 6 [4@2 ~] [3:-1 2@3]@2 0 ~@2".slow(4)
  ,"~@6 [6 ~]!2"
  ,"6 5@0.5 [5 ~] [4 ~]!2 [3 ~] 3:2@1.5 ~@7 6@2 6:2 [5 ~ ]!2 4 3@2 4 2 0:-2 ~@7 [0 2]@3 3@2 4 6:4 4:-4 ~ 0 2 0 4 ~ 0 0:2@2 ~@7".slow(7)
]).as("n:penv").scale("c4:minor").patt("0.07").s("gm_lead_1_square").room(0.4).delay(0.3).dfb(0.35).dt(60/128).gain(0.85)

,crdpart.chord().anchor("F4").voicing().s("gm_synth_strings_1").color("blue").gain(0.4)

,"<~@11 1@23 ~ 0@19>".pickRestart(
  ["2 ~@2 2 ~@2 2 ~@3 2 ~@3 2 ~"
  ,"[2 ~@2 2 ~@2 2 ~]!2"
]).n().chord(crdpart).anchor(crdpart.rootNotes(2)).voicing().s("gm_synth_bass_1").lpf(1500).room(0.5).color("green").gain(0.9)

,"<~@11 1@8 ~@16 0@19>".pickRestart(
  ["<5 7 6 3!2> ~ 9 ~ 10 ~ ~ 12 ~ 11 ~ 10 ~ 11 9 ~"
  ,"<6!3 5!3 7!2> ~ 9 ~ 10 ~ ~ 12 ~ 11 ~ 10 ~ 11 9 ~"
]).scale("c3:minor").note().s("gm_lead_2_sawtooth").room(0.3).delay(0.3).dfb(0.5).dt(60/128*2).color("red").gain(0.6)

,"<[2,3] ~@10 0@6 [0,1]@2 [0,2] 0@5 [0,1]@2 [0,2] 0@6 [2,3] 0@8 [0,1]@2 [0,2] 0@8>".pickRestart(
 [stack(s("bd*4").gain(0.8),s("[~ oh]*4").gain(0.14),s("hh*16").gain(0.09),s("[~ cp]*2").gain(0.4))
 ,s("[~ sd!3]!4 [sd*4]!4").slow(2).gain(run(32).slow(2).mul(1/31).add(0.1).mul(0.4))
 ,s("cr").gain(0.2)
 ,s("bd").gain(0.8)
 ]).bank("RolandTR909").room(0.2).color("yellow").velocity(1)
 
).cpm(128/4)`,
  },
  {
    id: "builtin-billie-jean-inspired",
    name: "Billie Jean (Inspired Groove)",
    code: `stack(
  n("0 0 ~ 0 3 2 ~ -2").scale("f2:minor").s("gm_synth_bass_1").gain(0.95),
  s("bd ~ ~ bd ~ ~ bd ~").bank("RolandTR909").gain(0.85),
  s("~ sd ~ ~ ~ sd ~ ~").bank("RolandTR909").gain(0.65),
  s("hh*8").bank("RolandTR909").gain(0.12)
).cpm(117/4)`,
  },
  {
    id: "builtin-seven-nation-inspired",
    name: "Seven Nation Army (Inspired)",
    code: `stack(
  n("0 0 3 0 ~ -2 -4 0").scale("e2:minor").s("gm_lead_1_square").lpf(1800).gain(0.9),
  s("bd ~ ~ bd ~ ~ bd ~").bank("RolandTR909").gain(0.85),
  s("~ ~ cp ~ ~ ~ cp ~").bank("RolandTR909").gain(0.42),
  s("hh*8").bank("RolandTR909").gain(0.08)
).cpm(124/4)`,
  },
  {
    id: "builtin-daft-punk-inspired-funk-grid",
    name: "Daft Punk (Inspired Funk Grid)",
    code: `stack(
  n("0 0 ~ 3 5 ~ 3 0").scale("a2:minor").s("gm_synth_bass_1").lpf(1400).gain(0.9),
  n("0 2 3 2 0 7 5 3").scale("a4:dorian").s("gm_lead_2_sawtooth").gain(0.45).delay(0.22).dfb(0.42),
  s("bd*4").bank("RolandTR909").gain(0.85),
  s("~ sd ~ sd").bank("RolandTR909").gain(0.52),
  s("hh*16").bank("RolandTR909").gain(0.11),
  s("~ cp ~ ~ cp ~ ~ ~").bank("RolandTR909").gain(0.33)
).cpm(124/4)`,
  },
  {
    id: "builtin-french-touch-filter-disco",
    name: "French Touch Filter Disco (Inspired)",
    code: `stack(
  n("0 3 5 7 5 3 2 0").scale("g3:minor").s("gm_lead_2_sawtooth").lpf(segment(8, range(600, 4200))).gain(0.6),
  n("0 ~ 0 ~ 3 ~ 5 ~").scale("g2:minor").s("gm_synth_bass_1").lpf(1200).gain(0.84),
  s("bd*4").bank("RolandTR909").gain(0.86),
  s("~ sd ~ ~ ~ sd ~ ~").bank("RolandTR909").gain(0.5),
  s("hh*16").bank("RolandTR909").gain(0.1)
).cpm(122/4)`,
  },
  {
    id: "builtin-neon-night-drive",
    name: "Neon Night Drive",
    code: `stack(
  n("0 2 3 7 5 3 2 0").scale("d3:minor").s("gm_synth_strings_1").gain(0.42),
  n("0 ~ 0 ~ 5 ~ 3 ~").scale("d2:minor").s("gm_synth_bass_1").lpf(1100).gain(0.86),
  n("7 5 3 2").scale("d5:minor").s("gm_lead_1_square").delay(0.25).dfb(0.35).gain(0.33),
  s("bd*4").bank("RolandTR909").gain(0.8),
  s("hh*16").bank("RolandTR909").gain(0.09)
).cpm(118/4)`,
  },
  {
    id: "builtin-sandstorm-inspired",
    name: "Sandstorm (Inspired Lead)",
    code: `stack(
  n("0 2 3 5 3 2 0 -2").scale("a3:minor").s("gm_lead_2_sawtooth").gain(0.75).delay(0.28).dfb(0.45),
  n("0 ~ 0 ~ 3 ~ 2 ~").scale("a2:minor").s("gm_synth_bass_1").lpf(1300).gain(0.78),
  s("bd*4").bank("RolandTR909").gain(0.82),
  s("[~ sd]*2").bank("RolandTR909").gain(0.5),
  s("hh*16").bank("RolandTR909").gain(0.09)
).cpm(136/4)`,
  },
  {
    id: "builtin-ode-to-joy",
    name: "Ode To Joy (Public Domain)",
    code: `stack(
  note("e4 e4 f4 g4 g4 f4 e4 d4 c4 c4 d4 e4 e4 d4 d4 ~")
    .s("gm_synth_strings_1")
    .gain(0.58),
  n("0 ~ 4 ~ 5 ~ 4 ~").scale("c2:major").s("gm_synth_bass_1").gain(0.62),
  s("bd ~ ~ bd ~ ~ bd ~").bank("RolandTR909").gain(0.75),
  s("~ sd ~ ~ ~ sd ~ ~").bank("RolandTR909").gain(0.45)
).cpm(96/4)`,
  },
];

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

function mergeWithBuiltins(saved: CodePreset[]): CodePreset[] {
  const ts = nowIso();
  const byId = new Map(saved.map((preset) => [preset.id, preset]));

  for (const preset of BUILTIN_PRESETS) {
    if (!byId.has(preset.id)) {
      byId.set(preset.id, {
        ...preset,
        createdAt: ts,
        updatedAt: ts,
      });
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export const useLocalPresets = () => {
  const [presets, setPresets] = useState<CodePreset[]>(() => {
    const saved = safeJsonParse<CodePreset[]>(
      localStorage.getItem(PRESETS_KEY),
      [],
    );
    const merged = mergeWithBuiltins(saved);

    if (merged.length !== saved.length) {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(merged));
    }

    return merged;
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
