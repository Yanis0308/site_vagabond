import { jsonSchemas } from "@vagabond/shared-utils";
import { generateValidator } from "@vagabond/shared-utils";
import { type Static } from "typebox";

import { apiClient } from "@/http/api-client";

const validateResponse = generateValidator(
  jsonSchemas.GetVisitedPoisResponseSchema,
);

export type VisitedPoiType = Static<
  typeof jsonSchemas.GetVisitedPoisResponseSchema.properties.data
>[0];

export const getVisitedPois = async (
  poiId: string,
): Promise<VisitedPoiType[]> => {
  const rawResult = await apiClient.get(`api/visited-pois/${poiId}`).json();

  if (!validateResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

export const getUserVisitedPois = async (): Promise<VisitedPoiType[]> => {
  const rawResult = await apiClient.get("api/visited-pois").json();

  if (!validateResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
