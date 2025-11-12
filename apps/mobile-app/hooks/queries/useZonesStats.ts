import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getUserZoneStats } from "@/http/zones";
import { logger } from "@/utils/logger";
import { type BriefVisitedPoiType, type ZoneUserStatType } from "@/utils/types";

export const useUserZoneStats = (): {
  data:
    | {
        zonesStats: ZoneUserStatType[];
        visitedPoisByPoiIdMap: Map<string, BriefVisitedPoiType>;
      }
    | undefined;
  isSuccess: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
} => {
  const queryResult = useQuery({
    queryKey: ["user-zone-stats"],
    queryFn: async () => {
      logger("fetching all zones");
      return await getUserZoneStats();
    },
  });

  const transformedData = useMemo(() => {
    if (queryResult.data === undefined) {
      return undefined;
    }

    // Extract all validated_pois from all zones and build a Map indexed by poiId for O(1) lookup
    const visitedPoisByPoiIdMap = new Map<string, BriefVisitedPoiType>();

    queryResult.data.forEach((zoneStat) => {
      // validated_pois is always an array (backend guarantees it in boundaryExtensions.ts)
      zoneStat.validated_pois.forEach((poi: BriefVisitedPoiType) => {
        visitedPoisByPoiIdMap.set(poi.poiId, poi);
      });
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
