import { type jsonSchemas } from "@vagabond/shared-utils";
import { type Static } from "typebox";

// Types exportés depuis les schemas
export type ExtractedPoiDatabaseRow = Static<
  typeof jsonSchemas.ExtractedPoiDatabaseRowSchema
>;

export type PoiBoundaryAssociation = Static<
  typeof jsonSchemas.PoiBoundaryAssociationSchema
>;

export type BoundaryHierarchyRow = Static<
  typeof jsonSchemas.BoundaryHierarchyRowSchema
>;

// Interface pour les données consolidées boundaries + admin_centres
export interface ConsolidatedBoundaryRow {
  osm_id: string;
  osm_type: string;
  name: string | null;
  admin_level: number;
  admin_centre_members: string | null;
  tags: Record<string, string>;
  // Coordonnées du point d'affichage (centroïde)
  display_point_lat: number;
  display_point_lon: number;
  // Aire calculée depuis la géométrie (pour logique OSM)
  way_area: number;
  // Données admin_centre (optionnelles)
  admin_centre_name?: string | null;
  admin_centre_place_type?: string | null;
  admin_centre_longitude?: number | null;
  admin_centre_latitude?: number | null;
  admin_centre_population?: number | null;
  admin_centre_is_capital?: boolean | null;
  admin_centre_importance_score?: number | null;
  admin_centre_tags?: Record<string, string> | null;
}

// Types pour les arguments CLI
export interface CliArgs {
  schema: string;
  countryCode: string;
}

// Types pour le stream processing
export type ValidatorFunction<T> = (row: unknown) => row is T;
export type BatchProcessorFunction<T> = (batch: T[]) => Promise<void>;

// Types pour le découplage Transform/Load avec fichiers JSONL
export interface JsonlFileConfig {
  filePath: string;
  batchSize: number;
}

export interface TransformOutputFiles {
  pois: JsonlFileConfig;
  boundaries: JsonlFileConfig;
  associations: JsonlFileConfig;
  hierarchies: JsonlFileConfig;
}

// Interface pour les données intermédiaires en JSONL
export interface JsonlPoiRecord {
  type: "poi";
  data: ExtractedPoiDatabaseRow & { id: string };
}

export interface JsonlBoundaryRecord {
  type: "boundary";
  data: ConsolidatedBoundaryRow;
  countryCode: string;
}

export interface JsonlAssociationRecord {
  type: "association";
  data: PoiBoundaryAssociation;
  countryCode: string;
}

export interface JsonlHierarchyRecord {
  type: "hierarchy";
  data: BoundaryHierarchyRow;
  countryCode: string;
}

export type JsonlRecord =
  | JsonlPoiRecord
  | JsonlBoundaryRecord
  | JsonlAssociationRecord
  | JsonlHierarchyRecord;

// Interface pour écriture/lecture JSONL
export interface JsonlWriter<T> {
  write(record: T): Promise<void>;
  close(): Promise<void>;
}

export interface JsonlReader<T> {
  read(): AsyncIterable<T>;
  close(): Promise<void>;
}
