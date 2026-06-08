import React, { useEffect, useRef } from "react";
import type { AudioData } from "../hooks/useStrudel";

interface SpectrumAnalyzerProps {
  audioData: AudioData;
  colorScheme?: "neon" | "pastel" | "fire" | "ocean";
  barCount?: number;
  showWaveform?: boolean;
}

const GRADIENTS: Record<string, [string, string][]> = {
  neon: [
    ["#00ff88", "#00ffff"],
    ["#00ffff", "#ff00ff"],
    ["#ff00ff", "#ffff00"],
  ],
  pastel: [
    ["#87CEEB", "#DDA0DD"],
    ["#DDA0DD", "#F0E68C"],
    ["#F0E68C", "#FFB6C1"],
  ],
  fire: [
    ["#ff0000", "#ff7700"],
    ["#ff7700", "#ffff00"],
    ["#ffff00", "#ff3300"],
  ],
  ocean: [
    ["#001a4d", "#0047ab"],
    ["#0047ab", "#0073e6"],
    ["#0073e6", "#00d9ff"],
  ],
};

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  audioData,
  colorScheme = "neon",
  barCount = 80,
  showWaveform = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    const stops = GRADIENTS[colorScheme];

    const draw = () => {
      const { frequencies, waveform, bass } = audioRef.current;
      const { width: w, height: h } = sizeRef.current;

      ctx.clearRect(0, 0, w, h);

      // spectrum bars
      const barW = w / barCount;
      const step = Math.max(1, Math.floor(frequencies.length / barCount));

      for (let i = 0; i < barCount; i++) {
        const idx = Math.min(i * step, frequencies.length - 1);
        const val = frequencies[idx] / 255;
        const barH = val * h * 0.75;
        const x = i * barW;

        const t = i / barCount;
        const si = Math.min(Math.floor(t * stops.length), stops.length - 1);
        const [c1, c2] = stops[si];

        const grad = ctx.createLinearGradient(0, h, 0, h - barH);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);

        const glow = 4 + bass * 20;
        ctx.shadowColor = c1;
        ctx.shadowBlur = glow;
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, h - barH, barW - 2, barH);

        // peak dot
        ctx.fillStyle = c2;
        ctx.fillRect(x + 1, h - barH - 3, barW - 2, 2);
      }

      // waveform overlay
      if (showWaveform && waveform.length > 0) {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,0.25)`;
        ctx.lineWidth = 1.5;
        const sliceW = w / waveform.length;
        for (let i = 0; i < waveform.length; i++) {
          const v = waveform[i] / 128 - 1;
          const y = v * h * 0.15 + h * 0.5;
          i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * sliceW, y);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [colorScheme, barCount, showWaveform]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};
