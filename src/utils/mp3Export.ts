import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export type Mp3QualityPreset = "fast" | "good" | "best";

let ffmpeg: FFmpeg | null = null;
let loadingPromise: Promise<void> | null = null;

async function getFfmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
  }

  if (!ffmpeg.loaded) {
    if (!loadingPromise) {
      loadingPromise = (async () => {
        onLog?.("Loading MP3 encoder...");
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
        const coreURL = await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript",
        );
        const wasmURL = await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm",
        );
        await ffmpeg!.load({ coreURL, wasmURL });
      })();
    }
    await loadingPromise;
  }

  return ffmpeg;
}

export async function convertWebmToMp3(
  inputBlob: Blob,
  options?: {
    quality?: Mp3QualityPreset;
    onProgress?: (progress: number) => void;
    onStatus?: (status: string) => void;
    onSpeed?: (speed: string) => void;
  },
): Promise<Blob> {
  const quality = options?.quality ?? "good";
  const onProgress = options?.onProgress;
  const onStatus = options?.onStatus;
  const onSpeed = options?.onSpeed;

  const instance = await getFfmpeg(onStatus);
  const inputName = `input-${Date.now()}.webm`;
  const outputName = `output-${Date.now()}.mp3`;

  const handleProgress = (evt: { progress: number }) => {
    const p = Math.max(0, Math.min(1, evt.progress));
    onProgress?.(p);
  };

  const handleLog = (evt: { message: string }) => {
    const match = evt.message.match(/speed=\s*([0-9.]+)x/);
    if (match?.[1]) {
      onSpeed?.(`${match[1]}x`);
    }
  };

  const qualityArgs: Record<Mp3QualityPreset, string[]> = {
    fast: ["-codec:a", "libmp3lame", "-b:a", "192k"],
    good: ["-codec:a", "libmp3lame", "-q:a", "2"],
    best: ["-codec:a", "libmp3lame", "-q:a", "0"],
  };

  instance.on("progress", handleProgress);
  instance.on("log", handleLog);

  try {
    onStatus?.("Preparing audio...");
    await instance.writeFile(inputName, await fetchFile(inputBlob));

    onStatus?.("Converting to MP3...");
    await instance.exec([
      "-i",
      inputName,
      "-vn",
      ...qualityArgs[quality],
      outputName,
    ]);

    onStatus?.("Finalizing MP3...");
    const data = await instance.readFile(outputName);
    const bytes =
      data instanceof Uint8Array
        ? data
        : new TextEncoder().encode(String(data));
    const mp3Bytes = new Uint8Array(bytes.byteLength);
    mp3Bytes.set(bytes);
    onProgress?.(1);

    return new Blob([mp3Bytes.buffer], { type: "audio/mpeg" });
  } finally {
    instance.off("progress", handleProgress);
    instance.off("log", handleLog);
    await instance.deleteFile(inputName).catch(() => undefined);
    await instance.deleteFile(outputName).catch(() => undefined);
  }
}
