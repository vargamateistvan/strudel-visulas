import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loadingPromise: Promise<void> | null = null;

async function getFfmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
  }

  if (!ffmpeg.loaded) {
    if (!loadingPromise) {
      loadingPromise = (async () => {
        onLog?.('Loading MP3 encoder...');
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
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
    onProgress?: (progress: number) => void;
    onStatus?: (status: string) => void;
  },
): Promise<Blob> {
  const onProgress = options?.onProgress;
  const onStatus = options?.onStatus;

  const instance = await getFfmpeg(onStatus);
  const inputName = `input-${Date.now()}.webm`;
  const outputName = `output-${Date.now()}.mp3`;

  const handleProgress = (evt: { progress: number }) => {
    const p = Math.max(0, Math.min(1, evt.progress));
    onProgress?.(p);
  };

  instance.on('progress', handleProgress);

  try {
    onStatus?.('Preparing audio...');
    await instance.writeFile(inputName, await fetchFile(inputBlob));

    onStatus?.('Converting to MP3...');
    await instance.exec([
      '-i',
      inputName,
      '-vn',
      '-codec:a',
      'libmp3lame',
      '-q:a',
      '2',
      outputName,
    ]);

    onStatus?.('Finalizing MP3...');
    const data = await instance.readFile(outputName);
    const bytes = data instanceof Uint8Array
      ? data
      : new TextEncoder().encode(String(data));
    const mp3Bytes = new Uint8Array(bytes.byteLength);
    mp3Bytes.set(bytes);
    onProgress?.(1);

    return new Blob([mp3Bytes.buffer], { type: 'audio/mpeg' });
  } finally {
    instance.off('progress', handleProgress);
    await instance.deleteFile(inputName).catch(() => undefined);
    await instance.deleteFile(outputName).catch(() => undefined);
  }
}
