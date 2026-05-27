import {
  generateValidator,
  type StaffToolsCompleteZoneRequest,
  StaffToolsCompleteZoneResponseSchema,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";

const validateStaffToolsCompleteZoneResponse = generateValidator(
  StaffToolsCompleteZoneResponseSchema,
);

export const staffToolsCompleteZone = async (
  data: StaffToolsCompleteZoneRequest,
): Promise<{ addedCount: number; removedCount: number }> => {
  const rawResult = await apiClient
    .post("api/staff-tools/zones/complete", { json: data })
    .json();
  logger("=== staff-tools complete zone result:", JSON.stringify(rawResult));

  if (!validateStaffToolsCompleteZoneResponse(rawResult)) {
    throw new Error("Invalid response from staff-tools complete zone");
  }

  return rawResult.data;
};
