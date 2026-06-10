import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  CursorPaginationQuerySchema,
  ErrorResponseSchema,
  VisitedPoisV2QuerySchema,
  VisitedPoisV2ResponseSchema,
} from "@vagabond/shared-utils";

import { asMobileRequest } from "../../types/mobile-request.js";

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
      const { user } = asMobileRequest(request);
      const callerId = user.uid;
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
          404: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { poiId } = request.params;
      const { after, limit } = request.query;

      const poiIsActive =
        await fastify.dbRepositories.poi.existsActiveById(poiId);

      if (!poiIsActive) {
        return await reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "POI not found or disabled",
        });
      }

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
