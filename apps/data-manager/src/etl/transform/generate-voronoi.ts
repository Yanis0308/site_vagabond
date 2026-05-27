import * as turf from "@turf/turf";
import { getMvtIdFromPoiId, logger } from "@vagabond/shared-utils";
import { Delaunay } from "d3-delaunay";
import {
  type Feature,
  type MultiPolygon,
  type Polygon,
  type Position,
} from "geojson";
import * as martinez from "martinez-polygon-clipping";
import { cpus } from "os";
import pLimit from "p-limit";

import { getDbId, getSourceId } from "../id-utils";
import { JsonlFileReader, JsonlFileWriter } from "../jsonl-utils";
import { type JsonlAssociationRecord, type JsonlPoiRecord } from "../types";

// --- Types ---

interface VoronoiZoneProperties {
  poiId: string;
  mvtId: number;
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
  return feature.geometry.coordinates.map((coords: Position[][]) => ({
    type: "Feature" as const,
    properties: feature.properties,
    geometry: {
      type: "Polygon" as const,
      coordinates: coords,
    },
  }));
}

/** Martinez polygon coordinates: Polygon = [ring], MultiPolygon = [poly1, poly2, ...] */
type MartinezCoords = number[][][] | number[][][][];

/**
 * Clip a Voronoi cell polygon to a boundary using martinez (faster than turf/JSTS).
 * Returns array of Polygon geometries, or empty if no intersection.
 */
function clipPolygonToBoundary(
  voronoiCoords: number[][][],
  boundaryCoords: MartinezCoords,
): Array<Polygon["coordinates"]> {
  try {
    // Martinez expects Geometry (Polygon | MultiPolygon); number[][][] is compatible but TS infers number[]
    const result = martinez.intersection(
      voronoiCoords as Parameters<typeof martinez.intersection>[0],
      boundaryCoords as Parameters<typeof martinez.intersection>[1],
    );
    if (result === null || result.length === 0) return [];

    const polygons: Array<Polygon["coordinates"]> = [];
    // Martinez returns Polygon [ring1, ring2, ...] or MultiPolygon [[poly1], [poly2], ...]
    // Detect Polygon: result[0][0][0] is number (Position); MultiPolygon: result[0][0][0] is number[] (Ring)
    const first = result[0]?.[0]?.[0];
    const isPolygon = typeof first === "number";

    if (isPolygon) {
      polygons.push(result as Polygon["coordinates"]);
    } else {
      for (const poly of result as number[][][][]) {
        if (poly.length > 0 && poly[0] !== undefined && poly[0].length >= 3) {
          polygons.push(poly);
        }
      }
    }
    return polygons;
  } catch (error) {
    logger.error("Failed to clip Voronoi polygon to boundary", {
      error,
      voronoiRings: voronoiCoords.length,
    });
    return [];
  }
}

/**
 * Get boundary coordinates in martinez format (pre-computed once per city).
 * Martinez handles both Polygon and MultiPolygon natively; we pass coordinates as-is.
 */
function getBoundaryMartinezCoords(
  feature: Feature<Polygon | MultiPolygon>,
): MartinezCoords {
  return feature.geometry.coordinates;
}

// --- City processing (for parallel execution) ---

const PARALLEL_LIMIT = Math.max(1, cpus().length - 1);

interface ProcessCityResult {
  zones: VoronoiZoneFeature[];
  processed: boolean;
}

/**
 * Process a single city: compute Voronoi diagram, clip to boundary, return zones.
 * Used for parallel execution across cities.
 */
