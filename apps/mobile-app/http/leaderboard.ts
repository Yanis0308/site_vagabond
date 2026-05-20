import {
  type LeaderboardMeResponse,
  LeaderboardMeResponseSchema,
  type LeaderboardResponse,
  LeaderboardResponseSchema,
  type LeaderboardV2Response,
  LeaderboardV2ResponseSchema,
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

// v2 : pagination cursor du top
export const getLeaderboardV2 = async ({
  period,
  after,
  limit = 20,
}: {
  period: "all-time" | "monthly";
  after?: string;
  limit?: number;
}): Promise<LeaderboardV2Response["data"]> => {
  const searchParams: Record<string, string | number> = { period, limit };
  if (after !== undefined) searchParams.after = after;

  const rawResult = await apiClient
    .get("api/v2/leaderboard", { searchParams })
    .json();

  if (!validateWithSchema(LeaderboardV2ResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

// ma position + voisins
export const getLeaderboardMe = async (
  period: "all-time" | "monthly",
): Promise<LeaderboardMeResponse["data"]> => {
  const rawResult = await apiClient
    .get("api/leaderboard/me", { searchParams: { period } })
    .json();

  if (!validateWithSchema(LeaderboardMeResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
