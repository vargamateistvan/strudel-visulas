import React, { useEffect, useRef } from "react";
import type { AudioData } from "../hooks/useStrudel";

interface FractalFieldProps {
  audioData: AudioData;
  colorScheme?: "neon" | "pastel" | "fire" | "ocean";
  mode?:
    | "lissajous"
    | "julia"
    | "kaleidoscope"
    | "kaleidoTunnel"
    | "mandelbrot"
    | "burningShip";
  isPlaying?: boolean;
  kickSensitivity?: number;
}

// ─── colour palettes ──────────────────────────────────────────────────────────
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
}

function schemeHue(scheme: string, t: number): number {
  switch (scheme) {
    case "fire":
      return t * 60;
    case "ocean":
      return 180 + t * 60;
    case "pastel":
      return t * 360;
    default:
      return 120 + t * 200; // neon: green→cyan→magenta
  }
}

// ─── Lissajous ────────────────────────────────────────────────────────────────
function drawLissajous(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  waveform: Uint8Array,
  bass: number,
  mid: number,
  treble: number,
  volume: number,
  scheme: string,
) {
  const n = waveform.length;
  const half = n >> 1;
  if (half < 2) return;

  // smear trail
  ctx.fillStyle = "rgba(5,5,12,0.18)";
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2,
    cy = h / 2;
  const scale = Math.min(w, h) * 0.42;

  // draw multiple phase-shifted copies for richness
  const layers = 3;
  for (let layer = 0; layer < layers; layer++) {
    const phaseShift = Math.floor((layer / layers) * half);
    const alpha = 0.55 - layer * 0.15;
    const hue = schemeHue(scheme, (layer / layers + volume * 0.3) % 1);
    const sat = 80 + bass * 20;
    const lum = 50 + treble * 20;
    const glow = 6 + bass * 20 + treble * 8;

    ctx.beginPath();
    for (let i = 0; i < half; i++) {
      const xi = i;
      const yi = (i + phaseShift) % n;
      const x = (waveform[xi] / 128 - 1) * scale + cx;
      const y = (waveform[yi] / 128 - 1) * scale + cy;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    const color = `hsla(${hue},${sat}%,${lum}%,${alpha})`;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.lineWidth = 1 + mid * 2;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// ─── Julia set (CPU, low-res upscaled) ────────────────────────────────────────
const MAX_ITER = 48;
const JULIA_QUALITY = 0.7;

function drawJulia(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  imgBuf: ImageData,
  bass: number,
  mid: number,
  treble: number,
  volume: number,
  scheme: string,
  frame: number,
) {
  const t = frame * 0.008;
  const cr = 0.7885 * Math.cos(t + bass * 2);
  const ci = 0.7885 * Math.sin(t + mid * 2);
  const data = imgBuf.data;
  const juliaW = imgBuf.width;
  const juliaH = imgBuf.height;

  for (let py = 0; py < juliaH; py++) {
    for (let px = 0; px < juliaW; px++) {
      let zr = (px / juliaW) * 3.6 - 1.8;
      let zi = (py / juliaH) * 2.4 - 1.2;

      let iter = 0;
      while (zr * zr + zi * zi < 4 && iter < MAX_ITER) {
        const tmp = zr * zr - zi * zi + cr;
        zi = 2 * zr * zi + ci;
        zr = tmp;
        iter++;
      }

      const idx = (py * juliaW + px) * 4;
      if (iter === MAX_ITER) {
        data[idx] = data[idx + 1] = data[idx + 2] = 0;
        data[idx + 3] = 255;
      } else {
        const t2 = (iter / MAX_ITER + treble * 0.3) % 1;
        const hue = schemeHue(scheme, t2);
        const sat = 70 + bass * 30;
        const lum = 30 + volume * 40 + (iter / MAX_ITER) * 30;
        const [r, g, b] = hslToRgb(hue, sat, lum);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 220;
      }
    }
  }

  // draw scaled to full canvas
  const offscreen = new OffscreenCanvas(juliaW, juliaH);
  const oct = offscreen.getContext("2d")!;
  oct.putImageData(imgBuf, 0, 0);
  ctx.drawImage(offscreen, 0, 0, w, h);
}

function drawMandelbrot(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  imgBuf: ImageData,
  bass: number,
  mid: number,
  treble: number,
  volume: number,
  scheme: string,
  frame: number,
) {
  const data = imgBuf.data;
  const fractW = imgBuf.width;
  const fractH = imgBuf.height;
  const t = frame * 0.006;
  const zoom = 0.9 + bass * 1.4 + Math.sin(t) * 0.18;
  const centerX = -0.743643887 + Math.cos(t * 0.6) * 0.02;
  const centerY = 0.131825904 + Math.sin(t * 0.7 + mid * 2) * 0.02;

  for (let py = 0; py < fractH; py++) {
    for (let px = 0; px < fractW; px++) {
      const x0 = ((px / fractW) * 3.2 - 2.2) / zoom + centerX;
      const y0 = ((py / fractH) * 2.2 - 1.1) / zoom + centerY;
      let zr = 0;
      let zi = 0;
      let iter = 0;

      while (zr * zr + zi * zi <= 4 && iter < MAX_ITER) {
        const tmp = zr * zr - zi * zi + x0;
        zi = 2 * zr * zi + y0;
        zr = tmp;
        iter++;
      }

      const idx = (py * fractW + px) * 4;
      if (iter === MAX_ITER) {
        data[idx] = data[idx + 1] = data[idx + 2] = 0;
        data[idx + 3] = 255;
      } else {
        const t2 = (iter / MAX_ITER + treble * 0.22 + bass * 0.12) % 1;
        const hue = schemeHue(scheme, t2);
        const sat = 66 + volume * 34;
        const lum = 24 + (iter / MAX_ITER) * 54;
        const [r, g, b] = hslToRgb(hue, sat, lum);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 230;
      }
    }
  }

  const offscreen = new OffscreenCanvas(fractW, fractH);
  const oct = offscreen.getContext("2d")!;
  oct.putImageData(imgBuf, 0, 0);
  ctx.drawImage(offscreen, 0, 0, w, h);
}

function drawBurningShip(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  imgBuf: ImageData,
  bass: number,
  mid: number,
  treble: number,
  scheme: string,
  frame: number,
) {
  const data = imgBuf.data;
  const fractW = imgBuf.width;
  const fractH = imgBuf.height;
  const t = frame * 0.006;
  const zoom = 1 + mid * 1.35 + Math.sin(t * 0.8 + bass) * 0.15;
  const centerX = -1.78 + Math.cos(t * 0.5) * 0.03;
  const centerY = -0.02 + Math.sin(t * 0.7 + treble) * 0.04;

  for (let py = 0; py < fractH; py++) {
    for (let px = 0; px < fractW; px++) {
      const x0 = ((px / fractW) * 3.2 - 2.2) / zoom + centerX;
      const y0 = ((py / fractH) * 2.2 - 1.1) / zoom + centerY;
      let zr = 0;
      let zi = 0;
      let iter = 0;

      while (zr * zr + zi * zi <= 4 && iter < MAX_ITER) {
        const ar = Math.abs(zr);
        const ai = Math.abs(zi);
        const tmp = ar * ar - ai * ai + x0;
        zi = 2 * ar * ai + y0;
        zr = tmp;
        iter++;
      }

      const idx = (py * fractW + px) * 4;
      if (iter === MAX_ITER) {
        data[idx] = data[idx + 1] = data[idx + 2] = 0;
        data[idx + 3] = 255;
      } else {
        const t2 = (iter / MAX_ITER + bass * 0.3 + treble * 0.18) % 1;
        const hue = schemeHue(scheme, t2);
        const sat = 70 + bass * 30;
        const lum = 22 + (iter / MAX_ITER) * 58;
        const [r, g, b] = hslToRgb(hue, sat, lum);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 230;
      }
    }
  }

  const offscreen = new OffscreenCanvas(fractW, fractH);
  const oct = offscreen.getContext("2d")!;
  oct.putImageData(imgBuf, 0, 0);
  ctx.drawImage(offscreen, 0, 0, w, h);
}

function drawKaleidoscope(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  waveform: Uint8Array,
  bass: number,
  mid: number,
  treble: number,
  volume: number,
  scheme: string,
  frame: number,
) {
  if (waveform.length < 2) return;

  const t = frame * 0.02;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * (0.36 + bass * 0.16);
  const sectors = 8 + Math.floor(treble * 8 + mid * 4);
  const points = Math.min(260, waveform.length);

  ctx.fillStyle = `rgba(5,7,14,${0.16 + volume * 0.06})`;
  ctx.fillRect(0, 0, w, h);

  for (let s = 0; s < sectors; s++) {
    const angle = (Math.PI * 2 * s) / sectors + t * (0.25 + mid * 0.9);
    const mirror = s % 2 === 0 ? 1 : -1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const p = i / (points - 1);
      const idx = Math.floor(p * (waveform.length - 1));
      const wave = waveform[idx] / 128 - 1;
      const r =
        p * maxR * (0.42 + bass * 0.4) +
        Math.abs(wave) * maxR * (0.2 + treble * 0.14);
      const y =
        mirror *
        (wave * maxR * 0.22 +
          Math.sin(p * 14 + t * 1.8) * (8 + treble * 22) +
          Math.cos(p * 7 + t * 0.9) * (4 + mid * 14));

      if (i === 0) {
        ctx.moveTo(r, y);
      } else {
        ctx.lineTo(r, y);
      }
    }

    const hue = schemeHue(
      scheme,
      ((s / sectors) * 0.5 + t * 0.03 + bass * 0.2) % 1,
    );
    const alpha = 0.22 + volume * 0.34;
    const color = `hsla(${hue},${74 + mid * 24}%,${46 + bass * 26}%,${alpha})`;

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6 + bass * 24;
    ctx.lineWidth = 1 + mid * 2.2;
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 10 + bass * 28, 0, Math.PI * 2);
  const coreHue = schemeHue(scheme, (t * 0.05 + treble * 0.25) % 1);
  ctx.fillStyle = `hsla(${coreHue},92%,66%,${0.25 + volume * 0.35})`;
  ctx.shadowColor = `hsla(${coreHue},92%,66%,1)`;
  ctx.shadowBlur = 18 + bass * 30;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawKaleidoTunnel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frequencies: Uint8Array,
  bass: number,
  mid: number,
  treble: number,
  volume: number,
  scheme: string,
  frame: number,
) {
  if (frequencies.length < 8) return;

  const t = frame * 0.018;
  const cx = w / 2;
  const cy = h / 2;
  const sectors = 6 + Math.floor(mid * 6 + treble * 4);
  const rings = 28;
  const maxR = Math.min(w, h) * 0.5;

  ctx.fillStyle = `rgba(4,6,12,${0.2 + volume * 0.08})`;
  ctx.fillRect(0, 0, w, h);

  for (let r = 0; r < rings; r++) {
    const rp = r / rings;
    const baseR = rp * maxR;
    const idx = Math.floor(rp * (frequencies.length - 1));
    const f = frequencies[idx] / 255;
    const wobble =
      (0.03 + bass * 0.07 + treble * 0.05) * Math.sin(t * 2 + r * 0.45);
    const ringR = baseR * (1 + wobble) + f * (8 + bass * 16);

    for (let s = 0; s < sectors; s++) {
      const a = (Math.PI * 2 * s) / sectors + t * (0.35 + treble * 0.8);
      const nextA = a + Math.PI / sectors;

      const x1 = cx + Math.cos(a) * ringR;
      const y1 = cy + Math.sin(a) * ringR;
      const x2 = cx + Math.cos(nextA) * (ringR + f * 14);
      const y2 = cy + Math.sin(nextA) * (ringR + f * 14);

      const hue = schemeHue(
        scheme,
        (rp * 0.8 + (s / sectors) * 0.35 + t * 0.02) % 1,
      );
      const alpha = 0.1 + f * 0.45;
      const color = `hsla(${hue},${72 + bass * 24}%,${42 + treble * 28}%,${alpha})`;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4 + f * 18;
      ctx.lineWidth = 0.8 + mid * 1.2;
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const FractalField: React.FC<FractalFieldProps> = ({
  audioData,
  colorScheme = "neon",
  mode = "lissajous",
  isPlaying = false,
  kickSensitivity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const audioRef = useRef(audioData);
  const frameRef = useRef(0);
  const imgBufRef = useRef<ImageData | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const prevBassRef = useRef(0);

  useEffect(() => {
    audioRef.current = audioData;
  }, [audioData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const isRasterMode =
      mode === "julia" || mode === "mandelbrot" || mode === "burningShip";

    const resize = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      sizeRef.current = { width, height };
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (isRasterMode) {
        const juliaW = Math.max(220, Math.floor(width * JULIA_QUALITY));
        const juliaH = Math.max(140, Math.floor(height * JULIA_QUALITY));
        imgBufRef.current = new ImageData(juliaW, juliaH);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (isRasterMode) {
      const { width, height } = sizeRef.current;
      const juliaW = Math.max(220, Math.floor(width * JULIA_QUALITY));
      const juliaH = Math.max(140, Math.floor(height * JULIA_QUALITY));
      imgBufRef.current = new ImageData(juliaW, juliaH);
    }

    const draw = () => {
      const { waveform, frequencies, bass, mid, treble, volume } =
        audioRef.current;
      const bassAttack =
        Math.max(0, bass - prevBassRef.current) * kickSensitivity;
      prevBassRef.current = bass;
      const bassReactive = Math.min(1, bass + bassAttack * 0.8);
      const midReactive = Math.min(1, mid + bassAttack * 0.25);
      const trebleReactive = Math.min(1, treble + bassAttack * 0.2);
      const volumeReactive = Math.min(1, volume + bassAttack * 0.12);
      const { width: w, height: h } = sizeRef.current;
      frameRef.current++;

      if (mode === "lissajous") {
        drawLissajous(
          ctx,
          w,
          h,
          waveform,
          bassReactive,
          midReactive,
          trebleReactive,
          volumeReactive,
          colorScheme,
        );
      } else if (mode === "kaleidoscope") {
        drawKaleidoscope(
          ctx,
          w,
          h,
          waveform,
          bassReactive,
          midReactive,
          trebleReactive,
          volumeReactive,
          colorScheme,
          frameRef.current,
        );
      } else if (mode === "kaleidoTunnel") {
        drawKaleidoTunnel(
          ctx,
          w,
          h,
          frequencies,
          bassReactive,
          midReactive,
          trebleReactive,
          volumeReactive,
          colorScheme,
          frameRef.current,
        );
      } else {
        // Fractals are expensive; only recompute every 3 frames
        if (frameRef.current % 3 === 0 && imgBufRef.current) {
          ctx.fillStyle = "rgba(5,5,12,0.6)";
          ctx.fillRect(0, 0, w, h);
          if (mode === "julia") {
            drawJulia(
              ctx,
              w,
              h,
              imgBufRef.current,
              bassReactive,
              midReactive,
              trebleReactive,
              volumeReactive,
              colorScheme,
              frameRef.current,
            );
          } else if (mode === "mandelbrot") {
            drawMandelbrot(
              ctx,
              w,
              h,
              imgBufRef.current,
              bassReactive,
              midReactive,
              trebleReactive,
              volumeReactive,
              colorScheme,
              frameRef.current,
            );
          } else {
            drawBurningShip(
              ctx,
              w,
              h,
              imgBufRef.current,
              bassReactive,
              midReactive,
              trebleReactive,
              colorScheme,
              frameRef.current,
            );
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    if (!isPlaying) {
      const { width: w, height: h } = sizeRef.current;
      frameRef.current = 0;
      prevBassRef.current = 0;
      ctx.clearRect(0, 0, w, h);
      return () => {
        ro.disconnect();
      };
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [colorScheme, mode, isPlaying, kickSensitivity]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};
