import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  DashboardFeedbacksQuerySchema,
  GetDashboardFeedbacksResponseSchema,
} from "@vagabond/shared-utils";

import { requireFeature } from "../../../utils/dashboard-feature-gate.js";

// `GET /api/dashboard/orgs/:orgSlug/feedbacks` — vue paginée des user feedbacks
// (BUG, PLACE_SUGGESTION, etc.). Le contenu reste cross-org (pas filtré par
// boundary) ; c'est la feature `feedbacks` qui décide de l'accès. En pratique
// elle n'est activée que pour les orgs staff (bypass automatique).
const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/feedbacks",
    {
      schema: {
        tags: ["dashboard"],
        querystring: DashboardFeedbacksQuerySchema,
        security: [{ bearerAuth: [] }],
        response: { 200: GetDashboardFeedbacksResponseSchema },
      },
      preHandler: requireFeature("feedbacks"),
    },
    async (req, reply) => {
      const { after, limit, category } = req.query;

      const data = await fastify.dbRepositories.dashboardFeedback.listPaginated(
        {
          after,
          limit,
          category,
        },
      );

      return await reply.status(200).send({ data });
    },
  );
};

export default routes;
