import {
  StaffToolsValidatePlaceResponseSchema,
  validateWithSchema,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";

export const staffToolsValidatePlace = async (
  placeId: string,
): Promise<{ id: number }> => {
  const rawResult = await apiClient
    .post(`api/staff-tools/pois/${placeId}/validate`)
    .json();
  logger("=== staff-tools validate place result:", JSON.stringify(rawResult));

  if (!validateWithSchema(StaffToolsValidatePlaceResponseSchema, rawResult)) {
    throw new Error("Invalid response from staff-tools validate place");
  }

  return rawResult.data;
};
