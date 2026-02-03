import { getAuth, getIdToken } from "@react-native-firebase/auth";
import { type KyInstance } from "ky";

import { config } from "@/constants/Config";

import { httpClient } from "./http-client";

// Client HTTP pour notre API avec authentification Firebase
export const apiClient: KyInstance = httpClient.extend({
  prefixUrl: config.apiBaseUrl,
  hooks: {
    beforeRequest: [
      async (request): Promise<void> => {
        const currentUser = getAuth().currentUser;
        if (currentUser === null) {
          return;
        }
        // Ajouter le token d'authentification Firebase
        const idToken = await getIdToken(currentUser);
        //logger("idToken", idToken);
        request.headers.set("Authorization", `Bearer ${idToken}`);
      },
    ],
  },
});
