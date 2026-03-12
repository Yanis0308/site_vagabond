import ky, { type HTTPError, type KyInstance } from "ky";

import { UnifiedAnalyticsService } from "@/lib/analytics/UnifiedAnalyticsService";
import { logger } from "@/utils/logger";

/**
 * Client HTTP de base avec les hooks par défaut
 * Utilisé comme base pour tous les autres clients via ky.extend()
 */
export const httpClient: KyInstance = ky.create({
  timeout: 60 * 1000, // 60 secondes par défaut
  retry: 0, // Désactiver le retry par défaut - TanStack Query will handle retries
  hooks: {
    beforeRequest: [
      (_, options): Promise<void> => {
        options.context.startTime = performance.now();
        return Promise.resolve();
      },
    ],
    afterResponse: [
      (request: Request, options, response: Response): Response => {
        let duration = -1;
        const url = new URL(request.url);
        if (typeof options.context.startTime === "number") {
          duration = Math.round(performance.now() - options.context.startTime);
        }

        logger(
          "HTTP Done",
          request.method,
          url.pathname + url.search,
          `${response.status} — ${duration}ms`,
        );
        return response;
      },
    ],
    beforeError: [
      (error): HTTPError => {
        // Log des erreurs API
        logger("API Error", error);

        // Log des erreurs API aux analytics
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
          },
        );

        return error;
      },
    ],
  },
});
