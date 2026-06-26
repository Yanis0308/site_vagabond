"use client";

import Script from "next/script";
import { type ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
}

export function CalendlyEmbed({ title, subtitle }: Props): ReactNode {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border p-6">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-typography-500">{subtitle}</p>
      <div
        className="meetings-iframe-container min-h-[600px] w-full"
        data-src="https://meetings-eu1.hubspot.com/cyril-bauduin?embed=true"
      />
      <Script
        src="https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js"
        strategy="lazyOnload"
      />
    </div>
  );
}
