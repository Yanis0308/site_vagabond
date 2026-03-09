import type { FastifyInstance } from "fastify";
import ky, { type HTTPError, type KyInstance } from "ky";

import { getLogger } from "../../utils/logger.js";

/**
 * Create a base HTTP client with default configuration
 */
export function createBaseClient(fastify: FastifyInstance): KyInstance {
  return ky.create({
    timeout: 120 * 1000, // 120 seconds
    retry: 0, // Désactiver le retry par défaut
    hooks: {
      beforeRequest: [
        (request: Request): Promise<void> => {
          // Log de début de requête (sera personnalisé par chaque client)
          const url = new URL(request.url);
          getLogger(fastify).info(
            `HTTP Call: ${url.pathname + url.search} ${request.method}`,
          );
          return Promise.resolve();
        },
      ],
      beforeError: [
        async (error): Promise<HTTPError> => {
          const { response } = error;
          const body = await response.text();
          getLogger(fastify).error(
            {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              body,
            },
            "HTTP request failed",
          );

          return error;
        },
      ],
    },
  });
}
