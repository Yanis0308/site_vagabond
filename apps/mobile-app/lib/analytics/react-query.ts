import { type MutationKey, type QueryKey } from "@tanstack/react-query";

import { recordError } from "./analytics";

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

export const analyticsOnQueryError = (
  error: unknown,
  queryKey: QueryKey | undefined,
): void => {
  void recordError(toError(error), {
    type: "query_error",
    query_key: JSON.stringify(queryKey),
  });
};

export const analyticsOnMutationError = (
  error: unknown,
  mutationKey: MutationKey | undefined,
): void =>
  void recordError(toError(error), {
    type: "mutation_error",
    mutation_key: JSON.stringify(mutationKey),
  });
