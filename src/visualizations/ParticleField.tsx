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
  colorScheme?: "neon" | "pastel" | "fire" | "ocean";
}

const SCHEME_HUES: Record<string, [number, number]> = {
  neon: [120, 300],
  pastel: [180, 360],
  fire: [0, 60],
  ocean: [180, 240],
};

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const audioRef = useRef(audioData);
  const sizeRef = useRef({ width: 0, height: 0 });

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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      sizeRef.current = { width, height };
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const MAX_PARTICLES = 220;
    const hueRange = SCHEME_HUES[colorScheme];

    // seed initial particles
    for (let i = 0; i < 80; i++) {
      const p = spawnParticle(canvas.width, canvas.height, hueRange);
      p.life = Math.random() * p.maxLife;
      p.alpha = 0.6;
      particlesRef.current.push(p);
    }

    const draw = () => {
      const { bass, mid, treble, volume } = audioRef.current;
      const { width: w, height: h } = sizeRef.current;

      // fade trail
      ctx.fillStyle = "rgba(5,5,8,0.18)";
      ctx.fillRect(0, 0, w, h);

      // spawn new particles driven by audio energy
      const spawnCount = Math.floor((bass * 4 + mid * 2 + treble) * 3);
      for (let i = 0; i < spawnCount; i++) {
        if (particlesRef.current.length < MAX_PARTICLES) {
          particlesRef.current.push(spawnParticle(w, h, hueRange));
        }
      }

      const bassBoost = 1 + bass * 6;
      const midDrift = 1 + mid * 2;

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
        p.vy -= treble * 0.08; // treble lifts particles
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;

        const sat = 70 + volume * 30;
        const lum = 45 + bass * 25;
        const glow = p.radius * (2 + bass * 4);

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

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [colorScheme]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};
