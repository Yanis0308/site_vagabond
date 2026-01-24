/**
 * POI utility functions
 */

/**
 * Filter level type (aligned with database enum PoiFilterLevelEnum)
 */
export type PoiFilterLevel =
  | "UNKNOWN"
  | "STRICT"
  | "STANDARD"
  | "INTERMEDIATE"
  | "LAXIST";

/**
 * Convert numeric filter level to string enum value
 * @param filterLevel - Numeric filter level (1-4)
 * @returns String representation of the filter level
 */
export function getFilterLevelName(filterLevel: number): PoiFilterLevel {
  switch (filterLevel) {
    case 1:
      return "STRICT";
    case 2:
      return "STANDARD";
    case 3:
      return "INTERMEDIATE";
    case 4:
      return "LAXIST";
    default:
      return "UNKNOWN";
  }
}
