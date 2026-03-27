import {
  type UserMe,
  type UserPublicInfo,
  UserPublicInfoResponseSchema,
  UsersMeResponseSchema,
  validateWithSchema,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

export const getMe = async (): Promise<UserMe> => {
  const rawResult = await apiClient.get("api/users/me").json();

  if (!validateWithSchema(UsersMeResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

export const updateUserNickname = async (nickname: string): Promise<void> => {
  await apiClient.patch("api/users/me", { json: { nickname } });
};

export const getUserPublicInfo = async (
  userId: string,
): Promise<UserPublicInfo> => {
  const rawResult = await apiClient.get(`api/users/${userId}`).json();

  if (!validateWithSchema(UserPublicInfoResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

export const submitAppReview = async (
  positive: boolean,
  comment: string | null,
): Promise<void> => {
  await apiClient
    .post("api/users/me/app-review", { json: { positive, comment } })
    .json();
};
