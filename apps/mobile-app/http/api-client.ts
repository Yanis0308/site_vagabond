import { getAuth } from "@react-native-firebase/auth";
import { type KyInstance } from "ky";

import { config } from "@/constants/Config";
import { logger } from "@/utils/logger";

import { httpClient } from "./http-client";

// Client HTTP pour notre API avec authentification Firebase
export const apiClient: KyInstance = httpClient.extend({
  prefixUrl: config.apiBaseUrl,
  hooks: {
    beforeRequest: [
      (request: Request): Promise<void> => {
        // Log spécifique API
        const url = new URL(request.url);
        logger("API Call", url.pathname + url.search, request.method);
        return Promise.resolve();
      },
      async (request): Promise<void> => {
        // Ajouter le token d'authentification Firebase
        const idToken = await getAuth().currentUser?.getIdToken();
        if (idToken !== undefined) {
          request.headers.set("Authorization", `Bearer ${idToken}`);
        }
      },
    ],
  },
});
