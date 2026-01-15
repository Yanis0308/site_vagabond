import { Type } from "typebox";

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
    minLat: Latitude,
    maxLat: Latitude,
    minLng: Longitude,
    maxLng: Longitude,
  },
  {
    $id: "BoundingBox",
  },
);

export const CoordsSchema = Type.Object(
  {
    latitude: Latitude,
    longitude: Longitude,
  },
  {
    $id: "Coords",
  },
);
