import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AppStoreBadges } from "./app-store-badges";

interface Props {
  heading: string;
  subheading?: string;
  showBadges?: boolean;
  /** Passed to store badges for analytics when `showBadges` is true. */
  storeBadgesPosition?: string;
  className?: string;
  variant?: "light" | "violet-gradient";
  children?: ReactNode;
}

export function CtaApp({
  heading,
  subheading,
  showBadges = true,
  storeBadgesPosition = "cta",
  className,
  variant = "light",
  children,
}: Props): ReactNode {
  return (
    <section
      className={cn(
        "px-6 py-20 text-center",
        variant === "violet-gradient" &&
          "bg-linear-to-br from-primary-500 to-primary-700 text-white",
        variant === "light" && "bg-background-100",
        className,
      )}
    >
      <div className="mx-auto max-w-2xl">
        <h2
          className={cn(
            `
              font-display text-3xl font-bold
              md:text-4xl
            `,
            variant === "light" && "text-foreground",
          )}
        >
          {heading}
        </h2>
        {subheading !== undefined ? (
          <p
            className={cn(
              "mt-4 text-lg",
              variant === "violet-gradient"
                ? "text-white/80"
                : "text-typography-600",
            )}
          >
            {subheading}
          </p>
        ) : null}
        {showBadges ? (
          <AppStoreBadges
            className="mt-8 justify-center"
            position={storeBadgesPosition}
          />
        ) : null}
        {children}
      </div>
    </section>
  );
}
