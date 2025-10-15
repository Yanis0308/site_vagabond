import { type Static } from "@sinclair/typebox";
import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";
import { type VisitedPoiType } from "@/utils/types";

export const validatePlace = async (
  placeId: string,
  data: Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema>,
): Promise<void> => {
  const rawResult = await apiClient
    .post(`api/visited-pois/${placeId}`, { json: data })
    .json();
  logger("=== validate place result:", JSON.stringify(rawResult));
};

const validateResponse = generateValidator(
  jsonSchemas.GetVisitedPoisResponseSchema,
);

export const getValidatedPlaces = async (): Promise<VisitedPoiType[]> => {
  const rawResult = await apiClient.get("api/visited-pois").json();

  if (!validateResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
