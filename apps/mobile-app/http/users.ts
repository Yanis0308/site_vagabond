import {
  generateValidator,
  type UserMe,
  type UserPublicInfo,
  UserPublicInfoResponseSchema,
  UsersMeResponseSchema,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

const validateUsersMeResponse = generateValidator(UsersMeResponseSchema);
const validateUserPublicInfoResponse = generateValidator(
  UserPublicInfoResponseSchema,
);

export const getMe = async (): Promise<UserMe> => {
  const rawResult = await apiClient.get("api/users/me").json();

  if (!validateUsersMeResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

export const updateUserMe = async (data: {
  nickname?: string;
  isPrivate?: boolean;
}): Promise<void> => {
  await apiClient.patch("api/users/me", { json: data });
};

export const getUserPublicInfo = async (
  userId: string,
): Promise<UserPublicInfo> => {
  const rawResult = await apiClient.get(`api/users/${userId}`).json();

  if (!validateUserPublicInfoResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

export const deleteMe = async (): Promise<void> => {
  await apiClient.delete("api/users/me");
};

export const submitAppReview = async (
  positive: boolean,
  comment: string | null,
): Promise<void> => {
  await apiClient
    .post("api/users/me/app-review", { json: { positive, comment } })
    .json();
};
