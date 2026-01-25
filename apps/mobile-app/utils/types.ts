import { type jsonSchemas, type PoiFilterLevel } from "@vagabond/shared-utils";
import { type Static } from "typebox";

export interface PoiType {
  id: string;
  coords: { latitude: number; longitude: number };
  name: string;
  filterLevel: PoiFilterLevel;
}

export type VisitedPoiType = Static<
  typeof jsonSchemas.GetVisitedPoisResponseSchema.properties.data
>[0];

export type BriefVisitedPoiType = Static<
  typeof jsonSchemas.BriefVisitedPoiSchema
>;

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
