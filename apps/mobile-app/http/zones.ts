import {
  GetUserZoneStatsResponseSchema,
  validateWithSchema,
  type ZoneUserStat,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

export const getUserZoneStats = async (
  userId?: string,
): Promise<ZoneUserStat[]> => {
  const rawResult = await apiClient
    .get(`api/zones/stats/${userId ?? "me"}`)
    .json();

  if (!validateWithSchema(GetUserZoneStatsResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
