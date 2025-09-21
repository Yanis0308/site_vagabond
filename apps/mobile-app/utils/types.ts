import { type Static } from "@sinclair/typebox";
import { type jsonSchemas } from "@vagabond/shared-utils";

export type PoiType = Static<
  typeof jsonSchemas.GetPoisResponseSchema.properties.data
>[0];

export type VisitedPoiType = Static<
  typeof jsonSchemas.GetVisitedPoisResponseSchema.properties.data
>[0];

export type BoundingBoxType = Static<typeof jsonSchemas.BoundingBoxSchema>;

export type UsersMeType = Static<
  typeof jsonSchemas.UsersMeResponseSchema.properties.data
>;

export type ZoneStatType = Static<
  typeof jsonSchemas.GetZoneStatsResponseSchema.properties.data
>[0];
