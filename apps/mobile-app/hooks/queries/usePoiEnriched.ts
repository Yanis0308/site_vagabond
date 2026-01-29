import { useQuery } from "@tanstack/react-query";

import { getPoiEnriched, type PoiEnrichedType } from "@/http/pois";

export const usePoiEnriched = (
  poiId: string | null,
): {
  data: PoiEnrichedType | undefined | null;
  isSuccess: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
} => {
  const queryResult = useQuery({
    queryKey: ["poi-enriched", poiId],
    enabled: poiId !== null,
    queryFn: async () => {
      if (poiId === null) {
        return null;
      }
      return await getPoiEnriched(poiId);
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
