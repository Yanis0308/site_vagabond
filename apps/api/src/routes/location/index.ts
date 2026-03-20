import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  EmptyResponseSchema,
  ErrorResponseSchema,
  UserLocationRequestSchema,
} from "@vagabond/shared-utils";

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
      const { coords, timestamp, ...body } = request.body;

      try {
        await fastify.dbRepositories.location.insertLocation({
          userId: user.userId,
          ...body,
          ...coords,
          timestamp: new Date(timestamp),
        });

        return await reply.status(200).send({ data: {} });
      } catch (error) {
        request.log.error(
          {
            userId: user.userId,
            error,
          },
          "Error saving user location",
        );

        return await reply.status(500).send({
          error: {
            type: "INTERNAL_SERVER_ERROR",
            message: "Failed to save user location",
          },
        });
      }
    },
  );
};

export default routes;
