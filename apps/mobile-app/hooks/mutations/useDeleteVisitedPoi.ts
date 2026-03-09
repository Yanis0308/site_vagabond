import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { queryClient } from "@/constants/QueryClient";
import { deleteVisitedPoi } from "@/http/visited-pois";
import { logger } from "@/utils/logger";

export const useDeleteVisitedPoi = (
  poiId: string,
): UseMutationResult<void, Error, number> => {
  return useMutation({
    mutationFn: async (visitedPoiId: number) => {
      logger("delete visited poi mutation", visitedPoiId);
      try {
        await deleteVisitedPoi(visitedPoiId);
      } catch (error) {
        logger(`=== error in delete visited poi : ${visitedPoiId}`, error);
        throw error;
      }
    },
    onSuccess: () => {
      return void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["user-zone-stats"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["visited-pois", poiId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["user-visited-pois"],
        }),
      ]);
    },
  });
};
