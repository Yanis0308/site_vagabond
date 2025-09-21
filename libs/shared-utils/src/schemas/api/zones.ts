import { Type } from "@sinclair/typebox";

import { BoundaryLevelEnum } from "../enums.js";
import { CoordsSchema } from "../geo.js";
import { ApiResponseSchema } from "../utils.js";

export const ZoneBaseSchema = Type.Object(
  {
    zone_id: Type.String(),
    name: Type.String(),
    boundary_level: Type.Ref(BoundaryLevelEnum),
  },
  { $id: "ZoneBase" },
);

export const ZoneStatSchema = Type.Object(
  {
    zone_id: Type.String(),
    name: Type.String(),
    point: Type.Ref(CoordsSchema),
    total_pois: Type.Number({ minimum: 0 }),
    boundary_level: Type.Ref(BoundaryLevelEnum),
    parent_id: Type.Union([Type.Null(), Type.String()]),
    place_type: Type.Union([Type.Null(), Type.String()]),
    population: Type.Union([Type.Null(), Type.Number()]),
    is_capital: Type.Union([Type.Null(), Type.Boolean()]),
    importance_score: Type.Union([Type.Null(), Type.Number()]),
    way_area: Type.Union([Type.Null(), Type.Number()]),
  },
  { $id: "ZoneStat" },
);

export const GetZoneStatsResponseSchema = ApiResponseSchema(
  Type.Array(Type.Ref(ZoneStatSchema)),
  "GetZoneStatsResponse",
);
