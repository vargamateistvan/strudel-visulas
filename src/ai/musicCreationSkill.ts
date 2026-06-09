export type MusicCreationIntent = "new" | "refine" | "variation";

export type MusicPromptPreset = {
  id: string;
  label: string;
  prompt: string;
};

export const MUSIC_CHAT_PROMPT_PRESETS: MusicPromptPreset[] = [
  {
    id: "deep-techno",
    label: "Deep Techno",
    prompt:
      "Deep techno groove at 128 BPM with heavy kick, syncopated hats, hypnotic bass, and subtle filter motion",
  },
  {
    id: "lofi-night",
    label: "Lo-fi Night",
    prompt:
      "Lo-fi beat at 84 BPM with dusty drums, warm electric piano chords, mellow bass, and relaxed swing",
  },
  {
    id: "ambient-drift",
    label: "Ambient Drift",
    prompt:
      "Ambient cinematic texture at 72 BPM with evolving pads, sparse percussion, and slow harmonic movement",
  },
  {
    id: "dnb-drive",
    label: "DnB Drive",
    prompt:
      "Drum and bass pattern at 172 BPM with broken drums, rolling sub bass, and sharp rhythmic stabs",
  },
  {
    id: "house-sunrise",
    label: "House Sunrise",
    prompt:
      "Melodic house at 122 BPM with punchy kick, uplifting chord progression, plucked lead, and airy hats",
  },
  {
    id: "minimal-perc",
    label: "Minimal Perc",
    prompt:
      "Minimal percussion groove at 120 BPM with tight low-end pulse, polyrhythmic clicks, and restrained dynamics",
  },
];

const INTENT_RULES: Record<MusicCreationIntent, string> = {
  new: "Create a fresh, full Strudel pattern from scratch.",
  refine:
    "Refine the existing code while preserving its core identity and musical direction.",
  variation:
    "Keep the main motif recognizable, but change rhythm, harmony, layering, or timbre for variation.",
};

const MUSICAL_REQUIREMENTS = [
  "Output only executable Strudel code with no markdown and no explanation.",
  "Return a Strudel expression only, not generic JavaScript program structure.",
  "Keep the result musical, loop-friendly, and immediately playable.",
  "Use clear layering, usually via stack(...), with a rhythmic foundation and at least one melodic or harmonic voice.",
  "When appropriate, include cpm(...) and core controls such as gain(), lpf(), room(), delay(), slow(), fast().",
  "Avoid extreme gain or runaway density that causes clipping.",
];

const STRUDEL_ONLY_REQUIREMENTS = [
  "Use Strudel primitives such as stack(), sound(), note(), n(), cpm(), gain(), room(), delay(), lpf(), hpf(), pan(), slow(), fast().",
  "Prefer pattern-centric composition using Strudel chains over imperative logic.",
  'Use n() only for numeric scale steps (e.g. n("0 2 4")); use note() for note names (e.g. note("c4 e4 g4")).',
  "Do not use comma-octave shorthand like g,5, d,5, am,5, or em,5; use valid note tokens like g5 d5 or explicit note() sequences instead.",
  "In sound() patterns, prefer reliable built-in sample tokens like bd, sn, hh, cp, perc, and avoid unknown tokens like sub.",
  "Do not output import/export statements, function declarations, class definitions, loops, conditionals, or variable setup boilerplate.",
  "Do not output surrounding explanations, comments, markdown fences, or prose.",
  "If unsure, return a compact playable Strudel stack(...) expression.",
];

const ARRANGEMENT_HINTS = [
  "Kick or pulse layer",
  "Snare or backbeat layer",
  "Hi-hat or texture layer",
  "Bass or low note layer",
  "Lead, chord, or ambient layer",
];

function inferPromptHints(prompt: string): string[] {
  const p = prompt.toLowerCase();
  const hints: string[] = [];

  if (!/\b\d{2,3}\s*bpm\b|\bcpm\b/.test(p)) {
    hints.push("If BPM is missing, pick a genre-appropriate tempo.");
  }

  if (/ambient|cinematic|drone|atmospheric/.test(p)) {
    hints.push(
      "Use sparse rhythm and wider ambience with slower harmonic movement.",
    );
  }

  if (/techno|house|club|dance/.test(p)) {
    hints.push("Prioritize a stable groove with strong low-end repetition.");
  }

  if (/breakbeat|drum.?n.?bass|dnb|jungle/.test(p)) {
    hints.push("Increase rhythmic subdivision and syncopation in drum layers.");
  }

  if (/lofi|chill|downtempo/.test(p)) {
    hints.push("Keep timbre soft and leave headroom for a relaxed mood.");
  }

  return hints;
}

export function getMusicCreationSkillSystemPrompt(): string {
  return [
    "You are Strudel Music Skill, a specialist in algorithmic live-coding composition.",
    "Your output target is strictly the Strudel DSL used for live coding patterns.",
    ...MUSICAL_REQUIREMENTS,
    ...STRUDEL_ONLY_REQUIREMENTS,
    "Prefer concise, readable code over overly complex chains.",
  ].join(" ");
}

export function buildMusicCreationSkillInstruction(args: {
  prompt: string;
  currentCode: string;
  intent: MusicCreationIntent;
}): string {
  const { prompt, currentCode, intent } = args;
  const hints = inferPromptHints(prompt);

  return [
    "Music Creation Skill Brief",
    `Intent: ${INTENT_RULES[intent]}`,
    "Target language: Strudel DSL (strict).",
    `User request: ${prompt.trim()}`,
    "Arrangement targets:",
    ...ARRANGEMENT_HINTS.map((item) => `- ${item}`),
    ...(hints.length > 0
      ? ["Adaptive hints:", ...hints.map((item) => `- ${item}`)]
      : []),
    "Current editor code:",
    currentCode.trim() || "// empty",
  ].join("\n");
}
