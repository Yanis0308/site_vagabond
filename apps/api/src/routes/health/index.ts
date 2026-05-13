import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  ErrorResponseSchema,
  HealthResponseSchema,
  ReadyResponseSchema,
} from "@vagabond/shared-utils";

import { shutdownState } from "../../lib/shutdown-state.js";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/live",
    {
      schema: {
        tags: ["health"],
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async function (_request, reply) {
      return await reply.status(200).send({ data: { status: "ok" } });
    },
  );

  fastify.get(
    "/ready",
    {
      schema: {
        tags: ["health"],
        response: {
          200: ReadyResponseSchema,
          503: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      if (shutdownState.isShuttingDown) {
        return await reply.status(503).send({
          statusCode: 503,
          error: "Service Unavailable",
          message: "Shutting down",
        });
      }

      try {
        await fastify.dbPing();
        return await reply.status(200).send({
          data: { status: "ready", checks: { database: "up" } },
        });
      } catch (error) {
        request.log.warn({ err: error }, "Readiness check failed: database");
        return await reply.status(503).send({
          statusCode: 503,
          error: "Service Unavailable",
          message: "Database is down",
        });
      }
    },
  );
};

export default routes;
