import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getLeaderboard, type LeaderboardResponse } from "@/http/leaderboard";

export const useLeaderboard = (
  period: "all-time" | "monthly",
): UseQueryResult<LeaderboardResponse> => {
  return useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", period],
    queryFn: () => getLeaderboard(period),
  });
};
