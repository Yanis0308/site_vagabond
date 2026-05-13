import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  EmptyResponseSchema,
  ErrorResponseSchema,
  UserLocationRequestSchema,
} from "@vagabond/shared-utils";

import { captureAndLog } from "../../utils/logger.js";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["location"],
        security: [{ bearerAuth: [] }],
        body: UserLocationRequestSchema,
        response: {
          200: EmptyResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const user = request.user.db;
      const { timestamp, ...coords } = request.body;

      try {
        await fastify.dbRepositories.location.insertLocation({
          userId: user.userId,
          ...coords,
          timestamp: new Date(timestamp),
        });

        return await reply.status(200).send({ data: {} });
      } catch (error) {
        captureAndLog(fastify, error, "Error saving user location", {
          tags: { operation: "location-save" },
          extra: { userId: user.userId },
        });

        return await reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Failed to save user location",
        });
      }
    },
  );
};

export default routes;
