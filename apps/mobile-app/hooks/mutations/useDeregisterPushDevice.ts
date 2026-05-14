import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { deregisterPushDevice } from "@/http/push-devices";
import { logger } from "@/utils/logger";

export const useDeregisterPushDevice = (): UseMutationResult<
  void,
  Error,
  string
> => {
  return useMutation({
    mutationKey: ["deregisterPushDevice"] as const,
    mutationFn: async (token: string) => {
      await deregisterPushDevice(token);
    },
    retry: 2,
    onError: (error) => {
      logger("[useDeregisterPushDevice] Mutation error after retries", error);
    },
  });
};
