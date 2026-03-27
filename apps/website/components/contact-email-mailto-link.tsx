"use client";

import { type ReactNode } from "react";

import { trackContactEmailIntent } from "@/lib/analytics";

interface Props {
  href: string;
  page: "contact" | "pro";
  className?: string;
  children: ReactNode;
}

export function ContactEmailMailtoLink({
  href,
  page,
  className,
  children,
}: Props): ReactNode {
  return (
    <a
      href={href}
      className={className}
      onClick={(): void => {
        trackContactEmailIntent("mailto", page);
      }}
    >
      {children}
    </a>
  );
}
