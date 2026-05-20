import { useInfiniteQuery } from "@tanstack/react-query";
import type { LeaderboardUser } from "@vagabond/shared-utils";

import { getLeaderboardV2 } from "@/http/leaderboard";

interface Page {
  items: LeaderboardUser[];
  nextCursor: string | null;
  period: "all-time" | "monthly";
}

// v2 : infinite scroll du top.
// La position personnelle est servie séparément par useLeaderboardMe (section sticky).
export const useLeaderboard = (
  period: "all-time" | "monthly",
): {
  items: LeaderboardUser[];
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  error: unknown;
} => {
  const query = useInfiniteQuery({
    queryKey: ["leaderboard", "v2", period],
    queryFn: ({
      pageParam,
    }: {
      pageParam: string | undefined;
    }): Promise<Page> => getLeaderboardV2({ period, after: pageParam }),
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
    isSuccess: query.isSuccess,
    error: query.error,
  };
};
