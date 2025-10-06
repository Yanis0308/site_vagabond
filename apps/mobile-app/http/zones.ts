import { jsonSchemas } from "@vagabond/shared-utils";
import { generateValidator } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { type ZoneUserStatType } from "@/utils/types";

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
