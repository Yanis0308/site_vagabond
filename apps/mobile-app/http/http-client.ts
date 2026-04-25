import ky, { type HTTPError, type KyInstance } from "ky";

import { recordError, trackEvent } from "@/lib/analytics/analytics";
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
        logger("API Error", error);

        const url = new URL(error.request.url);
        const endpoint = url.pathname + url.search;
        const method = error.request.method;
        const status = error.response.status;

        void trackEvent("api_error", { endpoint, status, method });
        void recordError(
          new Error(`API Error: ${status} ${error.response.statusText}`),
          {
            type: "api_error",
            endpoint,
            method,
            status_code: String(status),
            status_text: error.response.statusText,
          },
        );

        return error;
      },
    ],
  },
});
