import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  CheckVisitedPoiImageResponseSchema,
  CreateVisitedPoiRequestSchema,
  CreateVisitedPoiResponseSchema,
  EmptyResponseSchema,
  ErrorResponseSchema,
  GetVisitedPoisResponseSchema,
} from "@vagabond/shared-utils";

import { notifyPoiValidatedOnSlack } from "../../services/poi-validation-slack.service.js";
import { asMobileRequest } from "../../types/mobile-request.js";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["visited-pois"],
        security: [{ bearerAuth: [] }],
        response: {
          200: GetVisitedPoisResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { user } = asMobileRequest(request);
      const visitedPois = await fastify.dbRepositories.visitedPoi.findByUserId(
        user.uid,
      );

      return await reply.status(200).send({ data: visitedPois });
    },
  );

  fastify.get(
    "/:poiId",
    {
      schema: {
        tags: ["visited-pois"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          poiId: Type.String(),
        }),
        response: {
          200: GetVisitedPoisResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { poiId } = request.params;

      const poiIsActive =
        await fastify.dbRepositories.poi.existsActiveById(poiId);

      if (!poiIsActive) {
        return await reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "POI not found or disabled",
        });
      }

      const visitedPois =
        await fastify.dbRepositories.visitedPoi.findByPoiId(poiId);

      return await reply.status(200).send({ data: visitedPois });
    },
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["visited-pois"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.Number(),
        }),
        response: {
          200: EmptyResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { user } = asMobileRequest(request);
      const { id } = request.params;

      const deletedVisitedPois =
        await fastify.dbRepositories.visitedPoi.deleteByIdAndUser(id, user.uid);

      if (deletedVisitedPois.length === 0) {
        return await reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Visited POI not found",
        });
      }

      return await reply.status(200).send({ data: {} });
    },
  );

  fastify.post(
    "/:poiId",
    {
      schema: {
        tags: ["visited-pois"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          poiId: Type.String(),
        }),
        body: CreateVisitedPoiRequestSchema,
        response: {
          200: CreateVisitedPoiResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { user } = asMobileRequest(request);
      const { poiId } = request.params;
      const { imageKey, imageSource, rating, comment, coords } = request.body;

      const poiIsActive =
        await fastify.dbRepositories.poi.existsActiveById(poiId);

      if (!poiIsActive) {
        return await reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "POI not found or disabled",
        });
      }

      const visitedPoi =
        await fastify.dbRepositories.visitedPoi.findByPoiAndUser(
          poiId,
          user.uid,
        );

      if (visitedPoi !== undefined) {
        return await reply.status(409).send({
          statusCode: 409,
          error: "Conflict",
          message: "Visited POI already exists for this user",
        });
      }

      const { id: visitedPoiId } =
        await fastify.dbRepositories.visitedPoi.createCustom({
          poiId,
          ...(imageKey !== undefined && { imageKey }),
          imageSource,
          rating,
          comment,
          coords,
          userId: user.uid,
        });

      // Send HTTP response immediately
      const response = reply.status(200).send({ data: { id: visitedPoiId } });

      // Legacy path: client provided imageKey at validation time, so the photo is
      // already uploaded. Notify Slack here. In the post-VG-310 flow imageKey is
      // undefined and the upload endpoint sends the notification once the photo lands.
      if (imageKey !== undefined) {
        void notifyPoiValidatedOnSlack(fastify, {
          visitedPoiId,
          poiId,
          photoUrl: `${fastify.config.cdnUrl}/${imageKey}`,
          userDisplayName: user.db.nickname ?? user.db.fullName,
          userFullName: user.db.fullName,
          userEmail: user.email ?? "—",
          userId: user.uid,
          rating,
          comment,
          createdAt: new Date(),
        });
      }

      return await response;
    },
  );

  fastify.get(
    "/:id/status",
    {
      schema: {
        tags: ["visited-pois"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.Number(),
        }),
        response: {
          200: CheckVisitedPoiImageResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { user } = asMobileRequest(request);
      const { id } = request.params;

      const visitedPoi =
        await fastify.dbRepositories.visitedPoi.findByIdAndUser(id, user.uid);

      if (visitedPoi === undefined) {
        return await reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Visited POI not found",
        });
      }

      return await reply.status(200).send({
        data: { hasImage: visitedPoi.imageKey !== null },
      });
    },
  );
};

export default routes;
