import {
  CheckVisitedPoiImageResponseSchema,
  GetVisitedPoisResponseSchema,
  validateWithSchema,
  type VisitedPoi,
  VisitedPoisV2ResponseSchema,
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

// v2 : pagination cursor — timeline visited POIs du user
export const getUserVisitedPoisV2 = async ({
  after,
  limit = 20,
  boundaryId,
  userId,
}: {
  after?: string;
  limit?: number;
  boundaryId?: string;
  userId?: string;
}): Promise<{ items: VisitedPoi[]; nextCursor: string | null }> => {
  const searchParams: Record<string, string | number> = { limit };
  if (after !== undefined) searchParams.after = after;
  if (boundaryId !== undefined) searchParams.boundaryId = boundaryId;
  if (userId !== undefined) searchParams.userId = userId;

  const rawResult = await apiClient
    .get("api/v2/visited-pois", { searchParams })
    .json();

  if (!validateWithSchema(VisitedPoisV2ResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

// v2 : pagination cursor — visiteurs d'un POI
export const getVisitedPoisByPoiIdV2 = async ({
  poiId,
  after,
  limit = 20,
}: {
  poiId: string;
  after?: string;
  limit?: number;
}): Promise<{ items: VisitedPoi[]; nextCursor: string | null }> => {
  // ⚠️ Cf. getUserVisitedPoisV2 — objet plain vs URLSearchParams (bug RN polyfill).
  const searchParams: Record<string, string | number> = { limit };
  if (after !== undefined) searchParams.after = after;

  const rawResult = await apiClient
    .get(`api/v2/visited-pois/${poiId}`, { searchParams })
    .json();

  if (!validateWithSchema(VisitedPoisV2ResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
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
