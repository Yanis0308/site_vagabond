import { config } from "@/constants/Config";
import { log } from "@/utils/logger";
import ky from "ky";

export const apiClient = (apiAccessToken: string | null) => {
  log("apiAccessToken", config.isLocalDev && apiAccessToken);
  return ky.create({
    prefixUrl: config.apiBaseUrl,
    headers: {
      Authorization: apiAccessToken ? `Bearer ${apiAccessToken}` : undefined,
    },
  });
};
