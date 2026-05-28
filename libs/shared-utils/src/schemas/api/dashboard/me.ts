import { type Static, Type } from "typebox";

import { ApiResponseSchema, Nullable } from "../../utils.js";
import { DashboardFeatureSchema } from "./features.js";

// Discriminated union (cf. ADR 0008, Boundary Scope) :
//  - `global` = visibilité globale (typique `business_type='staff'`).
//  - `boundaries` = visibilité restreinte à la liste de boundaries.
export const BoundaryScopeSchema = Type.Union(
  [
    Type.Object({ kind: Type.Literal("global") }),
    Type.Object({
      kind: Type.Literal("boundaries"),
      boundaryIds: Type.Array(Type.String()),
    }),
  ],
  { $id: "BoundaryScope" },
);

export const DashboardBusinessTypeSchema = Type.Union(
  [Type.Literal("staff"), Type.Literal("tourist_office")],
  { $id: "DashboardBusinessType" },
);

export const DashboardScopeModeSchema = Type.Union(
  [Type.Literal("ALL"), Type.Literal("BOUNDARIES")],
  { $id: "DashboardScopeMode" },
);

export const DashboardOrgSchema = Type.Object(
  {
    id: Type.Integer(),
    slug: Type.String(),
    name: Type.String(),
    businessType: DashboardBusinessTypeSchema,
    scopeMode: DashboardScopeModeSchema,
    scope: BoundaryScopeSchema,
    // Entitlements actifs pour cette org. Pour `businessType='staff'` la liste
    // peut être vide : le bypass dans `orgHasFeature` les considère comme
    // ayant TOUTES les features (cf. ADR 0009).
    features: Type.Array(DashboardFeatureSchema),
  },
  { $id: "DashboardOrg" },
);

export const DashboardMeUserSchema = Type.Object(
  {
    id: Type.String(),
    email: Type.String(),
    name: Nullable(Type.String()),
  },
  { $id: "DashboardMeUser" },
);

export const DashboardMeSchema = Type.Object(
  {
    user: DashboardMeUserSchema,
    organizations: Type.Array(DashboardOrgSchema),
  },
  { $id: "DashboardMe" },
);

export const GetDashboardMeResponseSchema = ApiResponseSchema(
  DashboardMeSchema,
  "GetDashboardMeResponse",
);

export type BoundaryScope = Static<typeof BoundaryScopeSchema>;
export type DashboardBusinessType = Static<typeof DashboardBusinessTypeSchema>;
export type DashboardScopeMode = Static<typeof DashboardScopeModeSchema>;
export type DashboardOrg = Static<typeof DashboardOrgSchema>;
export type DashboardMeUser = Static<typeof DashboardMeUserSchema>;
export type DashboardMe = Static<typeof DashboardMeSchema>;
