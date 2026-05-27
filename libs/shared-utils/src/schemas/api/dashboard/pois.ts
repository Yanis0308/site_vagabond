import { type Static, Type } from "typebox";

import { PoiFilterLevelEnumSchema } from "../../enums.js";
import {
  ApiResponseSchema,
  CursorPaginatedResponseSchema,
  CursorPaginationQuerySchema,
  Nullable,
} from "../../utils.js";

export const DashboardPoisQuerySchema = Type.Object(
  {
    ...CursorPaginationQuerySchema.properties,
    search: Type.Optional(Type.String()),
    filterLevel: Type.Optional(PoiFilterLevelEnumSchema),
    disabled: Type.Optional(Type.Boolean()),
  },
  { $id: "DashboardPoisQuery" },
);

export const DashboardPoiItemSchema = Type.Object(
  {
    id: Type.String(),
    name: Nullable(Type.String()),
    mainCategory: Nullable(Type.String()),
    filterLevel: PoiFilterLevelEnumSchema,
    disabled: Type.Boolean(),
    createdAt: Type.String(),
  },
  { $id: "DashboardPoiItem" },
);

export const GetDashboardPoisResponseSchema = ApiResponseSchema(
  CursorPaginatedResponseSchema(
    DashboardPoiItemSchema,
    "DashboardPoisResponseData",
  ),
  "GetDashboardPoisResponse",
);

export type DashboardPoisQuery = Static<typeof DashboardPoisQuerySchema>;
export type DashboardPoiItem = Static<typeof DashboardPoiItemSchema>;
