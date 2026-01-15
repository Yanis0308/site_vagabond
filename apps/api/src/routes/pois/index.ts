import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import { jsonSchemas } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["pois"],
        security: [{ bearerAuth: [] }],
        querystring: jsonSchemas.BoundingBoxSchema,
        response: {
          200: jsonSchemas.GetPoisResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const poisWithData =
        await fastify.dbRepositories.poi.findInBoundingBoxWithData(
          request.query,
        );

      return await reply.status(200).send({ data: poisWithData });
    },
  );
};

export default routes;
