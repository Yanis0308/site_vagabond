import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  ErrorResponseSchema,
  NOTIFICATION_TEMPLATES,
  StaffToolsCompleteZoneRequestSchema,
  StaffToolsCompleteZoneResponseSchema,
  StaffToolsTestNotificationRequestSchema,
  StaffToolsTestNotificationResponseSchema,
  StaffToolsValidatePlaceResponseSchema,
} from "@vagabond/shared-utils";

import { sendNotification } from "../../services/notification-sender.service.js";
import {
  completeZone,
  randomImageKey,
} from "../../services/staff-tools-zone-completion.service.js";
import { asMobileRequest } from "../../types/mobile-request.js";

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
      const { user } = asMobileRequest(request);
      const { poiId } = request.params;
      const userId = user.uid;

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
      const { user } = asMobileRequest(request);
      const { poiId, boundaryLevel, percentage } = request.body;

      try {
        const result = await completeZone(
          poiId,
          boundaryLevel,
          percentage,
          user.uid,
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

  // Bypasse l'orchestrateur (caps, cooldowns, quiet hours, …) pour permettre
  // au staff de tester un template à la demande. Le hook `onRequest` de
  // `plugins/auth.ts` gate déjà ce prefix sur ADMIN + dev-server. L'admin
  // choisit la cible via `userId` dans le body.
  fastify.post(
    "/notifications/test",
    {
      schema: {
        tags: ["staff-tools"],
        security: [{ bearerAuth: [] }],
        body: StaffToolsTestNotificationRequestSchema,
        response: {
          200: StaffToolsTestNotificationResponseSchema,
          400: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { userId, templateKey, variables, triggerCoords, variantIndex } =
        request.body;
      const template = NOTIFICATION_TEMPLATES[templateKey];

      const resolvedVariantIndex =
        variantIndex ??
        (await fastify.dbRepositories.notificationEvent.countSentForTemplate(
          userId,
          templateKey,
        ));

      const outcome = await sendNotification(fastify, {
        userId,
        variantIndex: resolvedVariantIndex,
        candidate: {
          template,
          variables: variables ?? {},
          triggerCoords: triggerCoords ?? null,
        },
      });

      return await reply.status(200).send({
        data: {
          outcome: outcome.status,
          variantIndex: resolvedVariantIndex,
          ...(outcome.status === "sent"
            ? {
                notificationId: outcome.notificationId,
                deliveredTo: outcome.deliveredTo,
              }
            : {}),
          ...(outcome.status === "failed"
            ? {
                notificationId: outcome.notificationId,
                reason: outcome.reason,
              }
            : {}),
          ...(outcome.status === "skipped" ? { reason: outcome.reason } : {}),
        },
      });
    },
  );
};

export default routes;
