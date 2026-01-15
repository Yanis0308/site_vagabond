import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import { jsonSchemas } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/me",
    {
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: jsonSchemas.UsersMeResponseSchema,
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
};

export default routes;
