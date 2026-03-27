"use client";

import { type ReactNode } from "react";

import { trackProCalendlyEmbedView } from "@/lib/analytics";
import { publicEnv } from "@/lib/config/public";

interface Props {
  title: string;
  subtitle: string;
}

export function CalendlyEmbed({ title, subtitle }: Props): ReactNode {
  return (
    <div className="border-border flex flex-col items-center gap-4 rounded-2xl border p-6">
      <p className="text-foreground text-sm font-medium">{title}</p>
      <p className="text-typography-500 text-xs">{subtitle}</p>
      <iframe
        src={publicEnv.CALENDLY_URL}
        title="Calendly"
        className="h-[600px] w-full rounded-lg border-0"
        loading="lazy"
        sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
        onLoad={(): void => {
          trackProCalendlyEmbedView();
        }}
      />
    </div>
  );
}
