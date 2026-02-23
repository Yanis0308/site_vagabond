import {
  GetPoiEnrichedResponseSchema,
  type PoiEnrichedData,
  validateWithSchema,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

export const getPoiEnriched = async (
  poiId: string,
): Promise<PoiEnrichedData> => {
  const rawResult = await apiClient.get(`api/pois/${poiId}`).json();

  if (!validateWithSchema(GetPoiEnrichedResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
