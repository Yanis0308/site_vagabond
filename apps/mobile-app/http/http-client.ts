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
      (request: Request): Promise<void> => {
        // Log de début de requête (sera personnalisé par chaque client)
        const url = new URL(request.url);
        logger("HTTP Call", url.pathname + url.search, request.method);
        return Promise.resolve();
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
