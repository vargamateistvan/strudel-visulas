function writeUint32(value: number): number[] {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ];
}

function writeUint16(value: number): number[] {
  return [(value >>> 8) & 0xff, value & 0xff];
}

function writeVarLen(value: number): number[] {
  let buffer = value & 0x7f;
  const out: number[] = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    out.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return out;
}

const FLAT_MAP: Record<string, string> = {
  cb: "b",
  db: "c#",
  eb: "d#",
  fb: "e",
  gb: "f#",
  ab: "g#",
  bb: "a#",
  "e#": "f",
  "b#": "c",
};

const NOTE_INDEX: Record<string, number> = {
  c: 0,
  "c#": 1,
  d: 2,
  "d#": 3,
  e: 4,
  f: 5,
  "f#": 6,
  g: 7,
  "g#": 8,
  a: 9,
  "a#": 10,
  b: 11,
};

function parseNoteToMidi(token: string): number | null {
  const m = token.toLowerCase().match(/^([a-g](?:b|#)?)(-?\d+)?$/);
  if (!m) return null;
  const pitch = FLAT_MAP[m[1]] ?? m[1];
  const octave = m[2] ? parseInt(m[2], 10) : 4;
  const idx = NOTE_INDEX[pitch];
  if (idx === undefined) return null;
  return (octave + 1) * 12 + idx;
}

function extractNoteTokens(code: string): string[] {
  const tokens: string[] = [];
  const noteCallRe = /note\((['"])(.*?)\1\)/gis;
  let m: RegExpExecArray | null;
  while ((m = noteCallRe.exec(code)) !== null) {
    const pattern = m[2];
    const raw = pattern
      .replace(/[[\]<>(),]/g, " ")
      .split(/\s+/)
      .map((x) => x.trim())
      .filter(Boolean);

    for (const t of raw) {
      if (t === "~") continue;
      if (/^[a-g](?:b|#)?-?\d*$/i.test(t)) tokens.push(t);
    }
  }
  return tokens;
}

export function buildMidiFromCode(code: string): Blob {
  const ticksPerBeat = 480;
  const noteTicks = 240;
  const velocity = 96;
  const notes = extractNoteTokens(code);

  const track: number[] = [];

  // Tempo meta event: 120 BPM
  track.push(0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20);

  let pendingDelta = 0;
  for (const token of notes) {
    const midi = parseNoteToMidi(token);
    if (midi == null) {
      pendingDelta += noteTicks;
      continue;
    }

    track.push(...writeVarLen(pendingDelta), 0x90, midi & 0x7f, velocity);
    track.push(...writeVarLen(noteTicks), 0x80, midi & 0x7f, 0x00);
    pendingDelta = 0;
  }

  // End of track
  track.push(0x00, 0xff, 0x2f, 0x00);

  const header = [
    ...[0x4d, 0x54, 0x68, 0x64],
    ...writeUint32(6),
    ...writeUint16(0),
    ...writeUint16(1),
    ...writeUint16(ticksPerBeat),
  ];

  const trackChunk = [
    ...[0x4d, 0x54, 0x72, 0x6b],
    ...writeUint32(track.length),
    ...track,
  ];

  const bytes = new Uint8Array([...header, ...trackChunk]);
  return new Blob([bytes], { type: "audio/midi" });
}
