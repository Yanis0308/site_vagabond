import { requestContext } from "@fastify/request-context";
import * as Sentry from "@sentry/node";
import fp from "fastify-plugin";
import { createRemoteJWKSet, type JWTPayload, jwtVerify } from "jose";

import { DASHBOARD_API_PREFIX } from "../routes/dashboard/path.js";
import {
  asDashboardBaseRequest,
  asDashboardOrgRequest,
} from "../types/dashboard-request.js";

// Capture `:orgSlug` dans `/api/dashboard/orgs/:orgSlug/...`. Ne match pas
// `/api/dashboard/me/...` ni `/api/dashboard/orgs` (sans slug derrière).
const ORG_PATH_RE = /^\/api\/dashboard\/orgs\/([^/?]+)(?:[/?]|$)/;

export default fp(
  (fastify) => {
    // JWKS Supabase, instancié une fois à l'init (cache HTTP géré en interne
    // par jose ; rotation des clés transparente).
    const jwks = createRemoteJWKSet(new URL(fastify.config.supabase.jwksUrl));
    const issuer = `${fastify.config.supabase.url}/auth/v1`;

    fastify.addHook("onRequest", async (request) => {
      // Skip si la requête n'est pas Dashboard (laissé à `auth.ts` Firebase).
      if (!request.url.startsWith(`${DASHBOARD_API_PREFIX}/`)) {
        return;
      }

      // 1) Extraction du Bearer.
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw fastify.httpErrors.unauthorized("Token manquant ou invalide");
      }
      const token = authHeader.slice("Bearer ".length);

      // 2) Vérification JWT contre le JWKS Supabase.
      let payload: JWTPayload;
      try {
        const verified = await jwtVerify(token, jwks, {
          issuer,
          audience: "authenticated",
        });
        payload = verified.payload;
      } catch (error) {
        request.log.warn({ err: error }, "Supabase JWT verification failed");
        throw fastify.httpErrors.unauthorized("Non autorisé");
      }

      const supabaseUserId = payload.sub;
      const email = typeof payload.email === "string" ? payload.email : "";
      if (supabaseUserId === undefined || email === "") {
        throw fastify.httpErrors.unauthorized("Token sans sub ou email");
      }

      // 3) Upsert de la projection locale `dashboard_users`.
      const { user: dbUser } =
        await fastify.dbRepositories.dashboardUser.upsertDashboardUser(
          supabaseUserId,
          { email },
        );

      // Enrich logger + Sentry avec l'identité Dashboard.
      request.log = request.log.child({
        dashboard_user_id: supabaseUserId,
        dashboard_user_email: email,
      });
      requestContext.set("log", request.log);
      Sentry.setUser({
        id: supabaseUserId,
        email,
        ip_address: request.clientIpAddress,
      });

      // Cast par intersection (cf. ADR 0009, Option 1) : préserve les types
      // existants du `request` Fastify et ajoute uniquement les champs tenant.
      asDashboardBaseRequest(request).dashboardUser = {
        id: supabaseUserId,
        email,
        db: dbUser,
      };

      // 4) Si la route est org-scopée (`/orgs/:orgSlug/...`), charger l'org
      //    context + valider le membership. 404 si non-trouvé (privacy by
      //    default, on ne révèle pas l'existence d'une org à un user non
      //    autorisé — cf. ADR 0009).
      const match = ORG_PATH_RE.exec(request.url);
      if (match === null) {
        return;
      }
      const rawSlug = match[1];
      if (rawSlug === undefined || rawSlug.length === 0) {
        throw fastify.httpErrors.notFound();
      }
      const orgSlug = decodeURIComponent(rawSlug);

      const orgCtx =
        await fastify.dbRepositories.organization.loadContextForUser({
          slug: orgSlug,
          userId: supabaseUserId,
        });

      if (orgCtx === null) {
        throw fastify.httpErrors.notFound();
      }

      request.log = request.log.child({
        dashboard_org_slug: orgCtx.slug,
        dashboard_org_id: orgCtx.id,
      });
      requestContext.set("log", request.log);

      asDashboardOrgRequest(request).dashboardOrg = orgCtx;
    });
  },
  {
    name: "auth-dashboard",
    dependencies: [
      "sensible",
      "custom-config",
      "fastify-drizzle",
      "request-context",
      "request-logging",
    ],
  },
);
