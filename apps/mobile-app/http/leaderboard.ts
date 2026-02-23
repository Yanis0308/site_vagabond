import {
  type LeaderboardResponse,
  LeaderboardResponseSchema,
  validateWithSchema,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";

export const getLeaderboard = async (
  period: "all-time" | "monthly" = "all-time",
): Promise<LeaderboardResponse["data"]> => {
  const rawResult = await apiClient
    .get("api/leaderboard", {
      searchParams: { period },
    })
    .json();

  if (!validateWithSchema(LeaderboardResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  logger(`/leaderboard fetched with period: ${period}`);

  return rawResult.data;
};
