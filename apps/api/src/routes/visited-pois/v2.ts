import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  CursorPaginationQuerySchema,
  VisitedPoisV2QuerySchema,
  VisitedPoisV2ResponseSchema,
} from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["visited-pois"],
        security: [{ bearerAuth: [] }],
        querystring: VisitedPoisV2QuerySchema,
        response: {
          200: VisitedPoisV2ResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { after, limit, boundaryId, userId: targetUserId } = request.query;
      const callerId = request.user.uid;
      const effectiveUserId = targetUserId ?? callerId;

      if (targetUserId !== undefined && targetUserId !== callerId) {
        const targetUser =
          await fastify.dbRepositories.user.getPublicUserInfo(targetUserId);
        if (targetUser?.isPrivate === true) {
          return await reply.status(200).send({
            data: { items: [], nextCursor: null },
          });
        }
      }

      const { items, nextCursor } =
        await fastify.dbRepositories.visitedPoi.findByUserIdPaginated({
          userId: effectiveUserId,
          after,
          limit,
          boundaryId,
        });

      return await reply.status(200).send({
        data: { items, nextCursor },
      });
    },
  );

  fastify.get(
    "/:poiId",
    {
      schema: {
        tags: ["visited-pois"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ poiId: Type.String() }),
        querystring: CursorPaginationQuerySchema,
        response: {
          200: VisitedPoisV2ResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { poiId } = request.params;
      const { after, limit } = request.query;

      const { items, nextCursor } =
        await fastify.dbRepositories.visitedPoi.findByPoiIdPaginated({
          poiId,
          after,
          limit,
        });

      return await reply.status(200).send({
        data: { items, nextCursor },
      });
    },
  );
};

export default routes;
