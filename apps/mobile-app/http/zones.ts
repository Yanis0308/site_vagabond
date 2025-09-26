import { jsonSchemas } from "@vagabond/shared-utils";
import { generateValidator } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { type ZoneStatType, type ZoneUserStatType } from "@/utils/types";

const validateResponseAllZones = generateValidator(
  jsonSchemas.GetZoneStatsResponseSchema,
);

export const getAllZones = async (): Promise<ZoneStatType[]> => {
  const rawResult = await apiClient.get("api/zones/all").json();

  if (!validateResponseAllZones(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

const validateResponseUserZonesStats = generateValidator(
  jsonSchemas.GetUserZoneStatsResponseSchema,
);
export const getUserZoneStats = async (): Promise<ZoneUserStatType[]> => {
  const rawResult = await apiClient.get("api/zones/stats").json();

  if (!validateResponseUserZonesStats(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
