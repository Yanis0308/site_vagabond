import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  LeaderboardV2QuerySchema,
  LeaderboardV2ResponseSchema,
} from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["leaderboard"],
        security: [{ bearerAuth: [] }],
        querystring: LeaderboardV2QuerySchema,
        response: {
          200: LeaderboardV2ResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { period, after, limit } = request.query;

      const { items, nextCursor } =
        await fastify.dbRepositories.user.getLeaderboardV2({
          period,
          after,
          limit,
        });

      return await reply.status(200).send({
        data: { items, nextCursor, period },
      });
    },
  );
};

export default routes;
