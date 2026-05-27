import {
  generateValidator,
  GetUserZoneStatsResponseSchema,
  GetUserZoneStatsV2ResponseSchema,
  type ZoneUserStat,
  type ZoneUserStatV2,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

const validateGetUserZoneStatsResponse = generateValidator(
  GetUserZoneStatsResponseSchema,
);
const validateGetUserZoneStatsV2Response = generateValidator(
  GetUserZoneStatsV2ResponseSchema,
);

export const getUserZoneStats = async (
  userId?: string,
): Promise<ZoneUserStat[]> => {
  const rawResult = await apiClient
    .get(`api/zones/stats/${userId ?? "me"}`)
    .json();

  if (!validateGetUserZoneStatsResponse(rawResult)) {
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

  if (!validateGetUserZoneStatsV2Response(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
