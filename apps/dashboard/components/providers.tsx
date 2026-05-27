"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { type ReactNode, useState } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }): ReactNode {
  // useState pour ne pas recréer le QueryClient à chaque render (pattern
  // TanStack Query officiel en App Router).
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
}
