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

export const ExtractedBoundaryDatabaseRowSchema = Type.Object(
  {
    osm_id: Type.String(),
    osm_type: Type.String(),
    name: Type.Union([Type.String(), Type.Null()]),
    admin_level: Type.Number(), // Changed to number
    geom_json: Type.String(), // GeoJSON as string
    tags: Type.Record(Type.String(), Type.String()),
    admin_centre_members: Type.Union([Type.String(), Type.Null()]), // JSON string of admin centre references
  },
  { $id: "ExtractedBoundaryDatabaseRow" },
);

export const ExtractedAdminCentreDatabaseRowSchema = Type.Object(
  {
    osm_id: Type.String(),
    osm_type: Type.String(),
    name: Type.Union([Type.String(), Type.Null()]),
    place_type: Type.Union([Type.String(), Type.Null()]),
    latitude: Type.Ref(Latitude),
    longitude: Type.Ref(Longitude),
    population: Type.Union([Type.Number(), Type.Null()]),
    is_capital: Type.Boolean(),
    importance_score: Type.Number(),
    tags: Type.Record(Type.String(), Type.String()),
  },
  { $id: "ExtractedAdminCentreDatabaseRow" },
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
