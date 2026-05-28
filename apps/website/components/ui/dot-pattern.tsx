"use client";

import { type ReactNode, useId } from "react";

import { cn } from "@/lib/utils";

interface DotPatternProps {
  className?: string;
  dotColor?: string;
  dotSize?: number;
  gap?: number;
}

export function DotPattern({
  className,
  dotColor = "rgba(155, 77, 202, 0.12)",
  dotSize = 1.2,
  gap = 20,
}: DotPatternProps): ReactNode {
  const id = useId();
  const patternId = `dot-pattern-${id}`;

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 size-full",
        className,
      )}
    >
      <defs>
        <pattern
          id={patternId}
          x={0}
          y={0}
          width={gap}
          height={gap}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={dotSize} cy={dotSize} r={dotSize} fill={dotColor} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
