import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { jsonSchemas } from "@vagabond/shared-utils";
import dayjs from "dayjs";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["leaderboard"],
        querystring: Type.Ref(jsonSchemas.LeaderboardQuerySchema),
        response: {
          200: Type.Ref(jsonSchemas.LeaderboardResponseSchema),
        },
      },
    },
    async function (request, reply) {
      const { period } = request.query;
      const startOfMonth = dayjs().startOf("month").toDate();

      // Build the where clause for visited pois based on period
      const visitedPoisWhere =
        period === "monthly"
          ? {
              createdAt: {
                gte: startOfMonth,
              },
            }
          : {};

      // Query users with their visited POIs count
      const usersWithCounts = await fastify.prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              visitedPois: {
                where: visitedPoisWhere,
              },
            },
          },
          visitedPois: {
            select: {
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          visitedPois: {
            _count: "desc",
          },
        },
      });

      // Sort by count descending and add rank
      const sortedUsers = usersWithCounts
        .map((user) => ({
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          visitedPoisCount: user._count.visitedPois,
          registrationDate: user.createdAt.toISOString(),
          lastVisitedPoiDate:
            user.visitedPois.length > 0
              ? (user.visitedPois[0]?.createdAt?.toISOString() ?? null)
              : null,
        }))
        .sort((a, b) => b.visitedPoisCount - a.visitedPoisCount)
        .map((user, index) => ({
          ...user,
          rank: index + 1,
        }));

      return await reply.status(200).send({
        data: {
          users: sortedUsers,
          period: period,
        },
      });
    },
  );
};

export default routes;
