"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ShimmerBorderProps {
  children: ReactNode;
  className?: string;
  /**
   * Border radius in Tailwind notation. Defaults to "rounded-3xl".
   */
  borderRadius?: string;
  /**
   * CSS duration for one shimmer loop. Defaults to "3s".
   */
  duration?: string;
  /**
   * Border width in pixels. Defaults to 2.
   */
  borderWidth?: number;
  /**
   * Shimmer gradient color. Defaults to the brand purple.
   */
  shimmerColor?: string;
  /**
   * Background color behind the shimmer. Defaults to transparent.
   */
  background?: string;
}

/**
 * Wraps children with an animated shimmer/glow border effect.
 * Inspired by MagicUI's shimmer-button and Aceternity's moving-border.
 * Uses a rotating conic gradient behind a padded inner layer.
 * The gradient is oversized (inset: -100%) so rotation covers the full border.
 */
export function ShimmerBorder({
  children,
  className,
  borderRadius = "rounded-3xl",
  duration = "3s",
  borderWidth = 2,
  shimmerColor = "#9b4dca",
  background = "transparent",
}: ShimmerBorderProps): ReactNode {
  return (
    <div
      className={cn("relative overflow-hidden", borderRadius, className)}
      style={
        {
          "--shimmer-duration": duration,
          padding: `${String(borderWidth)}px`,
        } as Record<string, string>
      }
    >
      {/* Rotating shimmer — oversized to cover corners during rotation */}
      <div
        aria-hidden="true"
        className="animate-shimmer-rotate absolute inset-[-100%]"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${shimmerColor} 10%, transparent 20%)`,
        }}
      />
      {/* Inner content container */}
      <div className={cn("relative z-10", borderRadius)} style={{ background }}>
        {children}
      </div>
    </div>
  );
}
