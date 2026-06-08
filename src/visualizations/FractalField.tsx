import React, { useEffect, useRef } from 'react';
import type { AudioData } from '../hooks/useStrudel';

interface FractalFieldProps {
  audioData: AudioData;
  colorScheme?: 'neon' | 'pastel' | 'fire' | 'ocean';
  mode?: 'lissajous' | 'julia';
}

// ─── colour palettes ──────────────────────────────────────────────────────────
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function schemeHue(scheme: string, t: number): number {
  switch (scheme) {
    case 'fire':   return t * 60;
    case 'ocean':  return 180 + t * 60;
    case 'pastel': return t * 360;
    default:       return 120 + t * 200; // neon: green→cyan→magenta
  }
}

// ─── Lissajous ────────────────────────────────────────────────────────────────
function drawLissajous(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  waveform: Uint8Array,
  bass: number, mid: number, treble: number,
  volume: number,
  scheme: string,
) {
  const n    = waveform.length;
  const half = n >> 1;
  if (half < 2) return;

  // smear trail
  ctx.fillStyle = 'rgba(5,5,12,0.18)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const scale = Math.min(w, h) * 0.42;

  // draw multiple phase-shifted copies for richness
  const layers = 3;
  for (let layer = 0; layer < layers; layer++) {
    const phaseShift = Math.floor((layer / layers) * half);
    const alpha = 0.55 - layer * 0.15;
    const hue   = schemeHue(scheme, (layer / layers + volume * 0.3) % 1);
    const sat   = 80 + bass * 20;
    const lum   = 50 + treble * 20;
    const glow  = 6 + bass * 20 + treble * 8;

    ctx.beginPath();
    for (let i = 0; i < half; i++) {
      const xi = i;
      const yi = (i + phaseShift) % n;
      const x  = ((waveform[xi] / 128) - 1) * scale + cx;
      const y  = ((waveform[yi] / 128) - 1) * scale + cy;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    const color = `hsla(${hue},${sat}%,${lum}%,${alpha})`;
    ctx.strokeStyle   = color;
    ctx.shadowColor   = color;
    ctx.shadowBlur    = glow;
    ctx.lineWidth     = 1 + mid * 2;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// ─── Julia set (CPU, low-res upscaled) ────────────────────────────────────────
const JULIA_W = 260;
const JULIA_H = 180;
const MAX_ITER = 48;

function drawJulia(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  imgBuf: ImageData,
  bass: number, mid: number, treble: number,
  volume: number,
  scheme: string,
  frame: number,
) {
  const t    = frame * 0.008;
  const cr   = 0.7885 * Math.cos(t + bass * 2);
  const ci   = 0.7885 * Math.sin(t + mid  * 2);
  const data = imgBuf.data;

  for (let py = 0; py < JULIA_H; py++) {
    for (let px = 0; px < JULIA_W; px++) {
      let zr = (px / JULIA_W) * 3.6 - 1.8;
      let zi = (py / JULIA_H) * 2.4 - 1.2;

      let iter = 0;
      while (zr * zr + zi * zi < 4 && iter < MAX_ITER) {
        const tmp = zr * zr - zi * zi + cr;
        zi = 2 * zr * zi + ci;
        zr = tmp;
        iter++;
      }

      const idx = (py * JULIA_W + px) * 4;
      if (iter === MAX_ITER) {
        data[idx] = data[idx + 1] = data[idx + 2] = 0;
        data[idx + 3] = 255;
      } else {
        const t2  = (iter / MAX_ITER + treble * 0.3) % 1;
        const hue = schemeHue(scheme, t2);
        const sat = 70 + bass * 30;
        const lum = 30 + volume * 40 + (iter / MAX_ITER) * 30;
        const [r, g, b] = hslToRgb(hue, sat, lum);
        data[idx]     = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 220;
      }
    }
  }

  // draw scaled to full canvas
  const offscreen = new OffscreenCanvas(JULIA_W, JULIA_H);
  const oct = offscreen.getContext('2d')!;
  oct.putImageData(imgBuf, 0, 0);
  ctx.drawImage(offscreen, 0, 0, w, h);
}

// ─── Component ────────────────────────────────────────────────────────────────
export const FractalField: React.FC<FractalFieldProps> = ({
  audioData,
  colorScheme = 'neon',
  mode = 'lissajous',
}) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const audioRef   = useRef(audioData);
  const frameRef   = useRef(0);
  const imgBufRef  = useRef<ImageData | null>(null);

  useEffect(() => { audioRef.current = audioData; }, [audioData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      if (mode === 'julia') {
        imgBufRef.current = new ImageData(JULIA_W, JULIA_H);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (mode === 'julia') {
      imgBufRef.current = new ImageData(JULIA_W, JULIA_H);
    }

    const draw = () => {
      const { waveform, bass, mid, treble, volume } = audioRef.current;
      const { width: w, height: h } = canvas;
      frameRef.current++;

      if (mode === 'lissajous') {
        drawLissajous(ctx, w, h, waveform, bass, mid, treble, volume, colorScheme);
      } else {
        // Julia is expensive; only recompute every 3 frames
        if (frameRef.current % 3 === 0 && imgBufRef.current) {
          ctx.fillStyle = 'rgba(5,5,12,0.6)';
          ctx.fillRect(0, 0, w, h);
          drawJulia(ctx, w, h, imgBufRef.current, bass, mid, treble, volume, colorScheme, frameRef.current);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [colorScheme, mode]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};
