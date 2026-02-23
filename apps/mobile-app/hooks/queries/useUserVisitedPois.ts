import { useQuery } from "@tanstack/react-query";
import type { VisitedPoi } from "@vagabond/shared-utils";
import { useMemo } from "react";

import { getUserVisitedPois } from "@/http/visited-pois";

export const useUserVisitedPois = (): {
  data: {
    visitedPois: VisitedPoi[] | undefined;
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
