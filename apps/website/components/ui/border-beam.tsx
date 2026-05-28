"use client";

import { motion, type Transition } from "motion/react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  transition?: Transition;
  reverse?: boolean;
  initialOffset?: number;
  borderWidth?: number;
}

export function BorderBeam({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#9b4dca",
  colorTo = "#ff5c5c",
  transition,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5,
}: Props): ReactNode {
  return (
    <div
      className="
        pointer-events-none absolute inset-0 rounded-[inherit] border-transparent
        mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect
        [mask-clip:padding-box,border-box]
      "
      style={{
        borderWidth: `${String(borderWidth)}px`,
        borderStyle: "solid",
      }}
    >
      <motion.div
        className={cn("absolute aspect-square", className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${String(size)}px)`,
          background: `linear-gradient(${reverse ? "90deg" : "270deg"}, ${colorFrom} 0%, ${colorTo} 100%)`,
        }}
        initial={{ offsetDistance: `${String(initialOffset)}%` }}
        animate={{
          offsetDistance: `${String(100 + initialOffset)}%`,
        }}
        transition={{
          ease: "linear",
          duration,
          repeat: Infinity,
          delay,
          ...transition,
        }}
      />
    </div>
  );
}
