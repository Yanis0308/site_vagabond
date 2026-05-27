import { type Static, Type } from "typebox";

import {
  ApiResponseSchema,
  CursorPaginatedResponseSchema,
  CursorPaginationQuerySchema,
  Nullable,
} from "../../utils.js";
import { UserFeedbackCategorySchema } from "../user-feedback.js";

// `GET /api/dashboard/orgs/:orgSlug/feedbacks` — vue paginée des user feedbacks.
// Les données sont cross-org (tous les feedbacks de l'app), la garde d'accès
// est portée par la feature `feedbacks` (cf. ADR 0009). Donner cette feature à
// une org cliente n'a pas d'effet de scoping côté DB en V0 — c'est volontaire :
// si on voulait scoper, on créerait une feature dédiée.
export const DashboardFeedbacksQuerySchema = Type.Object(
  {
    ...CursorPaginationQuerySchema.properties,
    category: Type.Optional(UserFeedbackCategorySchema),
  },
  { $id: "DashboardFeedbacksQuery" },
);

export const DashboardFeedbackItemSchema = Type.Object(
  {
    id: Type.Integer(),
    category: UserFeedbackCategorySchema,
    message: Type.String(),
    targetPoiId: Nullable(Type.String()),
    appVersion: Type.String(),
    os: Type.String(),
    createdAt: Type.String(),
    userId: Type.String(),
    userDisplayName: Type.String(),
    payload: Type.Unknown(),
  },
  { $id: "DashboardFeedbackItem" },
);

export const GetDashboardFeedbacksResponseSchema = ApiResponseSchema(
  CursorPaginatedResponseSchema(
    DashboardFeedbackItemSchema,
    "DashboardFeedbacksResponseData",
  ),
  "GetDashboardFeedbacksResponse",
);

export type DashboardFeedbacksQuery = Static<
  typeof DashboardFeedbacksQuerySchema
>;
export type DashboardFeedbackItem = Static<typeof DashboardFeedbackItemSchema>;
