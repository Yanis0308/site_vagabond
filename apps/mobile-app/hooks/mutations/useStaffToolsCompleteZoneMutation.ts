import { useMutation } from "@tanstack/react-query";
import { type StaffToolsCompleteZoneRequest } from "@vagabond/shared-utils";

import { queryClient } from "@/constants/QueryClient";
import { staffToolsCompleteZone } from "@/http/staff-tools-complete-zone";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- not important
export const useStaffToolsCompleteZoneMutation = () => {
  return useMutation({
    mutationFn: async (
      data: StaffToolsCompleteZoneRequest,
    ): Promise<{ addedCount: number; removedCount: number }> => {
      logger("staff-tools complete zone mutation", data);
      try {
        return await staffToolsCompleteZone(data);
      } catch (error) {
        logger(
          "=== error in staff-tools complete zone:",
          error,
          // @ts-expect-error log the full error response if exists
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- will fix later
          JSON.stringify(error?.response?.body ?? {}),
        );
        throw error;
      }
    },
    onSuccess: () => {
      return void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-zone-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["user-visited-pois"] }),
        queryClient.invalidateQueries({ queryKey: ["visited-pois"] }),
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
      ]);
    },
  });
};
