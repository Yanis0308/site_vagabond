import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { jsonSchemas } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["pois"],
        security: [{ bearerAuth: [] }],
        querystring: Type.Ref(jsonSchemas.BoundingBoxSchema),
        response: {
          200: Type.Ref(jsonSchemas.GetPoisResponseSchema),
        },
      },
    },
    async function (request, reply) {
      // const { minLat, maxLat, minLng, maxLng } = request.query;
      // const nb: number = minLat;

      const pois = await fastify.prisma.poi.findInBoundingBox(request.query);

      const poiDatas = await fastify.prisma.poiData.findMany({
        where: {
          poiId: { in: pois.map((poi) => poi.id) },
        },
      });

      const poisWithData = pois.map((poi) => {
        const poiDatasForThisPoi = poiDatas.filter((p) => p.poiId === poi.id);
        return {
          id: poi.id,
          coords: poi.coords,
          data: poiDatasForThisPoi.map((poiData) => ({
            id: poiData.id,
            name: poiData.name,
            description: poiData.description,
            rawInfo: poiData.rawInfo,
            language: poiData.language,
            dataSource: poiData.source,
            createdAt: poiData.createdAt.toISOString(),
            updatedAt: poiData.updatedAt.toISOString(),
          })),
        };
      });

      return await reply.status(200).send({ data: poisWithData });
    },
  );
};

export default routes;
