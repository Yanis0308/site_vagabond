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

// VG-471 — mvtId : id numérique stable et déterministe utilisé comme MVT
// feature id dans le tileset Mapbox vectoriel. Le hash interne MTS n'étant pas
// reproductible côté client, on pré-encode nous-mêmes l'id en utilisant un
// schéma de plages numériques par type OSM. Le mvtId est calculé identiquement
// côté ETL (transform GeoJSON) et côté mobile (setFeatureState), garantissant
// un matching exact entre la feature MVT et l'appel client.
//
// Plages (tous sous Number.MAX_SAFE_INTEGER ≈ 9×10^15) :
//   OSM-N-{id} → mvtId = id                  (0          .. 10^11)
//   OSM-W-{id} → mvtId = id + 10^11          (10^11      .. 2×10^11)
//   OSM-R-{id} → mvtId = id + 2 × 10^11      (2×10^11    .. 3×10^11)
//
// Exemples :
//   OSM-N-123456789  → mvtId = 123456789
//   OSM-W-9876543210 → mvtId = 9876543210 + 10^11 = 109876543210
//   OSM-R-12345      → mvtId = 12345 + 2×10^11 = 200000012345
//
// Le jour où des sources non-OSM apparaissent (AI, CUSTOM dans
// poiSourceEnum), étendre avec de nouvelles plages au-dessus de 3×10^11
// et mettre à jour ADR-0003 + la regex POI_ID_PATTERN.

const OSM_WAY_OFFSET = 100_000_000_000;
const OSM_RELATION_OFFSET = 200_000_000_000;
const POI_ID_PATTERN = /^OSM-([NWR])-(\d+)$/;

export function getMvtIdFromPoiId(poiId: string): number {
  const match = POI_ID_PATTERN.exec(poiId);
  if (match === null) {
    throw new Error(
      `Unsupported poiId format (expected OSM-{N|W|R}-{int}): ${poiId}`,
    );
  }
  const type = match[1];
  const osmId = Number(match[2]);
  if (!Number.isSafeInteger(osmId)) {
    throw new Error(`OSM id out of safe integer range: ${poiId}`);
  }
  switch (type) {
    case "N":
      return osmId;
    case "W":
      return osmId + OSM_WAY_OFFSET;
    case "R":
      return osmId + OSM_RELATION_OFFSET;
    default:
      throw new Error(`Unknown OSM type: ${type}`);
  }
}
