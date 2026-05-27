import { type Static, Type } from "typebox";

import {
  ApiResponseSchema,
  CursorPaginatedResponseSchema,
  CursorPaginationQuerySchema,
  Nullable,
} from "../../utils.js";

// `GET /api/dashboard/orgs/:orgSlug/app-reviews` — vue paginée des app reviews
// (positive/negative + commentaire). Comme `/feedbacks`, le contenu est
// cross-org ; la garde est portée par la feature `app-reviews`.
export const DashboardAppReviewsQuerySchema = Type.Object(
  {
    ...CursorPaginationQuerySchema.properties,
    positive: Type.Optional(Type.Boolean()),
  },
  { $id: "DashboardAppReviewsQuery" },
);

export const DashboardAppReviewItemSchema = Type.Object(
  {
    id: Type.Integer(),
    positive: Type.Boolean(),
    comment: Nullable(Type.String()),
    createdAt: Type.String(),
    userId: Type.String(),
    userDisplayName: Type.String(),
  },
  { $id: "DashboardAppReviewItem" },
);

export const GetDashboardAppReviewsResponseSchema = ApiResponseSchema(
  CursorPaginatedResponseSchema(
    DashboardAppReviewItemSchema,
    "DashboardAppReviewsResponseData",
  ),
  "GetDashboardAppReviewsResponse",
);

export type DashboardAppReviewsQuery = Static<
  typeof DashboardAppReviewsQuerySchema
>;
export type DashboardAppReviewItem = Static<
  typeof DashboardAppReviewItemSchema
>;
