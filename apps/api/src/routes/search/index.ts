import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  SearchQuerySchema,
  SearchResponseSchema,
} from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["search"],
        security: [{ bearerAuth: [] }],
        querystring: SearchQuerySchema,
        response: {
          200: SearchResponseSchema,
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
