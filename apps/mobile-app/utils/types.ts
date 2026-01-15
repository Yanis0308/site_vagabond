import { type jsonSchemas } from "@vagabond/shared-utils";
import { type Static } from "typebox";

export type PoiType = Static<
  typeof jsonSchemas.GetPoisResponseSchema.properties.data
>[0];

export type VisitedPoiType = Static<
  typeof jsonSchemas.GetVisitedPoisResponseSchema.properties.data
>[0];

export type BriefVisitedPoiType = Static<
  typeof jsonSchemas.BriefVisitedPoiSchema
>;

export type BoundingBoxType = Static<typeof jsonSchemas.BoundingBoxSchema>;

export type UsersMeType = Static<
  typeof jsonSchemas.UsersMeResponseSchema.properties.data
>;

export type ZoneStatType = Static<
  typeof jsonSchemas.GetZoneStatsResponseSchema.properties.data
>[0];

export type ZoneUserStatType = Static<
  typeof jsonSchemas.GetUserZoneStatsResponseSchema.properties.data
>[0];

export type BoundaryLevelEnumType = Static<
  typeof jsonSchemas.BoundaryLevelEnum
>;
