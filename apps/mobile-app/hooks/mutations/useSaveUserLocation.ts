import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type UserLocationRequest } from "@vagabond/shared-utils";

import { saveUserLocation } from "@/http/save-user-location";
import { logger } from "@/utils/logger";

export const useSaveUserLocation = (): UseMutationResult<
  void,
  Error,
  UserLocationRequest
> => {
  return useMutation({
    mutationKey: ["saveUserLocation"] as const,
    mutationFn: async (loc: UserLocationRequest) => {
      await saveUserLocation(loc);
    },
    retry: 10, // Retry en cas d'erreur réseau, le retryDelay est automatiquement exponentiel
    // Ne pas afficher d'erreur dans la console par défaut (géré dans le hook useUserLocationTracking)
    onError: (error) => {
      logger("[useSaveUserLocation] Mutation error after retries", error);
    },
  });
};
