"use client";

import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
}

export function NavScrollEffect({ children }: Props): ReactNode {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll(): void {
      setScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return (): void => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background-100/80 shadow-sm backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      {children}
    </header>
  );
}
