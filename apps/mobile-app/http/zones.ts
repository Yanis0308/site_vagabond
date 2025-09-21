import { jsonSchemas } from "@vagabond/shared-utils";
import { generateValidator } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { type ZoneStatType } from "@/utils/types";

const validateResponse = generateValidator(
  jsonSchemas.GetZoneStatsResponseSchema,
);

export const getAllZones = async (): Promise<ZoneStatType[]> => {
  const rawResult = await apiClient.get("api/zones/all").json();

  if (!validateResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
