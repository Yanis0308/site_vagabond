import { getAuth } from "@react-native-firebase/auth";
import ky, { type KyInstance } from "ky";

import { config } from "@/constants/Config";

export const apiClient: KyInstance = ky.create({
  prefixUrl: config.apiBaseUrl,
  hooks: {
    beforeRequest: [
      async (request): Promise<void> => {
        request.headers.set(
          "Authorization",
          `Bearer ${await getAuth().currentUser?.getIdToken()}`,
        );
      },
    ],
  },
});
