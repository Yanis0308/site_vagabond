"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  vertical?: boolean;
  repeat?: number;
  gap?: string;
  duration?: string;
}

export function Marquee({
  children,
  className,
  reverse = false,
  vertical = false,
  repeat = 5,
  gap = "2rem",
  duration = "40s",
}: MarqueeProps): ReactNode {
  return (
    <div
      className={cn(
        "group flex overflow-hidden p-2",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
      style={
        {
          "--duration": duration,
          "--gap": gap,
          gap: "var(--gap)",
        } as Record<string, string>
      }
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 justify-around",
            vertical
              ? "animate-marquee-vertical flex-col"
              : "animate-marquee flex-row",
            reverse && "direction-[reverse]",
          )}
          style={{ gap: "var(--gap)" }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
