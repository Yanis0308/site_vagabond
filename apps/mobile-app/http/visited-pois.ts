import {
  GetVisitedPoisResponseSchema,
  validateWithSchema,
  type VisitedPoi,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

export const getVisitedPois = async (poiId: string): Promise<VisitedPoi[]> => {
  const rawResult = await apiClient.get(`api/visited-pois/${poiId}`).json();

  if (!validateWithSchema(GetVisitedPoisResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

export const getUserVisitedPois = async (): Promise<VisitedPoi[]> => {
  const rawResult = await apiClient.get("api/visited-pois").json();

  if (!validateWithSchema(GetVisitedPoisResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
