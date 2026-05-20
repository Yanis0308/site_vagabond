import { useInfiniteQuery } from "@tanstack/react-query";
import type { VisitedPoi } from "@vagabond/shared-utils";

import { getVisitedPoisByPoiIdV2 } from "@/http/visited-pois";

interface Page {
  items: VisitedPoi[];
  nextCursor: string | null;
}

export const useVisitedPois = (
  poiId: string | null,
): {
  data: VisitedPoi[] | undefined | null;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isSuccess: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
} => {
  const query = useInfiniteQuery({
    queryKey: ["visited-pois", "by-poi", poiId],
    enabled: poiId !== null,
    queryFn: ({
      pageParam,
    }: {
      pageParam: string | undefined;
    }): Promise<Page> => {
      if (poiId === null) {
        throw new Error("poiId is null");
      }
      return getVisitedPoisByPoiIdV2({ poiId, after: pageParam });
    },
    initialPageParam: undefined,
    getNextPageParam: (last: Page) => last.nextCursor ?? undefined,
  });

  const items = (query.data?.pages ?? []).flatMap((p: Page) => p.items);

  return {
    data: poiId === null ? null : items,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    error: query.error,
  };
};
