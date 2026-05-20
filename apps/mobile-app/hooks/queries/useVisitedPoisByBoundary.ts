import { useInfiniteQuery } from "@tanstack/react-query";
import type { VisitedPoi } from "@vagabond/shared-utils";

import { getUserVisitedPoisV2 } from "@/http/visited-pois";

interface Page {
  items: VisitedPoi[];
  nextCursor: string | null;
}

// Lazy-load des Visited POIs d'une ville à l'expansion dans le profil
// hiérarchique. Le composant qui consomme ce hook n'est monté qu'à
// l'expansion d'une ville (cf. flattenHierarchy), donc le fetch ne se
// déclenche pas tant que la ville reste collapsed.
// `userId` optionnel : si fourni, charge les visits du profil ciblé (profil tiers).
export const useVisitedPoisByBoundary = ({
  boundaryId,
  userId,
}: {
  boundaryId: string;
  userId?: string;
}): {
  items: VisitedPoi[];
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
} => {
  const query = useInfiniteQuery({
    queryKey: ["visited-pois", "by-boundary", boundaryId, userId ?? "me"],
    queryFn: ({
      pageParam,
    }: {
      pageParam: string | undefined;
    }): Promise<Page> =>
      getUserVisitedPoisV2({ after: pageParam, boundaryId, userId }),
    initialPageParam: undefined,
    getNextPageParam: (last: Page) => last.nextCursor ?? undefined,
  });

  const items = (query.data?.pages ?? []).flatMap((p: Page) => p.items);

  return {
    items,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
  };
};
