import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getUserVisitedPois, type VisitedPoiType } from "@/http/visited-pois";

export const useUserVisitedPois = (): {
  data: {
    visitedPois: VisitedPoiType[] | undefined;
    visitedPoiIds: string[];
  };
  isSuccess: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
} => {
  const queryResult = useQuery({
    queryKey: ["user-visited-pois"],
    queryFn: async () => {
      return await getUserVisitedPois();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Extract POI IDs from visited POIs
  const visitedPoiIds = useMemo(() => {
    if (queryResult.data === undefined) return [];
    return queryResult.data.map((poi) => poi.poiId);
  }, [queryResult.data]);

  return {
    data: {
      visitedPois: queryResult.data,
      visitedPoiIds,
    },
    isSuccess: queryResult.isSuccess,
    isFetching: queryResult.isFetching,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
  };
};
