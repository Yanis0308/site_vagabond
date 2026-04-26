import {
  type StaffToolsCompleteZoneRequest,
  StaffToolsCompleteZoneResponseSchema,
  validateWithSchema,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";

export const staffToolsCompleteZone = async (
  data: StaffToolsCompleteZoneRequest,
): Promise<{ addedCount: number; removedCount: number }> => {
  const rawResult = await apiClient
    .post("api/staff-tools/zones/complete", { json: data })
    .json();
  logger("=== staff-tools complete zone result:", JSON.stringify(rawResult));

  if (!validateWithSchema(StaffToolsCompleteZoneResponseSchema, rawResult)) {
    throw new Error("Invalid response from staff-tools complete zone");
  }

  return rawResult.data;
};
