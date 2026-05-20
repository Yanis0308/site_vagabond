import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { GetUserZoneStatsV2ResponseSchema } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/stats/me",
    {
      schema: {
        tags: ["zones"],
        security: [{ bearerAuth: [] }],
        response: {
          200: GetUserZoneStatsV2ResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const stats = await fastify.dbRepositories.boundary.findUserZoneStatsV2(
        request.user.uid,
      );

      return await reply.status(200).send({ data: stats });
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
          200: GetUserZoneStatsV2ResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { userId } = request.params;

      const targetUser =
        await fastify.dbRepositories.user.getPublicUserInfo(userId);

      // Profil privé : on retourne les stats agrégées (compteurs uniquement)
      // — pas de last_visited_poi_name pour ne pas leak un POI identifiable.
      const stats =
        await fastify.dbRepositories.boundary.findUserZoneStatsV2(userId);
      if (targetUser?.isPrivate === true) {
        return await reply.status(200).send({
          data: stats.map((s) => ({
            ...s,
            last_visited_poi_at: null,
            last_visited_poi_name: null,
          })),
        });
      }

      return await reply.status(200).send({ data: stats });
    },
  );
};

export default routes;
