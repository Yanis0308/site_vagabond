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
import { getAuth } from "firebase-admin/auth";

import { asMobileRequest } from "../../types/mobile-request.js";
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
      const { user } = asMobileRequest(request);
      const dbUser = user.db;
      const hasAppReview = await fastify.dbRepositories.user.hasUserAppReview(
        dbUser.userId,
      );

      return await reply.status(200).send({
        data: {
          ...dbUser,
          id: dbUser.userId,
          lastLogin: dbUser.lastLogin.toISOString(),
          createdAt: dbUser.createdAt.toISOString(),
          oauthProviders: dbUser.oauthProviders ?? [],
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
      const { user } = asMobileRequest(request);
      const dbUser = user.db;
      const { nickname, isPrivate } = request.body;

      const updateData: Parameters<
        (typeof fastify.dbRepositories.user)["updateUser"]
      >[1] = {};
      if (nickname !== undefined) updateData.nickname = nickname;
      if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

      await fastify.dbRepositories.user.updateUser(dbUser.userId, updateData);

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
          statusCode: 404,
          error: "Not Found",
          message: "User not found",
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
      const { user } = asMobileRequest(request);
      const { userId } = user.db;
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
            statusCode: 409,
            error: "Conflict",
            message: "A review already exists",
          });
        }
        throw error;
      }

      if (!positive) {
        void (async (): Promise<void> => {
          try {
            const safeFullName = escapeHtml(user.db.fullName);
            const safeEmail = escapeHtml(user.email);
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
  fastify.delete(
    "/me",
    {
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: EmptyResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { user } = asMobileRequest(request);
      const { userId } = user.db;

      await fastify.dbRepositories.user.deleteUser(userId);

      try {
        await getAuth(fastify.firebase).deleteUser(userId);
      } catch (error) {
        captureAndLog(
          fastify,
          error,
          "Failed to delete Firebase user after DB deletion succeeded",
          {
            level: "error",
            tags: { operation: "firebase-delete-user", userId },
          },
        );
      }

      return await reply.status(200).send({ data: {} });
    },
  );
};

export default routes;
