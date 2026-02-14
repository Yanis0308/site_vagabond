import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";
import { type Static } from "typebox";

import { apiClient } from "@/http/api-client";

const validateResponse = generateValidator(
  jsonSchemas.GetPoiEnrichedResponseSchema,
);

export type PoiEnrichedType = Static<typeof jsonSchemas.PoiEnrichedDataSchema>;

export const getPoiEnriched = async (
  poiId: string,
): Promise<PoiEnrichedType> => {
  const rawResult = await apiClient.get(`api/pois/${poiId}`).json();

  if (!validateResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
