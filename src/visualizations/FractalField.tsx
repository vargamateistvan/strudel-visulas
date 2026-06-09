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
    | "mandelbulb"
    | "mandelbox"
    | "ifs"
    | "thueMorse"
    | "lindenmayer"
    | "mandelbrot"
    | "burningShip";
  isPlaying?: boolean;
  kickSensitivity?: number;
  fractalQuality?: number;
  mandelbulbSize?: number;
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
const FRACTAL_3D_QUALITY_LOW = 0.22;
const FRACTAL_3D_QUALITY_BALANCED = 0.26;
const FRACTAL_3D_QUALITY_HIGH = 0.32;
const RAY_STEPS_LOW = 26;
const RAY_STEPS_BALANCED = 34;
const RAY_STEPS_HIGH = 44;
const RAY_MAX_DIST = 8.5;

let rasterUpscaleCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
let rasterUpscaleCtx:
  | OffscreenCanvasRenderingContext2D
  | CanvasRenderingContext2D
  | null = null;

function drawRasterUpscaled(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  imgBuf: ImageData,
) {
  const iw = imgBuf.width;
  const ih = imgBuf.height;

  if (!rasterUpscaleCanvas) {
    rasterUpscaleCanvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(iw, ih)
        : document.createElement("canvas");
  }

  if (rasterUpscaleCanvas.width !== iw || rasterUpscaleCanvas.height !== ih) {
    rasterUpscaleCanvas.width = iw;
    rasterUpscaleCanvas.height = ih;
    rasterUpscaleCtx = null;
  }

  if (!rasterUpscaleCtx) {
    rasterUpscaleCtx = rasterUpscaleCanvas.getContext("2d");
  }
  if (!rasterUpscaleCtx) return;

  rasterUpscaleCtx.putImageData(imgBuf, 0, 0);
  ctx.drawImage(rasterUpscaleCanvas as CanvasImageSource, 0, 0, w, h);
}

