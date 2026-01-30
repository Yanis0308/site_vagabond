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
  });

  return {
    data: queryResult.data,
    isSuccess: queryResult.isSuccess,
    isFetching: queryResult.isFetching,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
  };
};
