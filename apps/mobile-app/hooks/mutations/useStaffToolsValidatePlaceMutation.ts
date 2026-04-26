import { useMutation } from "@tanstack/react-query";

import { queryClient } from "@/constants/QueryClient";
import { staffToolsValidatePlace } from "@/http/staff-tools-validate-place";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- not important
export const useStaffToolsValidatePlaceMutation = () => {
  return useMutation({
    mutationFn: async (placeId: string): Promise<{ id: number }> => {
      logger("staff-tools validate place mutation", placeId);
      try {
        return await staffToolsValidatePlace(placeId);
      } catch (error) {
        logger(
          "=== error in staff-tools validate place:",
          error,
          // @ts-expect-error log the full error response if exists
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- will fix later
          JSON.stringify(error?.response?.body ?? {}),
        );
        throw error;
      }
    },
    onSuccess: (_, placeId) => {
      return void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-zone-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["visited-pois", placeId] }),
        queryClient.invalidateQueries({ queryKey: ["user-visited-pois"] }),
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
      ]);
    },
  });
};