function normalize3(x: number, y: number, z: number): [number, number, number] {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

function cross3(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
): [number, number, number] {
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

type DistanceEstimator = (x: number, y: number, z: number) => number;

function estimateNormal(
  de: DistanceEstimator,
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  const e = 0.0024;
  const nx = de(x + e, y, z) - de(x - e, y, z);
  const ny = de(x, y + e, z) - de(x, y - e, z);
  const nz = de(x, y, z + e) - de(x, y, z - e);
  return normalize3(nx, ny, nz);
}

function renderFractal3D(
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
  de: DistanceEstimator,
  raySteps: number,
  huePhase = 0,
) {
  const data = imgBuf.data;
  const fractW = imgBuf.width;
  const fractH = imgBuf.height;
  const aspect = fractW / Math.max(1, fractH);
  const t = frame * 0.015;

  const camRadius = 3.15 - bass * 0.45;
  const camX = Math.cos(t * 0.7 + huePhase * 0.8) * camRadius;
  const camY = 0.6 + Math.sin(t * 0.43 + treble * 0.8) * 0.7;
  const camZ = Math.sin(t * 0.7 + huePhase * 0.8) * camRadius;
  const tgtX = Math.sin(t * 0.21) * 0.18;
  const tgtY = Math.sin(t * 0.37 + mid) * 0.16;
  const tgtZ = Math.cos(t * 0.25) * 0.18;

  const [fx, fy, fz] = normalize3(tgtX - camX, tgtY - camY, tgtZ - camZ);
  const [rx0, ry0, rz0] = cross3(fx, fy, fz, 0, 1, 0);
  const [rx, ry, rz] = normalize3(rx0, ry0, rz0);
  const [ux, uy, uz] = cross3(rx, ry, rz, fx, fy, fz);

  const fov = 1.15;
  const [lx, ly, lz] = normalize3(0.72, 0.9, -0.48);

  for (let py = 0; py < fractH; py++) {
    for (let px = 0; px < fractW; px++) {
      const u = ((px + 0.5) / fractW) * 2 - 1;
      const v = ((py + 0.5) / fractH) * 2 - 1;
      const sx = u * aspect;
      const sy = -v;

      const [rdx, rdy, rdz] = normalize3(
        fx + (rx * sx + ux * sy) * fov,
        fy + (ry * sx + uy * sy) * fov,
        fz + (rz * sx + uz * sy) * fov,
      );

      let rayT = 0;
      let hit = false;
      let hitX = 0;
      let hitY = 0;
      let hitZ = 0;
      let stepCount = 0;

      for (; stepCount < raySteps; stepCount++) {
        hitX = camX + rdx * rayT;
        hitY = camY + rdy * rayT;
        hitZ = camZ + rdz * rayT;
        const dist = Math.max(0.00055, de(hitX, hitY, hitZ));
        if (dist < 0.0014) {
          hit = true;
          break;
        }
        rayT += dist * 0.88;
        if (rayT > RAY_MAX_DIST) break;
      }

      const idx = (py * fractW + px) * 4;
      if (!hit) {
        const bg = Math.max(0, 1 - rayT / RAY_MAX_DIST);
        const hue = schemeHue(scheme, (0.56 + huePhase + bg * 0.18) % 1);
        const [br, bgc, bb] = hslToRgb(hue, 34 + treble * 12, 5 + bg * 14);
        data[idx] = br;
        data[idx + 1] = bgc;
        data[idx + 2] = bb;
        data[idx + 3] = 255;
        continue;
      }

      const [nx, ny, nz] = estimateNormal(de, hitX, hitY, hitZ);
      const diffuse = Math.max(0, nx * lx + ny * ly + nz * lz);
      const view = Math.max(0, -(nx * rdx + ny * rdy + nz * rdz));
      const fresnel = Math.pow(1 - view, 2.6);
      const ao = 1 - stepCount / raySteps;

      const shade =
        (0.16 + diffuse * 0.55 + fresnel * 0.24 + ao * 0.22 + bass * 0.15) % 1;
      const hue = schemeHue(
        scheme,
        (shade + huePhase + Math.abs(hitY) * 0.08 + volume * 0.08) % 1,
      );
      const sat = 72 + treble * 22;
      const lum = 20 + diffuse * 40 + ao * 14 + volume * 12;
      const [r, g, b] = hslToRgb(hue, sat, lum);

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  drawRasterUpscaled(ctx, w, h, imgBuf);
}

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
  drawRasterUpscaled(ctx, w, h, imgBuf);
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

  drawRasterUpscaled(ctx, w, h, imgBuf);
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

  drawRasterUpscaled(ctx, w, h, imgBuf);
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

function drawMandelbulb(
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
  raySteps: number,
  mandelbulbSize: number,
) {
  const power = 7 + bass * 2.8;
  const sizeScale = mandelbulbSize;
  const de = (x: number, y: number, z: number) => {
    const px = x / sizeScale;
    const py = y / sizeScale;
    const pz = z / sizeScale;
    let zx = px;
    let zy = py;
    let zz = pz;
    let dr = 1;
    let r = 0;

    for (let i = 0; i < 7; i++) {
      r = Math.hypot(zx, zy, zz);
      if (r > 2.2) break;
      const theta = Math.acos(Math.max(-1, Math.min(1, zz / (r + 1e-6))));
      const phi = Math.atan2(zy, zx);
      const zr = Math.pow(r + 1e-6, power);
      dr = Math.pow(r + 1e-6, power - 1) * power * dr + 1;
      const sinT = Math.sin(theta * power);
      zx = zr * sinT * Math.cos(phi * power) + px;
      zy = zr * sinT * Math.sin(phi * power) + py;
      zz = zr * Math.cos(theta * power) + pz;
    }

    return ((0.5 * Math.log(r + 1e-6) * r) / Math.max(0.0001, dr)) * sizeScale;
  };

  renderFractal3D(
    ctx,
    w,
    h,
    imgBuf,
    bass,
    mid,
    treble,
    volume,
    scheme,
    frame,
    de,
    raySteps,
    0.08,
  );
}

function drawMandelbox(
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
  raySteps: number,
) {
  const scale = -1.9 - mid * 0.45;
  const minRad = 0.5;
  const fixedRad = 1.0;

  const de = (x: number, y: number, z: number) => {
    const cx = x;
    const cy = y;
    const cz = z;
    let zx = x;
    let zy = y;
    let zz = z;
    let dr = 1;

    for (let i = 0; i < 9; i++) {
      zx = Math.max(-1, Math.min(1, zx)) * 2 - zx;
      zy = Math.max(-1, Math.min(1, zy)) * 2 - zy;
      zz = Math.max(-1, Math.min(1, zz)) * 2 - zz;

      const r2 = zx * zx + zy * zy + zz * zz;
      if (r2 > 36) break;

      let fold = 1;
      if (r2 < minRad * minRad) {
        fold = (fixedRad * fixedRad) / (minRad * minRad);
      } else if (r2 < fixedRad * fixedRad) {
        fold = (fixedRad * fixedRad) / Math.max(0.0001, r2);
      }

      zx = zx * fold;
      zy = zy * fold;
      zz = zz * fold;
      dr = dr * Math.abs(fold);

      zx = zx * scale + cx;
      zy = zy * scale + cy;
      zz = zz * scale + cz;
      dr = dr * Math.abs(scale) + 1;
    }

    return Math.hypot(zx, zy, zz) / Math.max(0.0001, Math.abs(dr));
  };

  renderFractal3D(
    ctx,
    w,
    h,
    imgBuf,
    bass,
    mid,
    treble,
    volume,
    scheme,
    frame,
    de,
    raySteps,
    0.42,
  );
}

function drawIFS(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bass: number,
  mid: number,
  treble: number,
  volume: number,
  scheme: string,
  frame: number,
) {
  ctx.fillStyle = `rgba(4,8,14,${0.08 + volume * 0.06})`;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const baseY = h * 0.95;
  let x = 0;
  let y = 0;
  const points = 3200;
  const sway = Math.sin(frame * 0.015) * (0.015 + mid * 0.03);

  for (let i = 0; i < points; i++) {
    const r = Math.random();
    let nx: number;
    let ny: number;

    if (r < 0.01) {
      nx = 0;
      ny = 0.16 * y;
    } else if (r < 0.86) {
      nx = (0.85 + sway) * x + 0.04 * y;
      ny = -0.04 * x + (0.85 - sway) * y + 1.6;
    } else if (r < 0.93) {
      nx = 0.2 * x - 0.26 * y;
      ny = 0.23 * x + 0.22 * y + 1.6;
    } else {
      nx = -0.15 * x + 0.28 * y;
      ny = 0.26 * x + 0.24 * y + 0.44;
    }

    x = nx;
    y = ny;

    const px = cx + x * (w * (0.055 + bass * 0.03));
    const py = baseY - y * (h * (0.055 + treble * 0.02));
    const hue = schemeHue(
      scheme,
      ((i / points) * 0.7 + frame * 0.002 + bass * 0.2) % 1,
    );
    ctx.fillStyle = `hsla(${hue},${70 + treble * 25}%,${38 + y * 5}%,${0.12 + volume * 0.45})`;
    ctx.fillRect(px, py, 1.2, 1.2);
  }
}

function thueMorseBit(n: number): 0 | 1 {
  let x = n;
  let parity = 0;
  while (x > 0) {
    parity ^= x & 1;
    x >>= 1;
  }
  return parity as 0 | 1;
}

function buildLSystem(iterations: number): string {
  let out = "F";
  for (let i = 0; i < iterations; i++) {
    let next = "";
    for (const c of out) {
      if (c === "F") next += "F+F-F-FF+F+F-F";
      else next += c;
    }
    out = next;
  }
  return out;
}

const L_SYSTEM_SENTENCE = buildLSystem(4);

function drawThueMorse(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bass: number,
  mid: number,
  treble: number,
  volume: number,
  scheme: string,
  frame: number,
) {
  ctx.fillStyle = `rgba(4,6,12,${0.14 + volume * 0.06})`;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const count = 560;
  const spin = frame * (0.004 + treble * 0.006);

  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const bit = thueMorseBit(i + Math.floor(frame * 0.12));
    const p = i / (count - 1);
    const angle = spin + p * Math.PI * 10;
    const radius = (0.12 + p * 0.78) * Math.min(w, h) * 0.5;
    const wobble = bit === 0 ? -1 : 1;
    const x = cx + Math.cos(angle) * (radius + wobble * (8 + bass * 26));
    const y = cy + Math.sin(angle) * (radius + wobble * (8 + mid * 24));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  const hue = schemeHue(scheme, (frame * 0.006 + bass * 0.22) % 1);
  const color = `hsla(${hue},${76 + treble * 22}%,${50 + volume * 20}%,${0.44 + volume * 0.2})`;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10 + bass * 24;
  ctx.lineWidth = 1.1 + mid * 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawLindenmayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bass: number,
  mid: number,
  treble: number,
  volume: number,
  scheme: string,
  frame: number,
) {
  ctx.fillStyle = `rgba(5,7,14,${0.16 + volume * 0.05})`;
  ctx.fillRect(0, 0, w, h);

  const sentence = L_SYSTEM_SENTENCE;
  const angle = ((18 + mid * 24) * Math.PI) / 180;
  const step = 2.2 + bass * 2.8;
  const stack: Array<{ x: number; y: number; a: number }> = [];

  let x = w * 0.18;
  let y = h * 0.8;
  let a = -Math.PI / 8 + Math.sin(frame * 0.01) * 0.4;

  const hue = schemeHue(scheme, (frame * 0.004 + treble * 0.2) % 1);
  const color = `hsla(${hue},${72 + bass * 24}%,${52 + volume * 20}%,${0.46 + volume * 0.18})`;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 + treble * 20;
  ctx.lineWidth = 1 + mid * 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);

  for (let i = 0; i < sentence.length; i++) {
    const c = sentence[i];
    if (c === "F") {
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      ctx.lineTo(x, y);
    } else if (c === "+") {
      a += angle;
    } else if (c === "-") {
      a -= angle;
    } else if (c === "[") {
      stack.push({ x, y, a });
    } else if (c === "]") {
      const s = stack.pop();
      if (s) {
        x = s.x;
        y = s.y;
        a = s.a;
        ctx.moveTo(x, y);
      }
    }
  }

  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const FractalField: React.FC<FractalFieldProps> = ({
  audioData,
  colorScheme = "neon",
  mode = "lissajous",
  isPlaying = false,
  kickSensitivity = 1,
  fractalQuality = 2,
  mandelbulbSize = 1.28,
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
    const is3DMode = mode === "mandelbulb" || mode === "mandelbox";
    const isRasterMode =
      mode === "julia" ||
      mode === "mandelbrot" ||
      mode === "burningShip" ||
      is3DMode;
    const qualityLevel = Math.max(1, Math.min(3, Math.round(fractalQuality)));
    const rasterQuality = is3DMode
      ? qualityLevel === 1
        ? FRACTAL_3D_QUALITY_LOW
        : qualityLevel === 2
          ? FRACTAL_3D_QUALITY_BALANCED
          : FRACTAL_3D_QUALITY_HIGH
      : JULIA_QUALITY;
    const raySteps =
      qualityLevel === 1
        ? RAY_STEPS_LOW
        : qualityLevel === 2
          ? RAY_STEPS_BALANCED
          : RAY_STEPS_HIGH;

    const resize = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      sizeRef.current = { width, height };
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (isRasterMode) {
        const juliaW = Math.max(220, Math.floor(width * rasterQuality));
        const juliaH = Math.max(140, Math.floor(height * rasterQuality));
        imgBufRef.current = new ImageData(juliaW, juliaH);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (isRasterMode) {
      const { width, height } = sizeRef.current;
      const juliaW = Math.max(220, Math.floor(width * rasterQuality));
      const juliaH = Math.max(140, Math.floor(height * rasterQuality));
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
      } else if (mode === "ifs") {
        drawIFS(
          ctx,
          w,
          h,
          bassReactive,
          midReactive,
          trebleReactive,
          volumeReactive,
          colorScheme,
          frameRef.current,
        );
      } else if (mode === "thueMorse") {
        drawThueMorse(
          ctx,
          w,
          h,
          bassReactive,
          midReactive,
          trebleReactive,
          volumeReactive,
          colorScheme,
          frameRef.current,
        );
      } else if (mode === "lindenmayer") {
        drawLindenmayer(
          ctx,
          w,
          h,
          bassReactive,
          midReactive,
          trebleReactive,
          volumeReactive,
          colorScheme,
          frameRef.current,
        );
      } else {
        // Fractals are expensive; 3D modes update at lower cadence for smoother FPS
        const rasterInterval = is3DMode ? 7 - qualityLevel : 3;
        if (frameRef.current % rasterInterval === 0 && imgBufRef.current) {
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
          } else if (mode === "mandelbulb") {
            drawMandelbulb(
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
              raySteps,
              mandelbulbSize,
            );
          } else if (mode === "mandelbox") {
            drawMandelbox(
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
              raySteps,
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
  }, [
    colorScheme,
    mode,
    isPlaying,
    kickSensitivity,
    fractalQuality,
    mandelbulbSize,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};
