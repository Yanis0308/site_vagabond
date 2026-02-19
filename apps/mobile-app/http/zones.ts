import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { type ZoneUserStatType } from "@/utils/types";

const validateResponseUserZonesStats = generateValidator(
  jsonSchemas.GetUserZoneStatsResponseSchema,
);
export const getUserZoneStats = async (
  userId?: string,
): Promise<ZoneUserStatType[]> => {
  const rawResult = await apiClient
    .get(`api/zones/stats/${userId ?? "me"}`)
    .json();

  if (!validateResponseUserZonesStats(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
