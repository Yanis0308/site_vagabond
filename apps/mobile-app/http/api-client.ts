import { getAuth } from "@react-native-firebase/auth";
import ky, { type HTTPError, type KyInstance } from "ky";

import { config } from "@/constants/Config";
import { UnifiedAnalyticsService } from "@/lib/analytics/UnifiedAnalyticsService";
import { logger } from "@/utils/logger";

export const apiClient: KyInstance = ky.create({
  prefixUrl: config.apiBaseUrl,
  timeout: 60 * 1000, // 60 seconds
  hooks: {
    beforeRequest: [
      async (request): Promise<void> => {
        // Add authorization token
        const idToken = await getAuth().currentUser?.getIdToken();
        if (idToken !== undefined) {
          request.headers.set("Authorization", `Bearer ${idToken}`);
        }

        // Log API call start
        const url = new URL(request.url);
        logger("API Call", url.pathname + url.search, request.method);
      },
    ],
    beforeError: [
      (error): HTTPError => {
        logger("API Error", error);

        // Log API error with Crashlytics
        const url = new URL(error.request.url);
        void UnifiedAnalyticsService.getInstance().recordError(
          new Error(
            `API Error: ${error.response.status} ${error.response.statusText}`,
          ),
          "API Request Failed",
          {
            endpoint: url.pathname + url.search,
            method: error.request.method,
            statusCode: error.response.status,
            statusText: error.response.statusText,
            baseUrl: config.apiBaseUrl,
          },
        );

        return error;
      },
    ],
  },
});
