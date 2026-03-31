import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { AppReviewAlreadyExistsError } from "@vagabond/database-client";
import {
  EmptyResponseSchema,
  ErrorResponseSchema,
  UpdateUserMeRequestSchema,
  UserAppReviewRequestSchema,
  UserPublicInfoResponseSchema,
  UsersMeResponseSchema,
} from "@vagabond/shared-utils";
import escapeHtml from "escape-html";

import { captureAndLog } from "../../utils/logger.js";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/me",
    {
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: UsersMeResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const user = request.user.db;
      const hasAppReview = await fastify.dbRepositories.user.hasUserAppReview(
        user.userId,
      );

      return await reply.status(200).send({
        data: {
          ...user,
          id: user.userId,
          lastLogin: user.lastLogin.toISOString(),
          createdAt: user.createdAt.toISOString(),
          oauthProviders: user.oauthProviders ?? [],
          hasAppReview,
        },
      });
    },
  );
  fastify.patch(
    "/me",
    {
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        body: UpdateUserMeRequestSchema,
        response: {
          200: EmptyResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const user = request.user.db;
      const { nickname } = request.body;

      await fastify.dbRepositories.user.updateUserNickname(
        user.userId,
        nickname,
      );

      return await reply.status(200).send({ data: {} });
    },
  );
  fastify.get(
    "/:userId",
    {
      schema: {
        tags: ["users"],
        params: Type.Object({
          userId: Type.String(),
        }),
        security: [{ bearerAuth: [] }],
        response: {
          200: UserPublicInfoResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { userId } = request.params;
      const user = await fastify.dbRepositories.user.getPublicUserInfo(userId);

      if (user === null) {
        return await reply.status(404).send({
          error: {
            type: "NOT_FOUND",
            message: "User not found",
          },
        });
      }

      return await reply.status(200).send({
        data: {
          ...user,
          createdAt: user.createdAt.toISOString(),
        },
      });
    },
  );
  fastify.post(
    "/me/app-review",
    {
      schema: {
        tags: ["users"],
        body: UserAppReviewRequestSchema,
        security: [{ bearerAuth: [] }],
        response: {
          200: EmptyResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { userId } = request.user.db;
      const { positive, comment } = request.body;

      try {
        await fastify.dbRepositories.user.createAppReview(
          userId,
          positive,
          comment ?? null,
        );
      } catch (error) {
        if (error instanceof AppReviewAlreadyExistsError) {
          return await reply.status(409).send({
            error: {
              type: "RESOURCE_ALREADY_EXISTS",
              message: "A review already exists",
            },
          });
        }
        throw error;
      }

      if (!positive) {
        void (async (): Promise<void> => {
          try {
            const safeFullName = escapeHtml(request.user.db.fullName);
            const safeEmail = escapeHtml(request.user.email);
            const safeComment = escapeHtml(comment);

            await fastify.slack.sendAppReviewMessage(
              `👎 *Avis négatif reçu !*\n` +
                `👤 *Utilisateur:* ${safeFullName} (${safeEmail})\n` +
                `💬 *Commentaire :* ${safeComment}\n` +
                `📅 *Date:* ${new Date().toLocaleString("fr-FR")}`,
            );
          } catch (slackError) {
            captureAndLog(
              fastify,
              slackError,
              "Failed to send app review Slack message",
              {
                level: "warning",
                tags: { operation: "slack-app-review" },
              },
            );
          }
        })();
      }

      return await reply.status(200).send({ data: {} });
    },
  );
};

export default routes;
