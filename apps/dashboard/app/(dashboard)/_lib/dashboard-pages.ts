import {
  Home01Icon,
  MapsLocation01Icon,
  MessageQuestionIcon,
  StarIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { type DashboardFeature } from "@vagabond/shared-utils";

// `IconSvgObject` n'est pas réexporté par `@hugeicons/core-free-icons` ; on
// dérive le type depuis une icône concrète pour rester typé sans redéclarer.
type HugeIcon = typeof Home01Icon;

export interface DashboardPage {
  feature: DashboardFeature;
  // Chemin relatif à `/orgs/[orgSlug]` (vide pour la home `stats`).
  orgPath: "" | `/${string}`;
  label: string;
  icon: HugeIcon;
}

// Source unique : ajouter une page Dashboard = ajouter UNE entrée ici. Sont
// dérivés automatiquement :
//   - la sidebar (composants/app-sidebar.tsx, filtré par feature),
//   - le FeatureGate dans le layout root (resolveRequiredFeature ci-dessous).
// Si tu oublies d'ajouter une entrée pour une nouvelle page, elle n'apparaîtra
// pas dans la sidebar et le FeatureGate la laissera passer (default allow) —
// mais l'API garde la sécurité via `requireFeature` côté preHandler.
export const DASHBOARD_PAGES: readonly DashboardPage[] = [
  { feature: "stats", orgPath: "", label: "Aperçu", icon: Home01Icon },
  {
    feature: "pois",
    orgPath: "/pois",
    label: "POIs",
    icon: MapsLocation01Icon,
  },
  {
    feature: "users",
    orgPath: "/users",
    label: "Mobile Users",
    icon: UserMultipleIcon,
  },
  {
    feature: "feedbacks",
    orgPath: "/feedbacks",
    label: "Feedbacks",
    icon: MessageQuestionIcon,
  },
  {
    feature: "app-reviews",
    orgPath: "/app-reviews",
    label: "App Reviews",
    icon: StarIcon,
  },
] as const;

export interface FeatureRequirement {
  feature: DashboardFeature;
  orgSlug: string;
}

const ORG_PATH_REGEX = /^\/orgs\/([^/]+)(\/.*)?$/;

// Match un pathname Next.js vers la feature requise + l'orgSlug capturé.
// Retourne null pour les paths hors `/orgs/[slug]/...` (ex: `/`, `/no-access`,
// `/login`) — ces pages ne sont pas feature-gated.
export function resolveRequiredFeature(
  pathname: string,
): FeatureRequirement | null {
  const orgMatch = ORG_PATH_REGEX.exec(pathname);
  if (orgMatch === null) return null;
  const orgSlug = orgMatch[1];
  if (orgSlug === undefined) return null;
  const rest = orgMatch[2] ?? "";

  const page = DASHBOARD_PAGES.find((p) => {
    if (p.orgPath === "") return rest === "" || rest === "/";
    // Inclut les sous-routes (ex. `/pois/123` matchera la feature `pois`).
    return rest === p.orgPath || rest.startsWith(`${p.orgPath}/`);
  });
  if (page === undefined) return null;
  return { feature: page.feature, orgSlug };
}
