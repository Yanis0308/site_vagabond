import { type DashboardFeature, orgHasFeature } from "@vagabond/shared-utils";
import { type FastifyRequest, type preHandlerHookHandler } from "fastify";

import { asDashboardOrgRequest } from "../types/dashboard-request.js";

// Garde feature posée en `preHandler` d'une route org-scopée Dashboard. Le
// plugin `auth-dashboard` a déjà rempli `request.dashboardOrg` pour les routes
// sous `/api/dashboard/orgs/:orgSlug/*` ; ici on lit la feature et on applique
// le bypass staff via `orgHasFeature` (`businessType='staff'` → toutes les
// features). 403 si non autorisé.
//
// Pourquoi un wrapper par route plutôt qu'un mapping centralisé URL → feature ?
// Trois raisons :
//  - colocation : on lit la feature requise à côté du handler qui en dépend ;
//  - typing : le slug est borné par `DashboardFeatureSchema` (impossible de
//    requérir une feature inexistante sans erreur TS) ;
//  - pas de drift : ajouter une route = ajouter son `preHandler`, le code
//    review et la garde côté API restent localisés.
export function requireFeature(
  feature: DashboardFeature,
): preHandlerHookHandler {
  // `preHandlerHookHandler` attend une signature synchrone qui peut retourner
  // un FastifyReply ; on émet un throw via `httpErrors.forbidden` côté ko.
  return function (request: FastifyRequest, _reply, done): void {
    const { dashboardOrg } = asDashboardOrgRequest(request);
    if (!orgHasFeature(dashboardOrg, feature)) {
      done(
        request.server.httpErrors.forbidden(
          `Feature '${feature}' not enabled for this organization`,
        ),
      );
      return;
    }
    done();
  };
}
