import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";
import { type UsersMeType } from "@/utils/types";

const validateResponse = generateValidator(jsonSchemas.UsersMeResponseSchema);

export const getMe = async (): Promise<UsersMeType> => {
  const rawResult = await apiClient.get("api/users/me").json();

  if (!validateResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  logger("/users/me fetched");

  return rawResult.data;
};
