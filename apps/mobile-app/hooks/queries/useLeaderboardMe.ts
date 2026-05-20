import { useQuery } from "@tanstack/react-query";
import type { LeaderboardMeResponse } from "@vagabond/shared-utils";

import { getLeaderboardMe } from "@/http/leaderboard";

export const useLeaderboardMe = (
  period: "all-time" | "monthly",
): {
  data: LeaderboardMeResponse["data"] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  error: unknown;
} => {
  const query = useQuery({
    queryKey: ["leaderboard", "me", period],
    queryFn: () => getLeaderboardMe(period),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    error: query.error,
  };
};
