import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { jsonSchemas } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["search"],
        security: [{ bearerAuth: [] }],
        querystring: Type.Ref(jsonSchemas.SearchQuerySchema),
        response: {
          200: Type.Ref(jsonSchemas.SearchResponseSchema),
        },
      },
    },
    async function (request, reply) {
      const { q } = request.query;

      const results =
        await fastify.dbRepositories.search.searchPoisAndCities(q);

      return await reply.status(200).send({ data: results });
    },
  );
};

export default routes;
