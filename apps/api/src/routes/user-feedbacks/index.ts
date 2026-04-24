import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  CreateUserFeedbackRequestSchema,
  EmptyResponseSchema,
  ErrorResponseSchema,
  getUserDisplayName,
} from "@vagabond/shared-utils";

import { captureAndLog } from "../../utils/logger.js";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["user-feedbacks"],
        security: [{ bearerAuth: [] }],
        body: CreateUserFeedbackRequestSchema,
        response: {
          200: EmptyResponseSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      await fastify.dbRepositories.userFeedback.create({
        ...request.body,
        userId: request.user.uid,
      });

      const { targetPoiId, ...body } = request.body;

      const response = reply.status(200).send({ data: {} });

      void (async (): Promise<void> => {
        try {
          const poiInfo =
            targetPoiId !== undefined
              ? await fastify.dbRepositories.poi.findByIdWithNameAndCoords(
                  targetPoiId,
                )
              : null;

          const targetPoiLocationParts =
            poiInfo === null
              ? []
              : [
                  poiInfo.cityName,
                  poiInfo.countyName,
                  poiInfo.regionName,
                ].filter(
                  (value): value is string =>
                    value !== null && value.length > 0,
                );

          await fastify.slack.sendUserFeedbackMessage({
            category: body.category,
            userDisplayName:
              request.user.db.nickname ??
              getUserDisplayName(request.user.db.fullName, request.user.email),
            userFullName: request.user.db.fullName,
            userEmail: request.user.email ?? "Email inconnu",
            targetPoiName: poiInfo?.name ?? "—",
            targetPoiId: targetPoiId ?? "—",
            targetPoiLocation:
              targetPoiLocationParts.length > 0
                ? targetPoiLocationParts.join(", ")
                : "—",
            city: body.city ?? "—",
            latitude: body.location?.latitude ?? null,
            longitude: body.location?.longitude ?? null,
            os: body.os,
            appVersion: body.appVersion,
            message: body.message,
            payload: body.payload as Record<string, unknown>,
            createdAt: new Date(),
          });
        } catch (error) {
          captureAndLog(
            fastify,
            error,
            "Failed to send user feedback Slack notification",
            {
              level: "warning",
              tags: { operation: "slack-user-feedback" },
            },
          );
        }
      })();

      return await response;
    },
  );
};

export default routes;
