import { type Static, Type } from "typebox";

import { Latitude, Longitude } from "./geo.js";

export const ExtractedPoiDatabaseRowSchema = Type.Object(
  {
    osm_id: Type.String(),
    osm_type: Type.String(),
    latitude: Latitude,
    longitude: Longitude,
    filter_level: Type.Number(),
    main_category: Type.String(),
    categories: Type.Array(Type.String()),
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

export type ExtractedPoiDatabaseRow = Static<
  typeof ExtractedPoiDatabaseRowSchema
>;
export type BoundaryHierarchyRow = Static<typeof BoundaryHierarchyRowSchema>;
export type PoiBoundaryAssociation = Static<
  typeof PoiBoundaryAssociationSchema
>;
