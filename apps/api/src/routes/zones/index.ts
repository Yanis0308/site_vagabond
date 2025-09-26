import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { jsonSchemas } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/all",
    {
      schema: {
        tags: ["zones"],
        security: [{ bearerAuth: [] }],
        response: {
          200: Type.Ref(jsonSchemas.GetZoneStatsResponseSchema),
        },
      },
    },
    async function (request, reply) {
      // Use the extended client method for zone statistics with multiple boundary levels
      const zoneStats = await fastify.prisma.boundary.findAllZones();

      // Format the response with proper data structure
      const formattedStats = zoneStats.map((stat) => {
        return {
          zone_id: stat.zone_id,
          name: stat.name ?? "Unknown",
          point: {
            latitude: stat.point.latitude,
            longitude: stat.point.longitude,
          },
          total_pois: stat.total_pois,
          boundary_level: stat.boundary_level,
          place_type: stat.place_type,
          population: stat.population,
          is_capital: stat.is_capital,
          importance_score: stat.importance_score,
          way_area: stat.way_area,
          parent_id: stat.parent_id,
        };
      });

      return await reply.status(200).send({
        data: formattedStats,
      });
    },
  );

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
