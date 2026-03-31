import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  CreateVisitedPoiRequestSchema,
  EmptyResponseSchema,
  ErrorResponseSchema,
  GetVisitedPoisResponseSchema,
} from "@vagabond/shared-utils";

import { captureAndLog } from "../../utils/logger.js";

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
      const visitedPois = await fastify.dbRepositories.visitedPoi.findByUserId(
        request.user.uid,
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
        },
      },
    },
    async function (request, reply) {
      const { poiId } = request.params;

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
      const { id } = request.params;

      const deletedVisitedPois =
        await fastify.dbRepositories.visitedPoi.deleteByIdAndUser(
          id,
          request.user.uid,
        );

      if (deletedVisitedPois.length === 0) {
        return await reply.status(404).send({
          error: {
            type: "NOT_FOUND",
            message: "Visited POI not found",
          },
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
          200: EmptyResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { poiId } = request.params;
      const { imageKey, imageSource, rating, comment, coords } = request.body;

      const visitedPoi =
        await fastify.dbRepositories.visitedPoi.findByPoiAndUser(
          poiId,
          request.user.uid,
        );

      if (visitedPoi !== undefined) {
        return await reply.status(409).send({
          error: {
            type: "RESOURCE_ALREADY_EXISTS",
            message: "Visited POI already exists for this user",
          },
        });
      }

      await fastify.dbRepositories.visitedPoi.createCustom({
        poiId,
        imageKey,
        imageSource,
        rating,
        comment,
        coords,
        userId: request.user.uid,
      });

      // Envoyer la réponse HTTP immédiatement
      const response = reply.status(200).send({ data: {} });

      // Envoyer notification Slack en arrière-plan (sans await)
      void (async (): Promise<void> => {
        try {
          const poiInfo =
            await fastify.dbRepositories.poi.findByIdWithNameAndCoords(poiId);

          if (poiInfo !== null) {
            const displayName =
              poiInfo.name.length > 0 ? poiInfo.name : "Lieu inconnu";
            const nicknameDisplay = request.user.db.nickname;
            const locationParts = [
              poiInfo.cityName,
              poiInfo.countyName,
              poiInfo.regionName,
            ].filter((x): x is string => x !== null && x.length > 0);
            const displayLocation =
              locationParts.length > 0 ? locationParts.join(", ") : "—";

            const imageUrl = `${fastify.config.cdnUrl}/${imageKey}`;

            await fastify.slack.sendPoiValidationMessage(
              `🏆 *Nouveau lieu validé !*\n` +
                `👤 *Utilisateur:* ${nicknameDisplay} (${request.user.db.fullName} - ${request.user.email})\n` +
                `📍 *Lieu:* ${displayName}\n` +
                `🏙️ *Localisation:* ${displayLocation}\n` +
                `⭐ *Note:* ${rating}/5\n` +
                `💬 *Commentaire:* ${
                  comment.length > 0 ? comment : "Aucun commentaire"
                }\n` +
                `📅 *Date:* ${new Date().toLocaleString("fr-FR")}\n` +
                `🖼️ *Image:* ${imageUrl}`,
            );

            request.log.info(
              `Place validated: ${displayName} by ${request.user.db.fullName} (${request.user.uid})`,
            );
          }
        } catch (error) {
          captureAndLog(
            fastify,
            error,
            "Failed to send Slack notification for place validation",
            {
              level: "warning",
              tags: { operation: "slack-poi-validation" },
            },
          );
        }
      })();

      return await response;
    },
  );
};

export default routes;
