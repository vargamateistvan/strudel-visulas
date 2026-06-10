import React, { useEffect, useRef } from "react";
import type { AudioData } from "../hooks/useStrudel";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  hue: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface ParticleFieldProps {
  audioData: AudioData;
  colorScheme?: "neon" | "pastel" | "fire" | "ocean" | "custom";
  customColors?: [string, string, string];
  isPlaying?: boolean;
  kickSensitivity?: number;
  particleDensity?: number;
}

const SCHEME_HUES: Record<string, [number, number]> = {
  neon: [120, 300],
  pastel: [180, 360],
  fire: [0, 60],
  ocean: [180, 240],
};

const MIN_FRAME_MS = 33;

function hexToHue(hex: string): number {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}

function spawnParticle(
  w: number,
  h: number,
  hueRange: [number, number],
): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 0.8;
  const life = 80 + Math.random() * 120;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 1 + Math.random() * 2,
    baseRadius: 1 + Math.random() * 2,
    hue: hueRange[0] + Math.random() * (hueRange[1] - hueRange[0]),
    alpha: 0,
    life,
    maxLife: life,
  };
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  audioData,
  colorScheme = "neon",
  customColors,
  isPlaying = false,
  kickSensitivity = 1,
  particleDensity = 220,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const audioRef = useRef(audioData);
  const sizeRef = useRef({ width: 0, height: 0 });
  const prevBassRef = useRef(0);
  const phaseRef = useRef(0);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    audioRef.current = audioData;
  }, [audioData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const maxDpr = window.innerWidth < 900 ? 3 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

      sizeRef.current = { width, height };
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const MAX_PARTICLES = Math.max(
      80,
      Math.min(420, Math.round(particleDensity)),
    );
    const hueRange: [number, number] =
      colorScheme === "custom" && customColors
        ? [hexToHue(customColors[0]), hexToHue(customColors[2])]
        : (SCHEME_HUES[colorScheme] ?? SCHEME_HUES.neon);

    // seed initial particles
    for (let i = 0; i < 80; i++) {
      const p = spawnParticle(canvas.width, canvas.height, hueRange);
      p.life = Math.random() * p.maxLife;
      p.alpha = 0.6;
      particlesRef.current.push(p);
    }

    const draw = (timestamp: number) => {
      if (timestamp - lastFrameRef.current < MIN_FRAME_MS) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = timestamp;

      const { bass, mid, treble, volume, frequencies, waveform } =
        audioRef.current;
      const { width: w, height: h } = sizeRef.current;
      phaseRef.current += 0.05 + treble * 0.18;

      // fade trail
      ctx.fillStyle = "rgba(5,5,8,0.18)";
      ctx.fillRect(0, 0, w, h);

      // spawn new particles driven by audio energy
      const bassAttack =
        Math.max(0, bass - prevBassRef.current) * kickSensitivity;
      prevBassRef.current = bass;
      const centroid = frequencies.length
        ? frequencies.reduce((acc, value, idx) => acc + value * idx, 0) /
          Math.max(
            1,
            frequencies.reduce((acc, value) => acc + value, 0),
          )
        : 0;
      const centroidNorm = frequencies.length
        ? centroid / frequencies.length
        : 0.5;

      const energy =
        bass * (1.35 + 0.5 * kickSensitivity) +
        mid * 1.15 +
        treble * 0.9 +
        volume * 0.8;
      const spawnCount = Math.floor(
        energy * (3 + kickSensitivity) + bassAttack * (4 + 8 * kickSensitivity),
      );
      for (let i = 0; i < spawnCount; i++) {
        if (particlesRef.current.length < MAX_PARTICLES) {
          particlesRef.current.push(spawnParticle(w, h, hueRange));
        }
      }

      const bassBoost =
        1 +
        bass * (4 + 2 * kickSensitivity) +
        bassAttack * (1.2 + 1.6 * kickSensitivity);
      const midDrift = 1 + mid * (1.8 + 0.7 * kickSensitivity);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life--;
        if (p.life <= 0) return false;

        const progress = p.life / p.maxLife;
        p.alpha =
          progress < 0.2
            ? (progress / 0.2) * 0.8
            : progress > 0.8
              ? (1 - (progress - 0.8) / 0.2) * 0.8
              : 0.8;

        p.radius = p.baseRadius * bassBoost;
        p.vx += (Math.random() - 0.5) * 0.1 * midDrift;
        p.vy += (Math.random() - 0.5) * 0.1 * midDrift;

        if (waveform.length > 0) {
          const idx = Math.floor((p.x / Math.max(1, w)) * waveform.length);
          const wave = waveform[Math.min(idx, waveform.length - 1)] / 128 - 1;
          p.vy += wave * (0.08 + mid * 0.08);
        }

        p.vx += Math.sin(phaseRef.current + p.y * 0.01) * (0.04 + treble * 0.1);
        p.vx += (centroidNorm - 0.5) * 0.12;
        p.vy -= treble * 0.08; // treble lifts particles
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;

        const sat = 70 + volume * 30;
        const lum = 45 + bass * 25;
        const glow =
          p.radius *
          (2 + bass * (2.5 + 1.8 * kickSensitivity) + bassAttack * 2);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.shadowColor = `hsla(${p.hue},${sat}%,${lum}%,1)`;
        ctx.shadowBlur = glow;
        ctx.fillStyle = `hsla(${p.hue},${sat}%,${lum}%,${p.alpha})`;
        ctx.fill();

        return true;
      });

      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(draw);
    };

    if (!isPlaying) {
      const { width: w, height: h } = sizeRef.current;
      particlesRef.current = [];
      prevBassRef.current = 0;
      lastFrameRef.current = 0;
      ctx.clearRect(0, 0, w, h);
      return () => {
        ro.disconnect();
      };
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
      ro.disconnect();
    };
  }, [colorScheme, customColors, isPlaying, kickSensitivity, particleDensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};
