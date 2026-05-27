import { type Static, Type } from "typebox";

import {
  ApiResponseSchema,
  CursorPaginatedResponseSchema,
  CursorPaginationQuerySchema,
  Nullable,
} from "../../utils.js";

export const DashboardUsersQuerySchema = Type.Object(
  {
    ...CursorPaginationQuerySchema.properties,
    search: Type.Optional(Type.String()),
  },
  { $id: "DashboardUsersQuery" },
);

// V0 : `visitedPoisCount` est filtré par le scope de l'org (cf. ADR 0008). Pour
// une org `BOUNDARIES`, seuls les visites de POI rattachés à l'une des
// boundaries de l'org sont comptées — les users qui n'ont rien visité dans le
// scope n'apparaissent pas (INNER JOIN visited_pois -> poi_boundaries).
export const DashboardUserItemSchema = Type.Object(
  {
    id: Type.String(),
    displayName: Type.String(),
    email: Nullable(Type.String()),
    visitedPoisCount: Type.Integer({ minimum: 0 }),
    createdAt: Type.String(),
    lastVisitedPoiAt: Nullable(Type.String()),
  },
  { $id: "DashboardUserItem" },
);

export const GetDashboardUsersResponseSchema = ApiResponseSchema(
  CursorPaginatedResponseSchema(
    DashboardUserItemSchema,
    "DashboardUsersResponseData",
  ),
  "GetDashboardUsersResponse",
);

export type DashboardUsersQuery = Static<typeof DashboardUsersQuerySchema>;
export type DashboardUserItem = Static<typeof DashboardUserItemSchema>;
