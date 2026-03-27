"use client";

import { type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: Props): ReactNode {
  return (
    <div
      className={cn(
        "grid auto-rows-[minmax(200px,1fr)] grid-cols-1 gap-4 md:grid-cols-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  span?: "large" | "small";
}

function handleMouseMove(e: MouseEvent<HTMLDivElement>): void {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  e.currentTarget.style.transform = `perspective(1000px) rotateY(${String(x * 6)}deg) rotateX(${String(-y * 6)}deg)`;
}

function handleMouseLeave(e: MouseEvent<HTMLDivElement>): void {
  e.currentTarget.style.transform = "";
}

export function BentoCard({
  children,
  className,
  span = "small",
}: BentoCardProps): ReactNode {
  return (
    <div
      className={cn(
        "bg-background-100 border-background-300 hover:border-primary-400 flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 [transform-style:preserve-3d] hover:shadow-lg",
        span === "large" ? "md:col-span-7" : "md:col-span-5",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
