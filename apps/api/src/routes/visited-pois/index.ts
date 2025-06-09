import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { jsonSchemas } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.post(
    "/:poiId",
    {
      schema: {
        tags: ["visited-pois"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          poiId: Type.String(),
        }),
        body: Type.Ref(jsonSchemas.CreateVisitedPoiRequestSchema),
        response: {
          200: Type.Ref(jsonSchemas.EmptyResponseSchema),
          409: Type.Ref(jsonSchemas.ErrorResponseSchema),
        },
      },
    },
    async function (request, reply) {
      const { poiId } = request.params;
      const { imageKey, rating, comment, coords } = request.body;

      const visitedPoi = await fastify.prisma.visitedPoi.findFirst({
        where: {
          poiId,
          userId: request.user.uid,
        },
        select: {
          id: true,
        },
      });

      if (visitedPoi !== null) {
        return await reply.status(409).send({
          error: {
            type: "RESOURCE_ALREADY_EXISTS",
            message: "Visited POI already exists for this user",
          },
        });
      }

      await fastify.prisma.visitedPoi.createCustom({
        poiId,
        imageKey,
        rating,
        comment,
        coords,
        userId: request.user.uid,
      });

      return await reply.status(200).send();
    },
  );

  fastify.get(
    "/",
    {
      schema: {
        tags: ["visited-pois"],
        security: [{ bearerAuth: [] }],
        response: {
          200: Type.Ref(jsonSchemas.GetVisitedPoisResponseSchema),
        },
      },
    },
    async function (request, reply) {
      const visitedPois = await fastify.prisma.visitedPoi.findMany({
        where: {
          userId: request.user.uid,
        },
        select: {
          id: true,
          poiId: true,
          userId: true,
          createdAt: true,
        },
      });

      return await reply.status(200).send({
        data: visitedPois.map((visitedPoi) => ({
          ...visitedPoi,
          createdAt: visitedPoi.createdAt.toISOString(),
        })),
      });
    },
  );
};

export default routes;
