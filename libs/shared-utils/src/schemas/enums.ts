import { type Static, Type } from "typebox";

export const LanguageEnumSchema = Type.Union(
  [Type.Literal("EN"), Type.Literal("FR")],
  { $id: "LanguageEnum" },
);
export type LanguageEnum = Static<typeof LanguageEnumSchema>;

export const PoiSourceEnumSchema = Type.Union([Type.Literal("OSM")], {
  $id: "PoiSourceEnum",
});
export type PoiSourceEnum = Static<typeof PoiSourceEnumSchema>;

export const PoiDataSourceEnumSchema = Type.Union(
  [Type.Literal("OSM"), Type.Literal("AI"), Type.Literal("CUSTOM")],
  { $id: "PoiDataSourceEnum" },
);
export type PoiDataSourceEnum = Static<typeof PoiDataSourceEnumSchema>;

export const VisitedPoiStatusEnumSchema = Type.Union(
  [Type.Literal("PENDING"), Type.Literal("CONFIRMED")],
  { $id: "VisitedPoiStatusEnum" },
);
export type VisitedPoiStatusEnum = Static<typeof VisitedPoiStatusEnumSchema>;

export const ErrorEnumSchema = Type.Union(
  [
    Type.Literal("RESOURCE_ALREADY_EXISTS"),
    Type.Literal("NOT_FOUND"),
    Type.Literal("INTERNAL_SERVER_ERROR"),
    Type.Literal("FORBIDDEN"),
  ],
  { $id: "ErrorEnum" },
);
export type ErrorEnum = Static<typeof ErrorEnumSchema>;

export const RoleEnumSchema = Type.Union(
  [Type.Literal("ADMIN"), Type.Literal("USER")],
  { $id: "RoleEnum" },
);
export type RoleEnum = Static<typeof RoleEnumSchema>;

export const PoiFilterLevelEnumSchema = Type.Union(
  [
    Type.Literal("UNKNOWN"),
    Type.Literal("STRICT"),
    Type.Literal("STANDARD"),
    Type.Literal("INTERMEDIATE"),
    Type.Literal("LAXIST"),
  ],
  { $id: "PoiFilterLevelEnum" },
);
export type PoiFilterLevelEnum = Static<typeof PoiFilterLevelEnumSchema>;

export const BoundaryLevelEnumSchema = Type.Union(
  [
    Type.Literal("COUNTRY"),
    Type.Literal("REGION"),
    Type.Literal("COUNTY"),
    Type.Literal("CITY"),
    Type.Literal("DISTRICT"),
    Type.Literal("NEIGHBORHOOD"),
  ],
  { $id: "BoundaryLevelEnum" },
);

export type BoundaryLevelEnum = Static<typeof BoundaryLevelEnumSchema>;
