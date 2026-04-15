import {
  CheckVisitedPoiImageResponseSchema,
  GetVisitedPoisResponseSchema,
  validateWithSchema,
  type VisitedPoi,
} from "@vagabond/shared-utils";
import { HTTPError } from "ky";

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

export const deleteVisitedPoi = async (visitedPoiId: number): Promise<void> => {
  await apiClient.delete(`api/visited-pois/${visitedPoiId}`);
};

export type VisitedPoiImageStatus = "has-image" | "no-image" | "unknown";

export const checkVisitedPoiHasImage = async (
  visitedPoiId: number,
): Promise<VisitedPoiImageStatus> => {
  try {
    const rawResult = await apiClient
      .get(`api/visited-pois/${visitedPoiId}/status`)
      .json();

    if (!validateWithSchema(CheckVisitedPoiImageResponseSchema, rawResult)) {
      return "unknown";
    }

    return rawResult.data.hasImage ? "has-image" : "no-image";
  } catch (error) {
    // 404 = visitedPoi deleted server-side → treat as "has-image" so the
    // local file is cleaned up (no point retrying an upload for a non-existent row).
    if (error instanceof HTTPError && error.response.status === 404) {
      return "has-image";
    }
    return "unknown";
  }
};
