import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import {
  trackNotificationOpen,
  type TrackNotificationOpenInput,
} from "@/http/notifications";
import { logger } from "@/utils/logger";

export const useTrackNotificationOpen = (): UseMutationResult<
  void,
  Error,
  TrackNotificationOpenInput
> => {
  return useMutation({
    mutationKey: ["trackNotificationOpen"] as const,
    mutationFn: async (input: TrackNotificationOpenInput) => {
      await trackNotificationOpen(input);
    },
    retry: 2,
    onError: (error) => {
      logger("[useTrackNotificationOpen] Mutation error after retries", error);
    },
  });
};
