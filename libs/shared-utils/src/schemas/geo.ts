import { Type } from "typebox";

import { Nullable } from "./utils.js";

export const Latitude = Type.Number({
  minimum: -90,
  maximum: 90,
  $id: "Latitude",
});

export const Longitude = Type.Number({
  minimum: -180,
  maximum: 180,
  $id: "Longitude",
});

export const CoordsSchema = Type.Object(
  {
    latitude: Latitude,
    longitude: Longitude,
    accuracy: Type.Optional(Nullable(Type.Number())),
    altitude: Type.Optional(Nullable(Type.Number())),
    altitudeAccuracy: Type.Optional(Nullable(Type.Number())),
    heading: Type.Optional(Nullable(Type.Number())),
    speed: Type.Optional(Nullable(Type.Number())),
  },
  {
    $id: "Coords",
  },
);

export const SimplifiedCoordsSchema = Type.Pick(
  CoordsSchema,
  Type.Union([Type.Literal("latitude"), Type.Literal("longitude")]),
  { $id: "SimplifiedCoords" },
);
