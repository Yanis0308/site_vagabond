"use client";

import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { trackTaapDownloadClick } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const SHINY_LINK =
  "relative overflow-hidden rounded-full before:animate-shiny-sweep before:absolute before:inset-0 before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] before:bg-[length:200%_100%]";

interface Props {
  href: string;
  surface: "nav_desktop" | "nav_mobile";
  className?: string;
  children: ReactNode;
}

export function NavTaapLink({
  href,
  surface,
  className,
  children,
}: Props): ReactNode {
  return (
    <Button
      variant="default"
      size="default"
      nativeButton={false}
      className={cn(
        SHINY_LINK,
        "bg-primary-500 text-primary-foreground hover:bg-primary-600",
        className,
      )}
      render={
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(): void => {
            trackTaapDownloadClick(surface);
          }}
        />
      }
    >
      {children}
    </Button>
  );
}
