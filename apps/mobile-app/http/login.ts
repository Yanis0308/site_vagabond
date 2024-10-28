import { Platform } from "react-native";
import { z } from "zod";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";

const UserAuthInfoSchema = z.object({ jwt: z.string() });
type UserAuthInfo = z.infer<typeof UserAuthInfoSchema>;

export const loginWithGoogle = async (
  accessToken: string,
): Promise<UserAuthInfo> => {
  const rawResult = await apiClient(null)
    .get("api/auth/google/callback", {
      searchParams: { access_token: accessToken },
    })
    .json();
  logger("data", JSON.stringify(rawResult));
  return UserAuthInfoSchema.parse(rawResult);
};

export const loginWithApple = async (code: string): Promise<UserAuthInfo> => {
  const rawResult = await apiClient(null)
    .get("api/auth/apple/callback", {
      searchParams: { code, platform: Platform.OS },
    })
    .json();
  logger("data", JSON.stringify(rawResult));
  return UserAuthInfoSchema.parse(rawResult);
};
