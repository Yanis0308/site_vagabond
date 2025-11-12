import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { jsonSchemas } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/stats",
    {
      schema: {
        tags: ["zones"],
        security: [{ bearerAuth: [] }],
        response: {
          200: Type.Ref(jsonSchemas.GetUserZoneStatsResponseSchema),
        },
      },
    },
    async function (request, reply) {
      // Get user zone statistics using the extended client method
      // The validated_pois are already included in the SQL query
      const userZoneStats = await fastify.prisma.boundary.findUserZoneStats(
        request.user.uid,
      );

      return await reply.status(200).send({
        data: userZoneStats,
      });
    },
  );
};

export default routes;
