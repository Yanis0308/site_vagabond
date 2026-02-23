import { type PoiFilterLevelEnum } from "../schemas/enums.js";

/**
 * POI utility functions
 */

/**
 * Convert numeric filter level to string enum value
 * @param filterLevel - Numeric filter level (1-4)
 * @returns String representation of the filter level
 */
export function getFilterLevelName(filterLevel: number): PoiFilterLevelEnum {
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