async function processCityVoronoi(
  cityId: string,
  cityFeature: CityPolygonFeature,
  poisById: Map<string, PoiInfo>,
  poiIdsInCity: Set<string>,
): Promise<ProcessCityResult> {
  const cityPois: PoiInfo[] = [];
  for (const poiId of poiIdsInCity) {
    const poi = poisById.get(poiId);
    if (poi !== undefined) {
      cityPois.push(poi);
    }
  }

  if (cityPois.length === 0) {
    return await Promise.resolve({ zones: [], processed: false });
  }

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

  const points = dedupPois.map(
    (p) => [p.longitude, p.latitude] as [number, number],
  );
  const cityBoundary: Feature<Polygon | MultiPolygon> = cityFeature;

  const rawBbox = turf.bbox(cityBoundary) as [number, number, number, number];
  const padLon = Math.max(1e-4, (rawBbox[2] - rawBbox[0]) * 0.01);
  const padLat = Math.max(1e-4, (rawBbox[3] - rawBbox[1]) * 0.01);
  const bbox: [number, number, number, number] = [
    rawBbox[0] - padLon,
    rawBbox[1] - padLat,
    rawBbox[2] + padLon,
    rawBbox[3] + padLat,
  ];

  const zones: VoronoiZoneFeature[] = [];

  if (dedupPois.length === 1) {
    const poi = dedupPois[0];
    if (poi === undefined) {
      return await Promise.resolve({ zones: [], processed: false });
    }
    const polygons = extractPolygons(cityBoundary);
    for (const polygon of polygons) {
      zones.push({
        type: "Feature",
        properties: {
          poiId: poi.id,
          mvtId: getMvtIdFromPoiId(poi.id),
          cityId,
          cityName: cityFeature.properties.name,
        },
        geometry: polygon.geometry,
      });
    }
    return await Promise.resolve({ zones, processed: true });
  }

  let voronoiFeatures: Array<{ feature: Feature<Polygon>; poiIndex: number }>;
  try {
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi(bbox);
    voronoiFeatures = [];
    for (let i = 0; i < dedupPois.length; i++) {
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
        },
        poiIndex: i,
      });
    }
  } catch (error) {
    logger.warn(
      `[Voronoi] Erreur Voronoi pour city ${cityId} (${dedupPois.length} POIs): ${String(error)}`,
    );
    logger.error(error);
    return await Promise.resolve({ zones: [], processed: false });
  }

  if (voronoiFeatures.length === 0) {
    return await Promise.resolve({ zones: [], processed: false });
  }

  // Pre-compute boundary coords in martinez format (once per city)
  const boundaryCoords = getBoundaryMartinezCoords(cityBoundary);
  const cityName = cityFeature.properties.name;

  const clipResults = voronoiFeatures.map(
    ({ feature: voronoiCell, poiIndex }): VoronoiZoneFeature[] => {
      const correspondingPoi = dedupPois[poiIndex];
      if (correspondingPoi === undefined) return [];

      const voronoiCoords = voronoiCell.geometry.coordinates;
      const clippedPolygons = clipPolygonToBoundary(
        voronoiCoords,
        boundaryCoords,
      );

      if (clippedPolygons.length === 0) {
        logger.warn(
          `[Voronoi] Intersection nulle pour POI ${correspondingPoi.id} dans city ${cityId}`,
        );
        return [];
      }

      return clippedPolygons.map((geomCoords) => ({
        type: "Feature" as const,
        properties: {
          poiId: correspondingPoi.id,
          mvtId: getMvtIdFromPoiId(correspondingPoi.id),
          cityId,
          cityName,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: geomCoords,
        },
      }));
    },
  );
  for (const zoneBatch of clipResults) {
    zones.push(...zoneBatch);
  }

  return { zones, processed: true };
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
  // Step 4 – Process cities in parallel, write zones incrementally
  // ------------------------------------------------------------------
  logger.info(
    "[Voronoi] Calcul des diagrammes Voronoi par ville (parallèle, écriture incrémentale)...",
  );

  const citiesToProcess: Array<{
    cityId: string;
    cityFeature: CityPolygonFeature;
    poiIdsInCity: Set<string>;
  }> = [];
  for (const [cityId, poiIdsInCity] of poisPerBoundary.entries()) {
    if (poiIdsInCity.size === 0) continue;
    const cityFeature = cityPolygonsMap.get(cityId);
    if (cityFeature === undefined) continue;
    citiesToProcess.push({ cityId, cityFeature, poiIdsInCity });
  }

  const totalCities = citiesToProcess.length;
  const progress = { completed: 0 };
  const limit = pLimit(PARALLEL_LIMIT);
  const writer = new JsonlFileWriter<VoronoiZoneFeature>(outputVoronoiPath);
  const BATCH_SIZE = 100; // Process N cities, write their zones, then next batch (avoids OOM)

  let citiesProcessed = 0;
  let citiesSkipped = 0;
  let totalZones = 0;

  for (let i = 0; i < citiesToProcess.length; i += BATCH_SIZE) {
    const cityBatch = citiesToProcess.slice(i, i + BATCH_SIZE);
    const results: ProcessCityResult[] = await Promise.all(
      cityBatch.map(({ cityId, cityFeature, poiIdsInCity }) =>
        limit(async () => {
          const cityStart = Date.now();
          const result = await processCityVoronoi(
            cityId,
            cityFeature,
            poisById,
            poiIdsInCity,
          );
          progress.completed += 1;
          const cityDuration = ((Date.now() - cityStart) / 1000).toFixed(2);
          const cityName = cityFeature.properties.name ?? cityId;
          logger.info(
            `[Voronoi] [${progress.completed}/${totalCities}] ${cityName} (${cityId}): ${cityDuration}s, ${result.zones.length} zones`,
          );
          return result;
        }),
      ),
    );

    citiesProcessed += results.filter((r) => r.processed).length;
    citiesSkipped += results.filter((r) => !r.processed).length;

    const batchZones = results.flatMap((r) => r.zones);
    totalZones += batchZones.length;
    await writer.writeBatch(batchZones);
  }

  await writer.close();

  const totalTime = (Date.now() - startTime) / 1000;
  logger.info(
    `[Voronoi] ✅ Terminé en ${totalTime.toFixed(1)}s : ${citiesProcessed} villes traitées, ${citiesSkipped} skippées, ${totalZones} zones Voronoi générées`,
  );
}
