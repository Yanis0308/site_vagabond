import {
  GetUserZoneStatsResponseSchema,
  GetUserZoneStatsV2ResponseSchema,
  validateWithSchema,
  type ZoneUserStat,
  type ZoneUserStatV2,
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

// v2 : payload allégé (sans validated_pois, avec last_visited_poi_at/name)
export const getUserZoneStatsV2 = async (
  userId?: string,
): Promise<ZoneUserStatV2[]> => {
  const rawResult = await apiClient
    .get(`api/v2/zones/stats/${userId ?? "me"}`)
    .json();

  if (!validateWithSchema(GetUserZoneStatsV2ResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
