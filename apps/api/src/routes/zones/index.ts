import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { jsonSchemas } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/stats/me",
    {
      schema: {
        tags: ["zones"],
        security: [{ bearerAuth: [] }],
        response: {
          200: jsonSchemas.GetUserZoneStatsResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const userZoneStats =
        await fastify.dbRepositories.boundary.findUserZoneStats(
          request.user.uid,
        );

      return await reply.status(200).send({
        data: userZoneStats,
      });
    },
  );
  fastify.get(
    "/stats/:userId",
    {
      schema: {
        tags: ["zones"],
        params: Type.Object({
          userId: Type.String(),
        }),
        security: [{ bearerAuth: [] }],
        response: {
          200: jsonSchemas.GetUserZoneStatsResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { userId } = request.params;
      const userZoneStats =
        await fastify.dbRepositories.boundary.findUserZoneStats(userId);

      return await reply.status(200).send({
        data: userZoneStats,
      });
    },
  );
};

export default routes;
