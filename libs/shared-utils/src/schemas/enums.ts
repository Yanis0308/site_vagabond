import { Type } from "@sinclair/typebox";

export const LanguageEnumSchema = Type.Union(
  [Type.Literal("EN"), Type.Literal("FR")],
  { $id: "LanguageEnum" },
);

export const PoiSourceEnumSchema = Type.Union([Type.Literal("OSM")], {
  $id: "PoiSourceEnum",
});

export const PoiDataSourceEnumSchema = Type.Union(
  [Type.Literal("OSM"), Type.Literal("AI"), Type.Literal("CUSTOM")],
  { $id: "PoiDataSourceEnum" },
);

export const VisitedPoiStatusEnumSchema = Type.Union(
  [Type.Literal("PENDING"), Type.Literal("CONFIRMED")],
  { $id: "VisitedPoiStatusEnum" },
);

export const ErrorEnumSchema = Type.Union(
  [Type.Literal("RESOURCE_ALREADY_EXISTS")],
  { $id: "ErrorEnum" },
);
