import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";

type LeaderboardPeriod = "all-time" | "monthly";

export interface LeaderboardUser {
  userId: string;
  fullName: string | null;
  email: string | null;
  visitedPoisCount: number;
  rank: number;
  registrationDate: string;
  lastVisitedPoiDate: string | null;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  period: LeaderboardPeriod;
}

const validateResponse = generateValidator(
  jsonSchemas.LeaderboardResponseSchema,
);

export const getLeaderboard = async (
  period: LeaderboardPeriod = "all-time",
): Promise<LeaderboardResponse> => {
  const rawResult = await apiClient
    .get("api/leaderboard", {
      searchParams: { period },
    })
    .json();

  if (!validateResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  logger(`/leaderboard fetched with period: ${period}`);

  return rawResult.data;
};
