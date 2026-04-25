import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type ZoneUserStat } from "@vagabond/shared-utils";

import { queryClient } from "@/constants/QueryClient";
import { deleteVisitedPoi } from "@/http/visited-pois";
import { trackEvent } from "@/lib/analytics/analytics";
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
    onSuccess: (_, visitedPoiId) => {
      void trackEvent("poi_validation_deleted", {
        visited_poi_id: visitedPoiId,
      });
      queryClient.setQueriesData<ZoneUserStat[]>(
        { queryKey: ["user-zone-stats", "me"] },
        (old) =>
          old?.map((zone) => {
            const newPois = zone.validated_pois.filter(
              (p) => p.id !== visitedPoiId,
            );
            if (newPois.length === zone.validated_pois.length) return zone;
            return {
              ...zone,
              validated_pois: newPois,
              validated_pois_count:
                zone.validated_pois_count -
                (zone.validated_pois.length - newPois.length),
            };
          }) ?? old,
      );
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-zone-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["visited-pois", poiId] }),
        queryClient.invalidateQueries({ queryKey: ["user-visited-pois"] }),
      ]);
    },
  });
};
