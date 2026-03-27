"use client";

import { type MouseEvent, type ReactNode, useRef } from "react";

import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(155, 77, 202, 0.08)",
}: SpotlightCardProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>): void {
    const el = ref.current;
    if (el === null) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spotlight-x", `${String(e.clientX - rect.left)}px`);
    el.style.setProperty("--spotlight-y", `${String(e.clientY - rect.top)}px`);
    el.style.setProperty("--spotlight-opacity", "1");
  }

  function handleMouseLeave(): void {
    const el = ref.current;
    if (el === null) return;
    el.style.setProperty("--spotlight-opacity", "0");
  }

  return (
    <div
      ref={ref}
      className={cn("group relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: "var(--spotlight-opacity, 0)",
          background: `radial-gradient(circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${spotlightColor}, transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
