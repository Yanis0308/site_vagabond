import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: Props): ReactNode {
  return (
    <span
      style={
        {
          "--shiny-width": `${String(shimmerWidth)}px`,
        } as Record<string, string>
      }
      className={cn(
        "animate-shiny-text [background-size:var(--shiny-width)_100%] bg-clip-text [background-position:0_0] bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]",
        "via-foreground/80 bg-linear-to-r from-transparent via-50% to-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
