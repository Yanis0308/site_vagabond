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

      // Envoyer la réponse HTTP immédiatement
      const response = reply.status(200).send();

      // Envoyer notification Slack en arrière-plan (sans await)
      void (async (): Promise<void> => {
        try {
          const poiData = await fastify.prisma.poiData.findFirst({
            where: { poiId },
            select: { name: true },
          });

          if (poiData !== null) {
            const poiName =
              poiData.name.length > 0 ? poiData.name : "Lieu inconnu";
            const username = request.user.email?.includes("@")
              ? (request.user.email.split("@")[0] ?? "Utilisateur inconnu")
              : "Utilisateur inconnu";

            const imageUrl = `${fastify.config.cdnUrl}/${imageKey}`;

            await fastify.slack.sendMessage(
              `🏆 *Nouveau lieu validé !*\n` +
                `👤 *Utilisateur:* ${username} (${request.user.email})\n` +
                `📍 *Lieu:* ${poiName}\n` +
                `⭐ *Note:* ${rating}/5\n` +
                `💬 *Commentaire:* ${
                  comment.length > 0 ? comment : "Aucun commentaire"
                }\n` +
                `📅 *Date:* ${new Date().toLocaleString("fr-FR")}\n` +
                `🖼️ *Image:* ${imageUrl}`,
            );

            fastify.log.info(
              `Place validated: ${poiName} by ${username} (${request.user.uid})`,
            );
          }
        } catch (error) {
          fastify.log.error(
            "Failed to send Slack notification for place validation:",
            error,
          );
        }
      })();

      return await response;
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
          rating: true,
          comment: true,
          imageKey: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      return await reply.status(200).send({
        data: visitedPois.map((visitedPoi) => {
          const { user, ...visitedPoiWithoutUser } = visitedPoi;
          const username = user.email?.includes("@")
            ? (user.email.split("@")[0] ?? "John Doe")
            : "John Doe";

          return {
            ...visitedPoiWithoutUser,
            username,
            createdAt: visitedPoi.createdAt.toISOString(),
          };
        }),
      });
    },
  );
};

export default routes;
