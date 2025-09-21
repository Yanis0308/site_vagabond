import { QueryClient } from "@tanstack/react-query";

import { logger } from "@/utils/logger";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
      throwOnError: true,
    },
    mutations: {
      throwOnError: false,
      onError: (error): void => {
        logger("mutationerror", error);
        alert(error.message);
      },
    },
  },
});
