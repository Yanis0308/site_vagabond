import { useQuery } from "@tanstack/react-query";

import { getVisitedPois, type VisitedPoiType } from "@/http/visited-pois";

export const useVisitedPois = (
  poiId: string | null,
): {
  data: VisitedPoiType[] | undefined | null;
  isSuccess: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
} => {
  const queryResult = useQuery({
    queryKey: ["visited-pois", poiId],
    enabled: poiId !== null,
    queryFn: async () => {
      if (poiId === null) {
        return null;
      }
      return await getVisitedPois(poiId);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    data: queryResult.data,
    isSuccess: queryResult.isSuccess,
    isFetching: queryResult.isFetching,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
  };
};
