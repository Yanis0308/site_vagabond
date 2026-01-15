import type { FastifyInstance } from "fastify";
import ky, { type HTTPError, type KyInstance } from "ky";

/**
 * Create a base HTTP client with default configuration
 */
export function createBaseClient(fastify: FastifyInstance): KyInstance {
  return ky.create({
    timeout: 120 * 1000, // 120 seconds
    hooks: {
      beforeError: [
        async (error): Promise<HTTPError<unknown>> => {
          const { response } = error;
          const body = await response.text();
          fastify.log.error(
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
