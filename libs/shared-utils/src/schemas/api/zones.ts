import { type Static, Type } from "typebox";

import { BoundaryLevelEnumSchema } from "../enums.js";
import { CoordsSchema } from "../geo.js";
import { ApiResponseSchema } from "../utils.js";
import { BriefVisitedPoiSchema } from "./visited-poi.js";

export const ZoneBaseSchema = Type.Object(
  {
    zone_id: Type.String(),
    name: Type.String(),
    boundary_level: BoundaryLevelEnumSchema,
  },
  { $id: "ZoneBase" },
);

export const ZoneStatSchema = Type.Object(
  {
    zone_id: Type.String(),
    name: Type.String(),
    point: CoordsSchema,
    total_pois: Type.Number({ minimum: 0 }),
    boundary_level: BoundaryLevelEnumSchema,
    parent_id: Type.Union([Type.Null(), Type.String()]),
    place_type: Type.Union([Type.Null(), Type.String()]),
    population: Type.Union([Type.Null(), Type.Number()]),
    is_capital: Type.Union([Type.Null(), Type.Boolean()]),
    importance_score: Type.Union([Type.Null(), Type.Number()]),
    way_area: Type.Union([Type.Null(), Type.Number()]),
  },
  { $id: "ZoneStat" },
);

export const ZoneUserStatSchema = Type.Object(
  {
    zone_id: Type.String(),
    name: Type.String(),
    boundary_level: BoundaryLevelEnumSchema,
    parent_id: Type.Union([Type.Null(), Type.String()]),
    validated_pois_count: Type.Number({ minimum: 0 }),
    validated_pois: Type.Array(BriefVisitedPoiSchema),
    total_pois_count: Type.Number({ minimum: 0 }),
    total_subzones_count: Type.Number({ minimum: 0 }),
    completed_subzones_count: Type.Number({ minimum: 0 }),
  },
  { $id: "ZoneUserStat" },
);

export const GetZoneStatsResponseSchema = ApiResponseSchema(
  Type.Array(ZoneStatSchema),
  "GetZoneStatsResponse",
);

export const GetUserZoneStatsResponseSchema = ApiResponseSchema(
  Type.Array(ZoneUserStatSchema),
  "GetUserZoneStatsResponse",
);

export type ZoneStat = Static<typeof ZoneStatSchema>;
export type ZoneUserStat = Static<typeof ZoneUserStatSchema>;
