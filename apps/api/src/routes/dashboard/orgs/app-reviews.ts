import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  DashboardAppReviewsQuerySchema,
  GetDashboardAppReviewsResponseSchema,
} from "@vagabond/shared-utils";

import { requireFeature } from "../../../utils/dashboard-feature-gate.js";

// `GET /api/dashboard/orgs/:orgSlug/app-reviews` — vue paginée des app reviews.
// Cross-org côté DB ; feature gate `app-reviews` côté autorisation (cf. ADR 0009).
const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/app-reviews",
    {
      schema: {
        tags: ["dashboard"],
        querystring: DashboardAppReviewsQuerySchema,
        security: [{ bearerAuth: [] }],
        response: { 200: GetDashboardAppReviewsResponseSchema },
      },
      preHandler: requireFeature("app-reviews"),
    },
    async (req, reply) => {
      const { after, limit, positive } = req.query;

      const data =
        await fastify.dbRepositories.dashboardAppReview.listPaginated({
          after,
          limit,
          positive,
        });

      return await reply.status(200).send({ data });
    },
  );
};

export default routes;
