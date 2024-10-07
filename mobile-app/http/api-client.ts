import { config } from "@/constants/Config";
import ky from "ky";

export const apiClient = (apiAccessToken: string | null) => {
  console.log("apiAccessToken", apiAccessToken);
  return ky.create({
    prefixUrl: config.apiBaseUrl,
    headers: {
      Authorization: apiAccessToken ? `Bearer ${apiAccessToken}` : undefined,
    },
  });
};
