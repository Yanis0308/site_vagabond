import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  DashboardStatsQuerySchema,
  GetDashboardStatsResponseSchema,
} from "@vagabond/shared-utils";

import { asDashboardOrgRequest } from "../../../types/dashboard-request.js";
import { requireFeature } from "../../../utils/dashboard-feature-gate.js";

// Fenêtre par défaut si `from`/`to` ne sont pas fournis : 30 jours glissants.
const DEFAULT_WINDOW_DAYS = 30;

function parseWindow(query: { from?: string; to?: string }): {
  from: Date;
  to: Date;
} {
  const to = query.to !== undefined ? new Date(query.to) : new Date();
  const from =
    query.from !== undefined
      ? new Date(query.from)
      : new Date(to.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return { from, to };
}

// Agrège les counters + timeseries de l'org active (cf. ADR 0008). Le scope
// (`global` pour staff, `boundaries` pour client B2B) est porté par
// `req.dashboardOrg.scope` et appliqué au niveau SQL par le `StatsRepository`.
const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/stats",
    {
      schema: {
        tags: ["dashboard"],
        querystring: DashboardStatsQuerySchema,
        security: [{ bearerAuth: [] }],
        response: { 200: GetDashboardStatsResponseSchema },
      },
      preHandler: requireFeature("stats"),
    },
    async (req, reply) => {
      const { dashboardOrg } = asDashboardOrgRequest(req);
      const { from, to } = parseWindow(req.query);

      const data = await fastify.dbRepositories.stats.getDashboardStats({
        scope: dashboardOrg.scope,
        from,
        to,
      });

      return await reply.status(200).send({ data });
    },
  );
};

export default routes;
