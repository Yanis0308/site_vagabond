import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  DashboardPoisQuerySchema,
  GetDashboardPoisResponseSchema,
} from "@vagabond/shared-utils";

import { asDashboardOrgRequest } from "../../../types/dashboard-request.js";
import { requireFeature } from "../../../utils/dashboard-feature-gate.js";

// `GET /api/dashboard/orgs/:orgSlug/pois` — listing paginé cursor. Le scope
// (`global` / `boundaries`) est porté par `req.dashboardOrg.scope` et appliqué
// par `DashboardListingsRepository` (cf. ADR 0008).
const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/pois",
    {
      schema: {
        tags: ["dashboard"],
        querystring: DashboardPoisQuerySchema,
        security: [{ bearerAuth: [] }],
        response: { 200: GetDashboardPoisResponseSchema },
      },
      preHandler: requireFeature("pois"),
    },
    async (req, reply) => {
      const { dashboardOrg } = asDashboardOrgRequest(req);
      const { after, limit, search, filterLevel, disabled } = req.query;

      const data = await fastify.dbRepositories.dashboardListings.listPois({
        scope: dashboardOrg.scope,
        after,
        limit,
        search,
        filterLevel,
        disabled,
      });

      return await reply.status(200).send({ data });
    },
  );
};

export default routes;
