import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type RegisterPushDeviceRequest } from "@vagabond/shared-utils";

import { registerPushDevice } from "@/http/push-devices";
import { logger } from "@/utils/logger";

export const useRegisterPushDevice = (): UseMutationResult<
  { id: number },
  Error,
  RegisterPushDeviceRequest
> => {
  return useMutation({
    mutationKey: ["registerPushDevice"] as const,
    mutationFn: async (payload: RegisterPushDeviceRequest) =>
      await registerPushDevice(payload),
    retry: 5,
    onError: (error) => {
      logger("[useRegisterPushDevice] Mutation error after retries", error);
    },
  });
};
