import { Type } from "@sinclair/typebox";

import { Latitude, Longitude } from "./geo.js";

export const ExtractedPoiDatabaseRowSchema = Type.Object(
  {
    osm_id: Type.String(),
    osm_type: Type.String(),
    latitude: Type.Ref(Latitude),
    longitude: Type.Ref(Longitude),
    filter_level: Type.Number(),
    tags: Type.Record(Type.String(), Type.String()),
  },
  { $id: "ExtractedPoiDatabaseRow" },
);

export const BoundaryHierarchyRowSchema = Type.Object(
  {
    child_osm_id: Type.String(),
    child_osm_type: Type.String(),
    parent_osm_id: Type.String(),
    parent_osm_type: Type.String(),
  },
  { $id: "BoundaryHierarchyRow" },
);

export const PoiBoundaryAssociationSchema = Type.Object(
  {
    poi_osm_id: Type.String(),
    poi_osm_type: Type.String(),
    boundary_osm_id: Type.String(),
    boundary_osm_type: Type.String(),
  },
  { $id: "PoiBoundaryAssociation" },
);
