import { Type } from "@sinclair/typebox";

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

export const BoundingBoxSchema = Type.Object(
  {
    minLat: Type.Ref(Latitude),
    maxLat: Type.Ref(Latitude),
    minLng: Type.Ref(Longitude),
    maxLng: Type.Ref(Longitude),
  },
  { $id: "BoundingBox" },
);

export const CoordsSchema = Type.Object(
  {
    latitude: Type.Ref(Latitude),
    longitude: Type.Ref(Longitude),
  },
  { $id: "Coords" },
);
