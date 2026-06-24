"use client";

import { SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { trackTaapDownloadClick } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface Props {
  href: string;
  surface: "nav_desktop" | "nav_mobile";
  className?: string;
  onDrawerClose?: () => void;
  children: ReactNode;
}

export function NavTaapLink({
  href,
  surface,
  className,
  onDrawerClose,
  children,
}: Props): ReactNode {
  return (
    <Button
      variant="default"
      size="default"
      nativeButton={false}
      className={cn(
        `
          inline-flex items-center gap-2.5 rounded-full bg-foreground px-4 py-2.5 text-sm
          font-medium text-background-50
          hover:bg-typography-900
        `,
        className,
      )}
      render={
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(): void => {
            trackTaapDownloadClick(surface);
            onDrawerClose?.();
          }}
        />
      }
    >
      <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-5" />
      {children}
    </Button>
  );
}
