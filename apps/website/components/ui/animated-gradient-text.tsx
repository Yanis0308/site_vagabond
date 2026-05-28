"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AnimatedGradientTextProps {
  children: ReactNode;
  className?: string;
}

/**
 * Animated gradient text that smoothly shifts through brand colors (purple → coral).
 * Inspired by MagicUI's animated-gradient-text component.
 * Uses pure CSS animation for performance.
 */
export function AnimatedGradientText({
  children,
  className,
}: AnimatedGradientTextProps): ReactNode {
  return (
    <span
      className={cn(
        `animate-gradient-text bg-size-[200%_auto] bg-clip-text text-transparent`,
        "bg-linear-to-r from-[#8C2ACA] via-[#FF5C5C] to-[#8C2ACA]",
        className,
      )}
    >
      {children}
    </span>
  );
}
