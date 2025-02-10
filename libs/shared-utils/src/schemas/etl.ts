import { Type } from "@sinclair/typebox";

import { Latitude, Longitude } from "./geo.js";

export const ExtractedPoiDatabaseRowSchema = Type.Object(
  {
    osm_id: Type.String(),
    osm_type: Type.String(),
    latitude: Type.Ref(Latitude),
    longitude: Type.Ref(Longitude),
    tags: Type.Record(Type.String(), Type.String()),
  },
  { $id: "ExtractedPoiDatabaseRow" },
);
