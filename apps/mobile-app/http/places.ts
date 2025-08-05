import { jsonSchemas } from "@vagabond/shared-utils";
import { generateValidator } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";
import { type BoundingBoxType, type PoiType } from "@/utils/types";

const validateResponse = generateValidator(jsonSchemas.GetPoisResponseSchema);

export const getPlaces = async (
  boundingBox: BoundingBoxType,
): Promise<PoiType[]> => {
  const rawResult = await apiClient
    .get("api/pois", {
      searchParams: boundingBox,
    })
    .json();

  if (!validateResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  logger("places length:", rawResult.data.length);

  return rawResult.data;
};
