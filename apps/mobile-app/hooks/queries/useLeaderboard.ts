import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { type LeaderboardResponse } from "@vagabond/shared-utils";

import { getLeaderboard } from "@/http/leaderboard";

export const useLeaderboard = (
  period: "all-time" | "monthly",
): UseQueryResult<LeaderboardResponse["data"]> => {
  return useQuery<LeaderboardResponse["data"]>({
    queryKey: ["leaderboard", period],
    queryFn: () => getLeaderboard(period),
  });
};
