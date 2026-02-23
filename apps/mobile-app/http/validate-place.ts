import { type CreateVisitedPoiRequest } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";

export const validatePlace = async (
  placeId: string,
  data: CreateVisitedPoiRequest,
): Promise<void> => {
  const rawResult = await apiClient
    .post(`api/visited-pois/${placeId}`, { json: data })
    .json();
  logger("=== validate place result:", JSON.stringify(rawResult));
};
