import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  EmptyResponseSchema,
  ErrorResponseSchema,
  UpdateUserMeRequestSchema,
  UserPublicInfoResponseSchema,
  UsersMeResponseSchema,
} from "@vagabond/shared-utils";

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

      return await reply.status(200).send({
        data: {
          ...user,
          id: user.userId,
          lastLogin: user.lastLogin.toISOString(),
          createdAt: user.createdAt.toISOString(),
          oauthProviders: user.oauthProviders ?? [],
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
};

export default routes;
