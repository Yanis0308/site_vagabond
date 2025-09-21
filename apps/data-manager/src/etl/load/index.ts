import { type PoiSourceEnum } from "@vagabond/database-client/dist/db/generated/client";

// Utility functions partagées
export function getSourceId(item: {
  osm_type: string;
  osm_id: string;
}): string {
  return `${item.osm_type}-${item.osm_id}`;
}

export function getDbId(source: PoiSourceEnum, sourceId: string): string {
  return `${source}-${sourceId}`;
}

// Re-export des modules spécialisés
export * from "./associations";
export * from "./boundaries";
export * from "./hierarchies";
export * from "./pois";
