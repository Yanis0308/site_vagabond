import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { queryClient } from "@/constants/QueryClient";
import { updateUserMe } from "@/http/users";
import { trackEvent } from "@/lib/analytics/analytics";
import { logger } from "@/utils/logger";

export const useUpdateNicknameMutation = (): UseMutationResult<
  void,
  Error,
  string
> => {
  return useMutation({
    mutationFn: async (nickname: string): Promise<void> => {
      logger("update nickname mutation", nickname);
      try {
        await updateUserMe({ nickname });
      } catch (error) {
        logger("=== error in update nickname mutation", error);
        throw error;
      }
    },
    onSuccess: () => {
      void trackEvent("nickname_updated");
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users", "me"] }),
        queryClient.invalidateQueries({
          queryKey: ["leaderboard", "all-time"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["leaderboard", "monthly"],
        }),
      ]);
    },
  });
};
