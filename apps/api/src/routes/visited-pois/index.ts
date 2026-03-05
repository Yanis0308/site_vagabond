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
      const { imageKey, rating, comment, coords } = request.body;

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
          const poiName = await fastify.dbRepositories.poi.findPoiName(poiId);

          if (poiName !== undefined) {
            const displayName = poiName.length > 0 ? poiName : "Lieu inconnu";

            const imageUrl = `${fastify.config.cdnUrl}/${imageKey}`;

            await fastify.slack.sendPoiValidationMessage(
              `🏆 *Nouveau lieu validé !*\n` +
                `👤 *Utilisateur:* ${request.user.db.fullName} (${request.user.email})\n` +
                `📍 *Lieu:* ${displayName}\n` +
                `⭐ *Note:* ${rating}/5\n` +
                `💬 *Commentaire:* ${
                  comment.length > 0 ? comment : "Aucun commentaire"
                }\n` +
                `📅 *Date:* ${new Date().toLocaleString("fr-FR")}\n` +
                `🖼️ *Image:* ${imageUrl}`,
            );

            fastify.log.info(
              `Place validated: ${displayName} by ${request.user.db.fullName} (${request.user.uid})`,
            );
          }
        } catch (error) {
          fastify.log.error(
            { err: error },
            "Failed to send Slack notification for place validation:",
          );
        }
      })();

      return await response;
    },
  );
};

export default routes;
