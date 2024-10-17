import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      throwOnError: true,
    },
    mutations: {
      throwOnError: true,
    },
  },
});
