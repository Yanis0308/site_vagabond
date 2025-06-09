import { type Static } from "@sinclair/typebox";
import { type jsonSchemas } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";

export const validatePlace = async (
  placeId: string,
  data: Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema>,
): Promise<void> => {
  const rawResult = await apiClient
    .post(`api/visited-pois/${placeId}`, { json: data })
    .json();
  logger("=== validate place result:", JSON.stringify(rawResult));
};
