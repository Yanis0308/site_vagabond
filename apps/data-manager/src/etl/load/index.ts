import { schema } from "@vagabond/database-client";

// Utility functions partagées
export function getSourceId(item: {
  osm_type: string;
  osm_id: string;
}): string {
  return `${item.osm_type}-${item.osm_id}`;
}

export function getDbId(
  source: schema.PoiSourceEnum,
  sourceId: string,
): string {
  return `${source}-${sourceId}`;
}

// Re-export des modules spécialisés
export * from "./associations";
export * from "./boundaries";
export * from "./hierarchies";
export * from "./pois";
