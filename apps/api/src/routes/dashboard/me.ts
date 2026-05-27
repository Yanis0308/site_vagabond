import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  type DashboardMe,
  GetDashboardMeResponseSchema,
} from "@vagabond/shared-utils";

import { asDashboardBaseRequest } from "../../types/dashboard-request.js";

// `GET /api/dashboard/me` — identité + liste des organisations accessibles
// avec leur scope pré-calculé (cf. ADR 0009). Pas d'org-scoping ici, c'est
// le point d'entrée hors-org qui alimente le picker côté front.
const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["dashboard"],
        security: [{ bearerAuth: [] }],
        response: { 200: GetDashboardMeResponseSchema },
      },
    },
    async (req, reply) => {
      const { dashboardUser } = asDashboardBaseRequest(req);

      const organizations =
        await fastify.dbRepositories.organization.listForUser(dashboardUser.id);

      const data: DashboardMe = {
        user: {
          id: dashboardUser.id,
          email: dashboardUser.email,
          name: dashboardUser.db.name,
        },
        organizations: organizations.map((o) => ({
          id: o.id,
          slug: o.slug,
          name: o.name,
          businessType: o.businessType,
          scopeMode: o.scopeMode,
          scope: o.scope,
          features: [],
        })),
      };

      return await reply.status(200).send({ data });
    },
  );
};

export default routes;
