import { type KyInstance } from "ky";

import { config } from "@/constants/Config";

import { getFirebaseIdToken, hasAuthenticatedUser } from "./firebase-auth";
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
        if (!hasAuthenticatedUser()) {
          return;
        }
        const idToken = await getFirebaseIdToken(false);
        request.headers.set("Authorization", `Bearer ${idToken}`);
      },
    ],
    beforeRetry: [
      async ({ request }): Promise<void> => {
        if (!hasAuthenticatedUser()) {
          return;
        }
        // Forcer le refresh du token Firebase sur 401
        const freshToken = await getFirebaseIdToken(true);
        request.headers.set("Authorization", `Bearer ${freshToken}`);
      },
    ],
  },
});
