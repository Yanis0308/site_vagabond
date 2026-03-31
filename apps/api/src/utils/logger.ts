import { requestContext } from "@fastify/request-context";
import * as Sentry from "@sentry/node";
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

/**
 * Log an error via Pino and forward it to Sentry in a single call.
 */
export function captureAndLog(
  fastify: FastifyInstance,
  error: unknown,
  message: string,
  options?: {
    level?: "error" | "warning";
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  },
): void {
  const logger = getLogger(fastify);
  const level = options?.level ?? "error";

  if (level === "warning") {
    logger.warn({ err: error, ...options?.extra }, message);
  } else {
    logger.error({ err: error, ...options?.extra }, message);
  }

  Sentry.captureException(
    error instanceof Error ? error : new Error(String(error)),
    {
      level,
      ...(options?.tags !== undefined ? { tags: options.tags } : {}),
      extra: { message, ...options?.extra },
    },
  );
}
