"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface ParticlesProps {
  className?: string;
  /**
   * Number of particles to render. Defaults to 50.
   */
  quantity?: number;
  /**
   * Particle color in hex format. Defaults to white.
   */
  color?: string;
  /**
   * Max particle size in pixels. Defaults to 3.
   */
  size?: number;
  /**
   * Speed multiplier. Defaults to 0.3.
   */
  speed?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return { r: 255, g: 255, b: 255 };
  }
  return { r, g, b };
}

/**
 * Lightweight canvas-based floating particles background.
 * Inspired by MagicUI's particles component.
 * Renders on a canvas for smooth 60fps performance without DOM overhead.
 */
export function Particles({
  className,
  quantity = 50,
  color = "#ffffff",
  size = 3,
  speed = 0.3,
}: ParticlesProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    let animationId: number;
    let particles: Particle[] = [];

    function resize(): void {
      if (canvas === null) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    function createParticles(): void {
      if (canvas === null) return;
      particles = [];
      for (let i = 0; i < quantity; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          size: Math.random() * size + 0.5,
          opacity: Math.random() * 0.6 + 0.2,
        });
      }
    }

    function animate(): void {
      if (canvas === null || ctx === null) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const rgb = hexToRgb(color);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${String(rgb.r)}, ${String(rgb.g)}, ${String(rgb.b)}, ${String(p.opacity)})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    animate();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      createParticles();
    });
    resizeObserver.observe(canvas);

    return (): void => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [quantity, color, size, speed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
    />
  );
}
