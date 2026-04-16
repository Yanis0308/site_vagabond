import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { GetUserZoneStatsResponseSchema } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/stats/me",
    {
      schema: {
        tags: ["zones"],
        security: [{ bearerAuth: [] }],
        response: {
          200: GetUserZoneStatsResponseSchema,
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
          200: GetUserZoneStatsResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { userId } = request.params;

      const targetUser =
        await fastify.dbRepositories.user.getPublicUserInfo(userId);

      if (targetUser?.isPrivate === true) {
        const redactedStats =
          await fastify.dbRepositories.boundary.findUserZoneStats(
            userId,
            undefined,
            false,
          );

        return await reply.status(200).send({ data: redactedStats });
      }

      const userZoneStats =
        await fastify.dbRepositories.boundary.findUserZoneStats(userId);

      return await reply.status(200).send({
        data: userZoneStats,
      });
    },
  );
};

export default routes;
