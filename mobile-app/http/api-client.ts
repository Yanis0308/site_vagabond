import { config } from "@/constants/Config";
import ky from "ky";

export const apiClient = (apiAccessToken: string | null) => {
  console.log("apiAccessToken", apiAccessToken);
  return ky.create({
    prefixUrl: config.EXPO_PUBLIC_API_URL,
    headers: {
      Authorization: apiAccessToken ? `Bearer ${apiAccessToken}` : undefined,
    },
  });
};
