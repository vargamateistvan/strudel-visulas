import { describe, expect, it } from "vitest";

import { buildMidiFromCode } from "./midiExport";

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe("buildMidiFromCode", () => {
  it("creates a valid MIDI blob with expected headers", async () => {
    const blob = buildMidiFromCode('note("c4 e4 g4")');
    const bytes = await blobBytes(blob);

    expect(blob.type).toBe("audio/midi");
    expect(bytes.length).toBeGreaterThan(22);

    const header = String.fromCharCode(...bytes.slice(0, 4));
    const trackHeader = String.fromCharCode(...bytes.slice(14, 18));
    expect(header).toBe("MThd");
    expect(trackHeader).toBe("MTrk");
  });

  it("encodes note-on events for valid notes and skips invalid tokens", async () => {
    const blob = buildMidiFromCode('note("c4 nope db4 ~")');
    const bytes = await blobBytes(blob);

    const noteOnIndexes: number[] = [];
    for (let i = 0; i < bytes.length; i += 1) {
      if (bytes[i] === 0x90) {
        noteOnIndexes.push(i);
      }
    }

    expect(noteOnIndexes.length).toBe(2);
    expect(bytes).toContain(60); // C4
    expect(bytes).toContain(61); // Db4 -> C#4
  });
});
