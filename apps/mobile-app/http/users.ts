import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { type UserPublicInfoType, type UsersMeType } from "@/utils/types";

const validateMeResponse = generateValidator(jsonSchemas.UsersMeResponseSchema);

export const getMe = async (): Promise<UsersMeType> => {
  const rawResult = await apiClient.get("api/users/me").json();

  if (!validateMeResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

const validateUserPublicInfoResponse = generateValidator(
  jsonSchemas.UserPublicInfoResponseSchema,
);

export const getUserPublicInfo = async (
  userId: string,
): Promise<UserPublicInfoType> => {
  const rawResult = await apiClient.get(`api/users/${userId}`).json();

  if (!validateUserPublicInfoResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
