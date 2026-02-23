import { useQuery } from "@tanstack/react-query";
import type { BriefVisitedPoi, ZoneUserStat } from "@vagabond/shared-utils";
import { useMemo } from "react";

import { getUserZoneStats } from "@/http/zones";

interface UseUserZoneStatsReturn {
  data:
    | {
        zonesStats: ZoneUserStat[];
        visitedPoisByPoiIdMap: Map<string, BriefVisitedPoi>;
      }
    | undefined;
  isSuccess: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
}

export const useUserZoneStats = (userId?: string): UseUserZoneStatsReturn => {
  const queryResult = useQuery({
    queryKey: ["user-zone-stats", userId ?? "me"],
    queryFn: async () => {
      return await getUserZoneStats(userId);
    },
  });

  const transformedData = useMemo(() => {
    if (queryResult.data === undefined || !Array.isArray(queryResult.data)) {
      return undefined;
    }

    // Extract all validated_pois from all zones and build a Map indexed by poiId for O(1) lookup
    const visitedPoisByPoiIdMap = new Map<string, BriefVisitedPoi>();

    queryResult.data.forEach((zoneStat) => {
      // validated_pois is always an array (backend guarantees it in boundaryExtensions.ts)
      if (Array.isArray(zoneStat.validated_pois)) {
        zoneStat.validated_pois.forEach((poi: BriefVisitedPoi) => {
          visitedPoisByPoiIdMap.set(poi.poiId, poi);
        });
      }
    });

    return {
      zonesStats: queryResult.data,
      visitedPoisByPoiIdMap,
    };
  }, [queryResult.data]);

  return useMemo(
    () => ({
      data: transformedData,
      isSuccess: queryResult.isSuccess,
      isFetching: queryResult.isFetching,
      isLoading: queryResult.isLoading,
      error: queryResult.error,
    }),
    [
      transformedData,
      queryResult.isSuccess,
      queryResult.isFetching,
      queryResult.isLoading,
      queryResult.error,
    ],
  );
};
