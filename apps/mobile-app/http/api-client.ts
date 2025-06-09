import { getAuth } from "@react-native-firebase/auth";
import ky, { type KyInstance } from "ky";

import { config } from "@/constants/Config";
// import { logger } from "@/utils/logger";

export const apiClient: KyInstance = ky.create({
  prefixUrl: config.apiBaseUrl,
  hooks: {
    beforeRequest: [
      async (request): Promise<void> => {
        const idToken = await getAuth().currentUser?.getIdToken();
        if (idToken !== undefined) {
          request.headers.set("Authorization", `Bearer ${idToken}`);
        }
      },
    ],
  },
});
