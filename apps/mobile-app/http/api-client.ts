import ky, { KyInstance } from "ky";

import { config } from "@/constants/Config";
import { logger } from "@/utils/logger";

export const apiClient = (apiAccessToken: string | null): KyInstance => {
  logger("apiAccessToken", config.isLocalDev && apiAccessToken);
  return ky.create({
    prefixUrl: config.apiBaseUrl,
    headers: {
      Authorization: apiAccessToken ? `Bearer ${apiAccessToken}` : undefined,
    },
  });
};
