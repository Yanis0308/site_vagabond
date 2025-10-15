import { getAuth } from "@react-native-firebase/auth";
import { type KyInstance } from "ky";

import { config } from "@/constants/Config";

import { httpClient } from "./http-client";

// Client HTTP pour notre API avec authentification Firebase
export const apiClient: KyInstance = httpClient.extend({
  prefixUrl: config.apiBaseUrl,
  hooks: {
    beforeRequest: [
      async (request): Promise<void> => {
        // Ajouter le token d'authentification Firebase
        const idToken = await getAuth().currentUser?.getIdToken();
        //logger("idToken", idToken);
        if (idToken !== undefined) {
          request.headers.set("Authorization", `Bearer ${idToken}`);
        }
      },
    ],
  },
});
