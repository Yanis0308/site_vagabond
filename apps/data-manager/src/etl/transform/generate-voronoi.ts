import * as turf from "@turf/turf";
import { logger } from "@vagabond/shared-utils";
import { Delaunay } from "d3-delaunay";
import { type Feature, type MultiPolygon, type Polygon } from "geojson";

import { getDbId, getSourceId } from "../id-utils";
import { JsonlFileReader, JsonlFileWriter } from "../jsonl-utils";
import { type JsonlAssociationRecord, type JsonlPoiRecord } from "../types";

// --- Types ---

interface VoronoiZoneProperties {
  poiId: string;
  cityId: string;
  cityName: string | null;
}

type VoronoiZoneFeature = Feature<Polygon, VoronoiZoneProperties>;

/** Minimal info we keep about a POI for Voronoi computation */
interface PoiInfo {
  id: string; // e.g. "OSM-N-123456"
  longitude: number;
  latitude: number;
  tagCount: number;
  filterLevel: number;
}

interface DeduplicateResult {
  pois: PoiInfo[];
  /** One entry per cluster that had more than 1 POI */
  mergedClusters: Array<{ kept: string; removed: string[] }>;
}

/**
 * Deduplicate POIs that are within `thresholdKm` of each other using
 * DBSCAN clustering (turf.clustersDbscan). For each cluster, the POI
 * with the most tags (then lowest filterLevel) is kept.
 */
function deduplicateNearbyPois(
  pois: PoiInfo[],
  thresholdKm = 0.005, // 5 meters
): DeduplicateResult {
  if (pois.length <= 1) return { pois, mergedClusters: [] };

  const points = turf.featureCollection(
    pois.map((p) => turf.point([p.longitude, p.latitude], p)),
  );
  const clustered = turf.clustersDbscan(points, thresholdKm, {
    units: "kilometers",
    minPoints: 1,
  });

  // Group by cluster id; noise points (cluster === undefined) are kept as-is
  const clusters = new Map<number, PoiInfo[]>();
  const result: PoiInfo[] = [];

  for (const feature of clustered.features) {
    const poi = feature.properties as PoiInfo & { cluster?: number };
    if (poi.cluster === undefined) {
      result.push(poi);
    } else {
      let group = clusters.get(poi.cluster);
      if (group === undefined) {
        group = [];
        clusters.set(poi.cluster, group);
      }
      group.push(poi);
    }
  }

  // Keep best POI per cluster (most tags, then lowest filterLevel)
  const mergedClusters: DeduplicateResult["mergedClusters"] = [];
  for (const group of clusters.values()) {
    group.sort((a, b) => {
      const tagDiff = b.tagCount - a.tagCount;
      return tagDiff !== 0 ? tagDiff : a.filterLevel - b.filterLevel;
    });
    const best = group[0];
    if (best !== undefined) {
      result.push(best);
      if (group.length > 1) {
        mergedClusters.push({
          kept: best.id,
          removed: group.slice(1).map((p) => p.id),
        });
      }
    }
  }

  return { pois: result, mergedClusters };
}

/** Minimal boundary polygon feature read from the city polygons JSONL */
interface CityPolygonProperties {
  id: string;
  name: string | null;
  boundary_level: string;
  // [key: string]: unknown;
}

type CityPolygonFeature = Feature<
  MultiPolygon | Polygon,
  CityPolygonProperties
>;

// --- Helper ---

/**
 * Extract individual Polygon features from a Polygon or MultiPolygon.
 */
function extractPolygons(
  feature: Feature<Polygon | MultiPolygon>,
): Array<Feature<Polygon>> {
  if (feature.geometry.type === "Polygon") {
    return [feature as Feature<Polygon>];
  }

  // MultiPolygon → split into individual Polygons
  return feature.geometry.coordinates.map((coords) => ({
    type: "Feature" as const,
    properties: feature.properties,
    geometry: {
      type: "Polygon" as const,
      coordinates: coords,
    },
  }));
}

// --- Main function ---

/**
 * Generate Voronoi zones for each city by:
 * 1. Reading POIs + associations to group POIs by city
 * 2. Reading city polygon geometries
 * 3. Computing a Voronoi diagram per city
 * 4. Clipping each Voronoi cell to the city boundary
 * 5. Writing the result as GeoJSON JSONL
 */
