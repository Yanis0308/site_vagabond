import {
  addSchemasPlugin,
  compressPlugin,
  databasePlugin,
  sensiblePlugin,
} from "@vagabond/api-utils";
import { type FastifyPluginAsync } from "fastify";

// Plugins
import authPlugin from "./plugins/auth.js";
import authDashboardPlugin from "./plugins/auth-dashboard.js";
import bodyDecodePlugin from "./plugins/body-decode.js";
import configPlugin from "./plugins/config.js";
import firebasePlugin from "./plugins/firebase.js";
import multipartPlugin from "./plugins/multipart.js";
import pgBossPlugin from "./plugins/pg-boss.js";
import requestContextPlugin from "./plugins/request-context.js";
import requestLoggingPlugin from "./plugins/request-logging.js";
import s3Plugin from "./plugins/s3.js";
import securityPlugin from "./plugins/security.js";
import slackPlugin from "./plugins/slack.js";
import swaggerPlugin from "./plugins/swagger.js";
import underPressurePlugin from "./plugins/under-pressure.js";
// Routes
import dashboardMeRoute from "./routes/dashboard/me.js";
import dashboardOrgAppReviewsRoute from "./routes/dashboard/orgs/app-reviews.js";
import dashboardOrgFeedbacksRoute from "./routes/dashboard/orgs/feedbacks.js";
import dashboardOrgPoisRoute from "./routes/dashboard/orgs/pois.js";
import dashboardOrgStatsRoute from "./routes/dashboard/orgs/stats.js";
import dashboardOrgUsersRoute from "./routes/dashboard/orgs/users.js";
import { DASHBOARD_API_PREFIX } from "./routes/dashboard/path.js";
import healthRoute from "./routes/health/index.js";
import leaderboardRoute from "./routes/leaderboard/index.js";
import leaderboardV2Route from "./routes/leaderboard/v2.js";
import locationRoute from "./routes/location/index.js";
import poisIdRoute from "./routes/pois/[id].js";
import pushDevicesRoute from "./routes/push-devices/index.js";
import searchRoute from "./routes/search/index.js";
import staffToolsRoute from "./routes/staff-tools/index.js";
import { STAFF_TOOLS_API_PREFIX } from "./routes/staff-tools/path.js";
import uploadRoute from "./routes/upload/index.js";
import userFeedbacksRoute from "./routes/user-feedbacks/index.js";
import usersRoute from "./routes/users/index.js";
import visitedPoisRoute from "./routes/visited-pois/index.js";
import visitedPoisV2Route from "./routes/visited-pois/v2.js";
import zonesRoute from "./routes/zones/index.js";
import zonesV2Route from "./routes/zones/v2.js";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- AppOptions is a placeholder for future options
export interface AppOptions {
  // Place your custom options for app below here.
}

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts) => {
  // Register plugins in order
  // 1. Config first (needed by other plugins)
  await fastify.register(configPlugin, opts);

  // 2. Add schemas (needed by routes)
  await fastify.register(addSchemasPlugin, opts);

  // 2b. Body decode (Type.Transform via Value.Decode)
  await fastify.register(bodyDecodePlugin, opts);

  // 3. Security (helmet, cors)
  await fastify.register(securityPlugin, opts);

  // 4. Swagger (documentation)
  await fastify.register(swaggerPlugin, opts);

  // 5. Firebase (for auth)
  await fastify.register(firebasePlugin, opts);

  // 6. Database (repositories)
  await fastify.register(databasePlugin, opts);

  // 6b. Under-pressure (load shedding + cached health check, depends on database)
  await fastify.register(underPressurePlugin, opts);

  // 6c. pg-boss (job queue — dépend de config)
  await fastify.register(pgBossPlugin, opts);

  // 7. Utility plugins
  await fastify.register(compressPlugin, opts);
  await fastify.register(sensiblePlugin, opts);

  // 8. Request context (AsyncLocalStorage for request-scoped logger)
  await fastify.register(requestContextPlugin, opts);

  // 8b. Request logging (enrich logs + Sentry with IP/userAgent before auth)
  await fastify.register(requestLoggingPlugin, opts);

  // 9. Other plugins
  await fastify.register(multipartPlugin, opts);
  await fastify.register(s3Plugin, opts);
  await fastify.register(slackPlugin, opts);

  // 10. Auth Mobile/staff (Firebase, must be after firebase, database, and request-context)
  await fastify.register(authPlugin, opts);

  // 10b. Auth Dashboard (Supabase JWT + tenant context, cf. ADR 0009).
  // L'autorisation fine (feature gate par org) est portée par chaque route via
  // le preHandler `requireFeature` (cf. utils/dashboard-feature-gate.ts).
  await fastify.register(authDashboardPlugin, opts);

  // 11. Routes
  await fastify.register(healthRoute, { prefix: "api" });
  await fastify.register(leaderboardRoute, { prefix: "api/leaderboard" });
  await fastify.register(locationRoute, { prefix: "api/location" });
  await fastify.register(pushDevicesRoute, { prefix: "api/push-devices" });
  await fastify.register(poisIdRoute, { prefix: "api/pois" });
  await fastify.register(searchRoute, { prefix: "api/search" });
  await fastify.register(uploadRoute, { prefix: "api/upload" });
  await fastify.register(userFeedbacksRoute, { prefix: "api/user-feedbacks" });
  await fastify.register(usersRoute, { prefix: "api/users" });
  await fastify.register(visitedPoisRoute, { prefix: "api/visited-pois" });
  await fastify.register(zonesRoute, { prefix: "api/zones" });
  await fastify.register(staffToolsRoute, { prefix: STAFF_TOOLS_API_PREFIX });

  // v2 routes (cf. ADR-0001 : versioning par préfixe URL pour les breaking changes)
  await fastify.register(visitedPoisV2Route, { prefix: "api/v2/visited-pois" });
  await fastify.register(leaderboardV2Route, { prefix: "api/v2/leaderboard" });
  await fastify.register(zonesV2Route, { prefix: "api/v2/zones" });

  // Dashboard — deux espaces (cf. ADR 0009) :
  //   /api/dashboard/me/*            → identité hors-org (picker)
  //   /api/dashboard/orgs/:orgSlug/* → toutes les routes Dashboard, chacune
  //                                    gardée par sa feature (cf. requireFeature)
  await fastify.register(dashboardMeRoute, {
    prefix: `${DASHBOARD_API_PREFIX}/me`,
  });
  const orgPrefix = `${DASHBOARD_API_PREFIX}/orgs/:orgSlug`;
  await fastify.register(dashboardOrgStatsRoute, { prefix: orgPrefix });
  await fastify.register(dashboardOrgPoisRoute, { prefix: orgPrefix });
  await fastify.register(dashboardOrgUsersRoute, { prefix: orgPrefix });
  await fastify.register(dashboardOrgFeedbacksRoute, { prefix: orgPrefix });
  await fastify.register(dashboardOrgAppReviewsRoute, { prefix: orgPrefix });
};

export default app;
export { app, options };
