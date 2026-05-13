import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  ErrorResponseSchema,
  StaffToolsCompleteZoneRequestSchema,
  StaffToolsCompleteZoneResponseSchema,
  StaffToolsValidatePlaceResponseSchema,
} from "@vagabond/shared-utils";

import {
  completeZone,
  randomImageKey,
} from "../../services/staff-tools-zone-completion.service.js";

// Note: l'accès staff-only + dev-server est garanti par le hook onRequest dans plugins/auth.ts
const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.post(
    "/pois/:poiId/validate",
    {
      schema: {
        tags: ["staff-tools"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ poiId: Type.String() }),
        response: {
          200: StaffToolsValidatePlaceResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { poiId } = request.params;
      const userId = request.user.uid;

      const existing = await fastify.dbRepositories.visitedPoi.findByPoiAndUser(
        poiId,
        userId,
      );
      if (existing !== undefined) {
        return await reply.status(409).send({
          statusCode: 409,
          error: "Conflict",
          message: "Place already validated by this user",
        });
      }

      const coords = await fastify.dbRepositories.poi.findCoordsById(poiId);
      if (coords === undefined) {
        return await reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "POI not found",
        });
      }

      const { id } = await fastify.dbRepositories.visitedPoi.createCustom({
        poiId,
        userId,
        coords: { latitude: coords.latitude, longitude: coords.longitude },
        imageKey: randomImageKey(),
        imageSource: "CAMERA",
        rating: 5,
        comment: "",
      });

      return await reply.status(200).send({ data: { id } });
    },
  );

  fastify.post(
    "/zones/complete",
    {
      schema: {
        tags: ["staff-tools"],
        security: [{ bearerAuth: [] }],
        body: StaffToolsCompleteZoneRequestSchema,
        response: {
          200: StaffToolsCompleteZoneResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { poiId, boundaryLevel, percentage } = request.body;

      try {
        const result = await completeZone(
          poiId,
          boundaryLevel,
          percentage,
          request.user.uid,
          fastify.dbRepositories,
        );

        return await reply.status(200).send({ data: result });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith("No boundary found")
        ) {
          return await reply.status(404).send({
            statusCode: 404,
            error: "Not Found",
            message: error.message,
          });
        }

        throw error;
      }
    },
  );
};

export default routes;
