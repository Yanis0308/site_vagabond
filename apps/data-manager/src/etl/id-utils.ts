/**
 * Utility functions for generating IDs for POIs and boundaries
 */

/**
 * Generate a source ID from OSM data
 * @param item - Object with osm_type and osm_id
 * @returns Source ID in format: {osm_type}-{osm_id}
 * @example getSourceId({ osm_type: "way", osm_id: "123456" }) => "way-123456"
 */
export function getSourceId(item: {
  osm_type: string;
  osm_id: string;
}): string {
  return `${item.osm_type}-${item.osm_id}`;
}

/**
 * Generate a database ID from source and source ID
 * @param source - Source name (e.g., "OSM")
 * @param sourceId - Source ID
 * @returns Database ID in format: {source}-{sourceId}
 * @example getDbId("OSM", "way-123456") => "OSM-way-123456"
 */
export function getDbId(source: string, sourceId: string): string {
  return `${source}-${sourceId}`;
}
