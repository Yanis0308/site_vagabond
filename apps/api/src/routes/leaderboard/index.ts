import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  LeaderboardQuerySchema,
  LeaderboardResponseSchema,
} from "@vagabond/shared-utils";
import dayjs from "dayjs";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["leaderboard"],
        querystring: LeaderboardQuerySchema,
        response: {
          200: LeaderboardResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { period } = request.query;
      const startOfMonth = dayjs().startOf("month").toDate();

      const users = await fastify.dbRepositories.user.getLeaderboard(
        period,
        startOfMonth,
      );

      return await reply.status(200).send({
        data: {
          users,
          period,
        },
      });
    },
  );
};

export default routes;
