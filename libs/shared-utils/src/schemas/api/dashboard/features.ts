import { type Static, Type } from "typebox";

// Catalogue exhaustif des features Dashboard (cf. ADR 0009). L'ajout d'une
// feature requiert :
//   - une entrée ici (enum strict),
//   - une entrée dans `apps/dashboard/app/(dashboard)/_lib/dashboard-pages.ts`
//     (source unique pour la sidebar + le FeatureGate côté front),
//   - un `preHandler: requireFeature("…")` sur la route Fastify correspondante.
//
// Les orgs `business_type='staff'` bypassent la gate (`orgHasFeature` ci-dessous)
// — elles ont implicitement TOUTES les features sans qu'on ait à les lister.
export const DashboardFeatureSchema = Type.Union(
  [
    Type.Literal("stats"),
    Type.Literal("pois"),
    Type.Literal("users"),
    Type.Literal("feedbacks"),
    Type.Literal("app-reviews"),
  ],
  { $id: "DashboardFeature" },
);

export type DashboardFeature = Static<typeof DashboardFeatureSchema>;

export const ALL_DASHBOARD_FEATURES: readonly DashboardFeature[] = [
  "stats",
  "pois",
  "users",
  "feedbacks",
  "app-reviews",
] as const;

// Filter silencieux pour les slugs persistés en DB (cf. ADR 0009) : si la
// colonne `features` contient un slug hors enum (feature renommée/supprimée
// sans nettoyage), on l'ignore côté lecture plutôt que de throw.
export function filterValidDashboardFeatures(
  raw: readonly string[],
): DashboardFeature[] {
  return raw.filter((s): s is DashboardFeature =>
    ALL_DASHBOARD_FEATURES.includes(s as DashboardFeature),
  );
}

interface OrgLike {
  businessType: "staff" | "tourist_office";
  features: readonly DashboardFeature[];
}

// Bypass staff : une org `business_type='staff'` a TOUTES les features par
// défaut, indépendamment du contenu de `features`. Pour les autres, on lit
// la colonne stricto sensu.
export function orgHasFeature(
  org: OrgLike,
  feature: DashboardFeature,
): boolean {
  if (org.businessType === "staff") return true;
  return org.features.includes(feature);
}
