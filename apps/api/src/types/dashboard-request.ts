import {
  type DashboardOrgContext as RepoDashboardOrgContext,
  type DbDashboardUser,
} from "@vagabond/database-client";
import { type FastifyRequest } from "fastify";

// Identité Dashboard, remplie par `plugins/auth-dashboard.ts` après vérification
// du JWT Supabase et upsert de la projection locale `dashboard_users`.
export interface DashboardUser {
  id: string;
  email: string;
  db: DbDashboardUser;
}

type DashboardBaseRequest = FastifyRequest & {
  dashboardUser: DashboardUser;
};

// Réexpose le type repo pour usage côté contrôleurs Dashboard.
type DashboardOrgRequest = DashboardBaseRequest & {
  dashboardOrg: RepoDashboardOrgContext;
};

// Helpers de cast par **intersection** (cf. ADR 0009). Préservent intégralement
// l'inférence TypeBox du `req` (body, querystring, params, headers) et n'ajoutent
// QUE les champs garantis par le middleware `auth-dashboard.ts`. Ne touchent pas
// à `reply`, qui reste typé par le response schema TypeBox.
//
// Sécurité : ces helpers ne font QUE du cast typé. La vérification réelle
// (JWT Supabase + membership) est portée par `auth-dashboard.ts` posé sur le
// préfixe d'URL — défense en profondeur impossible à oublier (cf. ADR 0009).
//
// L'import de ces helpers est restreint par ESLint (`no-restricted-imports`)
// aux routes Dashboard et au plugin `auth-dashboard.ts` ; ailleurs c'est une
// erreur de lint.

export function asDashboardBaseRequest<R extends FastifyRequest>(
  req: R,
): R & DashboardBaseRequest {
  return req as R & DashboardBaseRequest;
}

export function asDashboardOrgRequest<R extends FastifyRequest>(
  req: R,
): R & DashboardOrgRequest {
  return req as R & DashboardOrgRequest;
}