export async function generateVoronoiZones(
  poisJsonlPath: string,
  associationsJsonlPath: string,
  cityPolygonsJsonlPath: string,
  outputVoronoiPath: string,
): Promise<void> {
  const startTime = Date.now();

  // ------------------------------------------------------------------
  // Step 1 – Read POIs to build a lookup map: poiId → PoiInfo
  // ------------------------------------------------------------------
  logger.info("[Voronoi] Lecture des POIs...");
  const poisById = new Map<string, PoiInfo>();

  const poiReader = new JsonlFileReader<JsonlPoiRecord>(poisJsonlPath);
  for await (const record of poiReader.read()) {
    const poi = record.data;
    poisById.set(poi.id, {
      id: poi.id,
      longitude: poi.longitude,
      latitude: poi.latitude,
      tagCount: Object.keys(poi.tags).length,
      filterLevel: poi.filter_level,
    });
  }
  await poiReader.close();
  logger.info(`[Voronoi] ${poisById.size} POIs chargés`);

  // ------------------------------------------------------------------
  // Step 2 – Read associations to map POI → city boundary
  //          (associations link POIs to ALL boundary levels, we filter
  //           for city-level later when we check cityPolygons)
  // ------------------------------------------------------------------
  logger.info("[Voronoi] Lecture des associations POI↔Boundary...");

  // boundaryKey → Set<poiId>
  const poisPerBoundary = new Map<string, Set<string>>();

  const assocReader = new JsonlFileReader<JsonlAssociationRecord>(
    associationsJsonlPath,
  );
  for await (const record of assocReader.read()) {
    const d = record.data;
    // boundaryKey in the same format used by the polygon properties: "{osm_type}-{osm_id}"
    const boundaryKey = `${d.boundary_osm_type}-${d.boundary_osm_id}`;
    // poiId in database ID format: "OSM-{osm_type}-{osm_id}"
    const poiSourceId = getSourceId({
      osm_type: d.poi_osm_type,
      osm_id: d.poi_osm_id,
    });
    const poiId = getDbId("OSM", poiSourceId);

    let set = poisPerBoundary.get(boundaryKey);
    if (set === undefined) {
      set = new Set<string>();
      poisPerBoundary.set(boundaryKey, set);
    }
    set.add(poiId);
  }
  await assocReader.close();
  logger.info(`[Voronoi] ${poisPerBoundary.size} boundaries liées à des POIs`);

  // ------------------------------------------------------------------
  // Step 3 – Read city polygon geometries
  // ------------------------------------------------------------------
  logger.info("[Voronoi] Lecture des polygones city...");
  const cityPolygonsMap = new Map<string, CityPolygonFeature>();

  const cityReader = new JsonlFileReader<CityPolygonFeature>(
    cityPolygonsJsonlPath,
  );
  for await (const feature of cityReader.read()) {
    if (feature.properties.id !== "") {
      cityPolygonsMap.set(feature.properties.id, feature);
    }
  }
  await cityReader.close();
  logger.info(`[Voronoi] ${cityPolygonsMap.size} polygones city chargés`);

  // ------------------------------------------------------------------
  // Step 4 – For each city, compute Voronoi & clip
  // ------------------------------------------------------------------
  logger.info("[Voronoi] Calcul des diagrammes Voronoi par ville...");

  const writer = new JsonlFileWriter<VoronoiZoneFeature>(outputVoronoiPath);
  let totalZones = 0;
  let citiesProcessed = 0;
  let citiesSkipped = 0;

  for (const [cityId, cityFeature] of cityPolygonsMap.entries()) {
    const poiIdsInCity = poisPerBoundary.get(cityId);
    if (poiIdsInCity === undefined || poiIdsInCity.size === 0) {
      citiesSkipped++;
      continue;
    }

    // Collect POI points for this city
    const cityPois: PoiInfo[] = [];
    for (const poiId of poiIdsInCity) {
      const poi = poisById.get(poiId);
      if (poi !== undefined) {
        cityPois.push(poi);
      }
    }

    if (cityPois.length === 0) {
      citiesSkipped++;
      continue;
    }

    // Deduplicate POIs that are within 5 m of each other (e.g. same monument
    // imported as both an OSM Node and an OSM Relation). Keeps the POI with
    // the most tags (then best filter_level) as cluster representative.
    const dedupResult = deduplicateNearbyPois(cityPois);
    const dedupPois = dedupResult.pois;
    const mergedClusters = dedupResult.mergedClusters;
    if (mergedClusters.length > 0) {
      let totalRemoved = 0;
      for (const c of mergedClusters) {
        totalRemoved += c.removed.length;
      }
      logger.info(
        `[Voronoi] City ${cityId}: ${totalRemoved} POI(s) merged in ${mergedClusters.length} cluster(s)`,
      );
      for (const cluster of mergedClusters) {
        const removedIds = cluster.removed.join(", ");
        logger.info(
          "[Voronoi]   kept " + cluster.kept + ", removed [" + removedIds + "]",
        );
      }
    }

    // Points as [lon, lat] for d3-delaunay (x=lon, y=lat).
    const points = dedupPois.map(
      (p) => [p.longitude, p.latitude] as [number, number],
    );

    // City boundary for clipping
    const cityBoundary: Feature<Polygon | MultiPolygon> = cityFeature;

    // Bounding box [xmin, ymin, xmax, ymax] for Voronoi extent
    const rawBbox = turf.bbox(cityBoundary) as [number, number, number, number];
    const padLon = Math.max(1e-4, (rawBbox[2] - rawBbox[0]) * 0.01);
    const padLat = Math.max(1e-4, (rawBbox[3] - rawBbox[1]) * 0.01);
    const bbox: [number, number, number, number] = [
      rawBbox[0] - padLon,
      rawBbox[1] - padLat,
      rawBbox[2] + padLon,
      rawBbox[3] + padLat,
    ];

    // If only 1 POI in the city, the zone covers the entire city polygon
    if (dedupPois.length === 1) {
      const poi = dedupPois[0];
      if (poi === undefined) {
        citiesSkipped++;
        continue;
      }
      const polygons = extractPolygons(cityBoundary);
      for (const polygon of polygons) {
        const voronoiFeature: VoronoiZoneFeature = {
          type: "Feature",
          properties: {
            poiId: poi.id,
            cityId,
            cityName: cityFeature.properties.name,
          },
          geometry: polygon.geometry,
        };
        await writer.write(voronoiFeature);
        totalZones++;
      }
      citiesProcessed++;
      continue;
    }

    // Compute Voronoi diagram using d3-delaunay (not turf.voronoi).
    // turf.voronoi relies on deprecated d3-voronoi which crashes on collinear/cocircular
    // points ("Cannot read properties of null" in clipCells). d3-delaunay is the modern
    // replacement: numerically robust, handles edge cases, and is the most performant
    // Voronoi library in JavaScript (5–10× faster than d3-voronoi).
    /** Cell polygon + index of the POI it belongs to (index can differ when cells are skipped) */
    let voronoiFeatures: Array<{ feature: Feature<Polygon>; poiIndex: number }>;
    try {
      const delaunay = Delaunay.from(points);
      const voronoi = delaunay.voronoi(bbox);
      voronoiFeatures = [];
      for (let i = 0; i < dedupPois.length; i++) {
        // Les types de d3-delaunay indiquent que cellPolygon() ne renvoie jamais null,
        // mais en pratique il renvoie null pour les cellules dégénérées (points dupliqués, etc.).
        // On corrige le typage pour permettre null/undefined et éviter une erreur à l'exécution.
        const cell = voronoi.cellPolygon(i) as
          | Iterable<[number, number]>
          | null
          | undefined;
        if (cell === null || cell === undefined) {
          logger.warn(
            `[Voronoi] Cellule dégénérée pour POI ${dedupPois[i]?.id} (index ${i}) dans city ${cityId}`,
          );
          continue;
        }
        const coords = Array.from(cell);
        if (coords.length < 3) {
          logger.warn(
            `[Voronoi] Cellule <3 points pour POI ${dedupPois[i]?.id} (index ${i}) dans city ${cityId}`,
          );
          continue;
        }
        // Ensure closed ring for GeoJSON (first === last)
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (
          first !== undefined &&
          last !== undefined &&
          (first[0] !== last[0] || first[1] !== last[1])
        ) {
          coords.push(first);
        }
        voronoiFeatures.push({
          feature: {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [coords] },
          } as Feature<Polygon>,
          poiIndex: i,
        });
      }
    } catch (error) {
      logger.warn(
        `[Voronoi] Erreur Voronoi pour city ${cityId} (${dedupPois.length} POIs): ${String(error)}`,
      );
      logger.error(error);
      citiesSkipped++;
      continue;
    }

    if (voronoiFeatures.length === 0) {
      citiesSkipped++;
      continue;
    }

    // Clip each Voronoi cell to the city boundary
    for (const { feature: voronoiCell, poiIndex } of voronoiFeatures) {
      const correspondingPoi = dedupPois[poiIndex];
      if (correspondingPoi === undefined) continue;

      try {
        const clipped = turf.intersect(
          turf.featureCollection([voronoiCell, cityBoundary]),
        );

        if (clipped === null) {
          logger.warn(
            `[Voronoi] Intersection nulle pour POI ${correspondingPoi.id} dans city ${cityId}`,
          );
          continue;
        }

        // intersect can return Polygon or MultiPolygon
        const clippedPolygons = extractPolygons(clipped);

        for (const polygon of clippedPolygons) {
          const voronoiFeature: VoronoiZoneFeature = {
            type: "Feature",
            properties: {
              poiId: correspondingPoi.id,
              cityId,
              cityName: cityFeature.properties.name,
            },
            geometry: polygon.geometry,
          };
          await writer.write(voronoiFeature);
          totalZones++;
        }
      } catch (error) {
        logger.warn(
          `[Voronoi] Erreur clip pour POI ${correspondingPoi.id} dans city ${cityId}: ${String(error)}`,
        );
        continue;
      }
    }

    citiesProcessed++;

    if (citiesProcessed % 1000 === 0) {
      logger.info(
        `[Voronoi] ${citiesProcessed} villes traitées, ${totalZones} zones générées...`,
      );
    }
  }

  await writer.close();

  const totalTime = (Date.now() - startTime) / 1000;
  logger.info(
    `[Voronoi] ✅ Terminé en ${totalTime.toFixed(1)}s : ${citiesProcessed} villes traitées, ${citiesSkipped} skippées, ${totalZones} zones Voronoi générées`,
  );
}
