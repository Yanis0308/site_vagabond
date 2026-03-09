import { requestContext } from "@fastify/request-context";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";

/**
 * Get the request-scoped logger from AsyncLocalStorage context.
 * Falls back to `fastify.log` when called outside a request context
 * (e.g. during startup or in background tasks without a parent request).
 */
export function getLogger(fastify: FastifyInstance): FastifyBaseLogger {
  // eslint-disable-next-line no-restricted-syntax -- This is the centralized fallback, all other code must use getLogger()
  return requestContext.get("log") ?? fastify.log;
}
