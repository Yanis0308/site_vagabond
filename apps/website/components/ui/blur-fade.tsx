"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.4,
  yOffset = 20,
}: BlurFadeProps): ReactNode {
  return (
    <motion.div
      className={cn("will-change-[filter,opacity,transform]", className)}
      initial={{ opacity: 0, y: yOffset, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
