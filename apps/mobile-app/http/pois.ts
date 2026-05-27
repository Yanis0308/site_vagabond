import {
  generateValidator,
  GetPoiEnrichedResponseSchema,
  type PoiEnrichedData,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

const validateGetPoiEnrichedResponse = generateValidator(
  GetPoiEnrichedResponseSchema,
);

export const getPoiEnriched = async (
  poiId: string,
): Promise<PoiEnrichedData> => {
  const rawResult = await apiClient.get(`api/pois/${poiId}`).json();

  if (!validateGetPoiEnrichedResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
