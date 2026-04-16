import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { UserMe } from "@vagabond/shared-utils";

import { queryClient } from "@/constants/QueryClient";
import { updateUserMe } from "@/http/users";
import { logger } from "@/utils/logger";

const ME_QUERY_KEY = ["users", "me"] as const;

interface OnMutateContext {
  previousUser: UserMe | undefined;
}

export const useUpdatePrivacyMutation = (): UseMutationResult<
  void,
  Error,
  boolean,
  OnMutateContext
> => {
  return useMutation({
    mutationFn: async (isPrivate: boolean): Promise<void> => {
      logger("update privacy mutation", isPrivate);
      try {
        await updateUserMe({ isPrivate });
      } catch (error) {
        logger("=== error in update privacy mutation", error);
        throw error;
      }
    },
    onMutate: async (isPrivate: boolean): Promise<OnMutateContext> => {
      await queryClient.cancelQueries({ queryKey: ME_QUERY_KEY });
      const previousUser = queryClient.getQueryData<UserMe>(ME_QUERY_KEY);
      queryClient.setQueryData<UserMe>(ME_QUERY_KEY, (old) => {
        if (old === undefined) return old;
        return { ...old, isPrivate };
      });
      return { previousUser };
    },
    onError: (
      _error: Error,
      _variables: boolean,
      context: OnMutateContext | undefined,
    ): void => {
      if (context?.previousUser !== undefined) {
        queryClient.setQueryData<UserMe>(ME_QUERY_KEY, context.previousUser);
      }
    },
    onSettled: (): Promise<void> => {
      return queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
};
