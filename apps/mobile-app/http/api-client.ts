import { getAuth, getIdToken } from "@react-native-firebase/auth";
import { type KyInstance } from "ky";

import { config } from "@/constants/Config";

import { httpClient } from "./http-client";

// Client HTTP pour notre API avec authentification Firebase
export const apiClient: KyInstance = httpClient.extend({
  prefixUrl: config.apiBaseUrl,
  retry: {
    limit: 1,
    statusCodes: [401],
    methods: ["get", "post", "put", "patch", "delete"],
  },
  hooks: {
    beforeRequest: [
      async (request, _options, { retryCount }): Promise<void> => {
        if (retryCount > 0) {
          return;
        }
        const currentUser = getAuth().currentUser;
        if (currentUser === null) {
          return;
        }
        // Ajouter le token d'authentification Firebase
        const idToken = await getIdToken(currentUser);
        request.headers.set("Authorization", `Bearer ${idToken}`);
      },
    ],
    beforeRetry: [
      async ({ request }): Promise<void> => {
        const currentUser = getAuth().currentUser;
        if (currentUser === null) {
          return;
        }
        // Forcer le refresh du token Firebase sur 401
        const freshToken = await getIdToken(currentUser, true);
        request.headers.set("Authorization", `Bearer ${freshToken}`);
      },
    ],
  },
});
