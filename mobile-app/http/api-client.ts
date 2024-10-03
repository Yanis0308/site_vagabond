import { config } from "@/constants/Config";
import ky from "ky";

export const apiClient = (apiAccessToken: string | null) =>
  ky.create({
    prefixUrl: config.EXPO_PUBLIC_API_URL,
    headers: {
      Authorization: apiAccessToken ? `Bearer ${apiAccessToken}` : undefined,
    },
  });
