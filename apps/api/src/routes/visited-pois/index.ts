import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { getUserDisplayName, jsonSchemas } from "@vagabond/shared-utils";

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
      const response = reply.status(200).send();

      // Envoyer notification Slack en arrière-plan (sans await)
      void (async (): Promise<void> => {
        try {
          const poiName = await fastify.dbRepositories.poi.findPoiName(poiId);

          if (poiName !== undefined) {
            const displayName = poiName.length > 0 ? poiName : "Lieu inconnu";
            const username = getUserDisplayName(
              request.user.db.fullName,
              request.user.email,
            );

            const imageUrl = `${fastify.config.cdnUrl}/${imageKey}`;

            await fastify.slack.sendPoiValidationMessage(
              `🏆 *Nouveau lieu validé !*\n` +
                `👤 *Utilisateur:* ${username} (${request.user.email})\n` +
                `📍 *Lieu:* ${displayName}\n` +
                `⭐ *Note:* ${rating}/5\n` +
                `💬 *Commentaire:* ${
                  comment.length > 0 ? comment : "Aucun commentaire"
                }\n` +
                `📅 *Date:* ${new Date().toLocaleString("fr-FR")}\n` +
                `🖼️ *Image:* ${imageUrl}`,
            );

            fastify.log.info(
              `Place validated: ${displayName} by ${username} (${request.user.uid})`,
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
