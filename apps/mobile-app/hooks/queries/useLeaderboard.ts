import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getLeaderboard, type LeaderboardResponse } from "@/http/leaderboard";

export const useLeaderboard = (
  period: "all-time" | "monthly",
): UseQueryResult<LeaderboardResponse, Error> => {
  return useQuery<LeaderboardResponse, Error>({
    queryKey: ["leaderboard", period],
    queryFn: () => getLeaderboard(period),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};
