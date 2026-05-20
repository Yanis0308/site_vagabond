import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  LeaderboardMeQuerySchema,
  LeaderboardMeResponseSchema,
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
        security: [{ bearerAuth: [] }],
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

  fastify.get(
    "/me",
    {
      schema: {
        tags: ["leaderboard"],
        security: [{ bearerAuth: [] }],
        querystring: LeaderboardMeQuerySchema,
        response: {
          200: LeaderboardMeResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { period } = request.query;

      const { me, neighbors } =
        await fastify.dbRepositories.user.getLeaderboardMe({
          userId: request.user.uid,
          period,
        });

      return await reply.status(200).send({
        data: { me, neighbors, period },
      });
    },
  );
};

export default routes;
