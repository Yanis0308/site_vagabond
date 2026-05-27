import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  DashboardUsersQuerySchema,
  GetDashboardUsersResponseSchema,
} from "@vagabond/shared-utils";

import { asDashboardOrgRequest } from "../../../types/dashboard-request.js";
import { requireFeature } from "../../../utils/dashboard-feature-gate.js";

// `GET /api/dashboard/orgs/:orgSlug/users` — listing paginé cursor des mobile
// users. Pour une org `BOUNDARIES`, seuls les users ayant visité un POI dans
// l'une des boundaries de l'org apparaissent (cf. ADR 0008).
const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/users",
    {
      schema: {
        tags: ["dashboard"],
        querystring: DashboardUsersQuerySchema,
        security: [{ bearerAuth: [] }],
        response: { 200: GetDashboardUsersResponseSchema },
      },
      preHandler: requireFeature("users"),
    },
    async (req, reply) => {
      const { dashboardOrg } = asDashboardOrgRequest(req);
      const { after, limit, search } = req.query;

      const data = await fastify.dbRepositories.dashboardListings.listUsers({
        scope: dashboardOrg.scope,
        after,
        limit,
        search,
      });

      return await reply.status(200).send({ data });
    },
  );
};

export default routes;
