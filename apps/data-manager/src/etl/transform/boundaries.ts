import { logger } from "@vagabond/shared-utils";
import { type Feature, type MultiPolygon, type Point } from "geojson";

import { JsonlFileReader, JsonlFileWriter } from "../jsonl-utils";
import {
  type ConsolidatedBoundaryRow,
  type JsonlAssociationRecord,
  type JsonlBoundaryRecord,
  type JsonlHierarchyRecord,
} from "../types";
import { knexInstance, processStreamInBatches } from "./stream-processor";

// Types pour l'export GeoJSON avec types GeoJSON standards
interface BoundaryProperties {
  id: string;
  name: string | null;
  boundary_level: string;
  place_type: string;
  population: number;
  is_capital: boolean;
  importance_score: number;
  way_area: number;
  parent_id: string | null;
  pois_count: number;
  subzones_count: number;
  raw_info: Record<string, unknown>;
}

type BoundaryGeoJSONFeature = Feature<
  Point,
  Omit<BoundaryProperties, "raw_info">
>;

type BoundaryPolygonGeoJSONFeature = Feature<
  MultiPolygon,
  Omit<BoundaryProperties, "raw_info">
>;

// Fonctions utilitaires pour l'export GeoJSON
function mapAdminLevelToBoundaryLevel(adminLevel: number): string {
  switch (adminLevel) {
    case 2:
      return "COUNTRY";
    case 4:
      return "REGION";
    case 6:
      return "COUNTY";
    case 8:
      return "CITY";
    case 9:
      return "DISTRICT";
    case 10:
      return "NEIGHBORHOOD";
    default:
      return "UNKNOWN";
  }
}

// Fonction pour obtenir la tolérance de simplification selon le niveau
function getSimplificationTolerance(boundaryLevel: string): number {
  switch (boundaryLevel) {
    case "COUNTRY":
      return 0.01;
    case "REGION":
      return 0.005;
    case "COUNTY":
      return 0.001;
    case "CITY":
      return 0.0005;
    case "DISTRICT":
      return 0.0001;
    case "NEIGHBORHOOD":
      return 0.00005;
    default:
      return 0.001;
  }
}

function determinePlaceType(boundaryData: ConsolidatedBoundaryRow): string {
  // Utiliser les tags OSM pour déterminer le type de lieu
  const tags = boundaryData.tags;
  return tags.place ?? tags.place_type ?? "unknown";
}

function calculateImportanceScore(
  boundaryData: ConsolidatedBoundaryRow,
): number {
  const tags = boundaryData.tags;
  const parsedImportance = Number.parseFloat(tags.importance ?? "0");
  return (
    boundaryData.admin_centre_importance_score ??
    (Number.isNaN(parsedImportance) ? 0 : parsedImportance)
  );
}

function determineFinalPopulation(
  boundaryData: ConsolidatedBoundaryRow,
): number {
  const tags = boundaryData.tags;
  const parsedPopulation = Number.parseInt(tags.population ?? "0", 10);
  return (
    boundaryData.admin_centre_population ??
    (Number.isNaN(parsedPopulation) ? 0 : parsedPopulation)
  );
}

function determineIsCapital(boundaryData: ConsolidatedBoundaryRow): boolean {
  const tags = boundaryData.tags;
  return (
    boundaryData.admin_centre_is_capital ??
    (tags.capital === "yes" || tags.admin_centre === "yes" || false)
  );
}

export async function processBoundaries(
  schema: string,
  countryCode: string,
  outputFilePath: string,
  jsonlOutputPaths: {
    country: { filePath: string };
    region: { filePath: string };
    county: { filePath: string };
    city: { filePath: string };
    district: { filePath: string };
    neighborhood: { filePath: string };
  },
  associationsFilePath: string,
  hierarchiesFilePath: string,
  polygonOutputPaths: {
    country: { filePath: string };
    region: { filePath: string };
    county: { filePath: string };
    city: { filePath: string };
    district: { filePath: string };
    neighborhood: { filePath: string };
  },
): Promise<void> {
  const writer = new JsonlFileWriter<JsonlBoundaryRecord>(outputFilePath);

  // Lire les associations POI-boundaries pour compter les POIs par boundary
  const poisCountGlobal = new Map<string, number>();
  logger.info("Lecture des associations POI-boundaries...");
  try {
    const reader = new JsonlFileReader<JsonlAssociationRecord>(
      associationsFilePath,
    );
    for await (const record of reader.read()) {
      const boundaryId = `${record.data.boundary_osm_type}-${record.data.boundary_osm_id}`;
      const currentCount = poisCountGlobal.get(boundaryId) ?? 0;
      poisCountGlobal.set(boundaryId, currentCount + 1);
    }
    await reader.close();
    logger.info(
      `Associations chargées: ${poisCountGlobal.size} boundaries avec POIs`,
    );
  } catch (error) {
    logger.warn(
      `Impossible de lire les associations: ${String(error)}. POIs counts seront à 0.`,
    );
  }

  // Lire les hiérarchies pour compter les sous-zones par boundary parent
  const subzonesCountGlobal = new Map<string, number>();
  logger.info("Lecture des hiérarchies pour compter les sous-zones...");
  try {
    const reader = new JsonlFileReader<JsonlHierarchyRecord>(
      hierarchiesFilePath,
    );
    for await (const record of reader.read()) {
      const parentId = `${record.data.parent_osm_type}-${record.data.parent_osm_id}`;
      const currentCount = subzonesCountGlobal.get(parentId) ?? 0;
      subzonesCountGlobal.set(parentId, currentCount + 1);
    }
    await reader.close();
    logger.info(
      `Hiérarchies chargées: ${subzonesCountGlobal.size} boundaries avec sous-zones`,
    );
  } catch (error) {
    logger.warn(
      `Impossible de lire les hiérarchies: ${String(error)}. Subzones counts seront à 0.`,
    );
  }

  // Writers pour les fichiers JSONL par niveau
  const jsonlWriters: Record<
    string,
    JsonlFileWriter<BoundaryGeoJSONFeature>
  > = {
    COUNTRY: new JsonlFileWriter<BoundaryGeoJSONFeature>(
      jsonlOutputPaths.country.filePath,
    ),
    REGION: new JsonlFileWriter<BoundaryGeoJSONFeature>(
      jsonlOutputPaths.region.filePath,
    ),
    COUNTY: new JsonlFileWriter<BoundaryGeoJSONFeature>(
      jsonlOutputPaths.county.filePath,
    ),
    CITY: new JsonlFileWriter<BoundaryGeoJSONFeature>(
      jsonlOutputPaths.city.filePath,
    ),
    DISTRICT: new JsonlFileWriter<BoundaryGeoJSONFeature>(
      jsonlOutputPaths.district.filePath,
    ),
    NEIGHBORHOOD: new JsonlFileWriter<BoundaryGeoJSONFeature>(
      jsonlOutputPaths.neighborhood.filePath,
    ),
  };

  // Writers pour les fichiers JSONL des polygones par niveau
  const polygonWriters: Record<
    string,
    JsonlFileWriter<BoundaryPolygonGeoJSONFeature>
  > = {
    COUNTRY: new JsonlFileWriter<BoundaryPolygonGeoJSONFeature>(
      polygonOutputPaths.country.filePath,
    ),
    REGION: new JsonlFileWriter<BoundaryPolygonGeoJSONFeature>(
      polygonOutputPaths.region.filePath,
    ),
    COUNTY: new JsonlFileWriter<BoundaryPolygonGeoJSONFeature>(
      polygonOutputPaths.county.filePath,
    ),
    CITY: new JsonlFileWriter<BoundaryPolygonGeoJSONFeature>(
      polygonOutputPaths.city.filePath,
    ),
    DISTRICT: new JsonlFileWriter<BoundaryPolygonGeoJSONFeature>(
      polygonOutputPaths.district.filePath,
    ),
    NEIGHBORHOOD: new JsonlFileWriter<BoundaryPolygonGeoJSONFeature>(
      polygonOutputPaths.neighborhood.filePath,
    ),
  };

  logger.info("Diagnostic: comptage des boundaries...");
  const countResult = await knexInstance.raw<{
    rows: Array<{ count: string }>;
  }>(`SELECT COUNT(*) FROM ${schema}.boundaries`);
  const totalCount = parseInt(countResult.rows[0]?.count ?? "0");
  logger.info(`Total boundaries: ${totalCount}`);

  // Traitement par chunks de 15k pour éviter les timeouts
  const CHUNK_SIZE = 15000;
  const totalChunks = Math.ceil(totalCount / CHUNK_SIZE);

  logger.info(
    `Traitement en ${totalChunks} chunks de ${CHUNK_SIZE} boundaries`,
  );

  for (let chunk = 0; chunk < totalChunks; chunk++) {
    const offset = chunk * CHUNK_SIZE;
    logger.info(
      `Chunk ${chunk + 1}/${totalChunks} : ${offset} à ${offset + CHUNK_SIZE}`,
    );

    const query = `
      SELECT 
        b.osm_id,
        b.osm_type,
        b.name,
        b.admin_level,
        b.admin_centre_members,
        b.tags,
        -- Coordonnées du centroïde pour GeoJSON
        ST_Y(ST_Transform(ST_PointOnSurface(b.geom), 4326)) as display_point_lat,
        ST_X(ST_Transform(ST_PointOnSurface(b.geom), 4326)) as display_point_lon,
        -- Pas de JOIN admin_centres pour l'instant
        NULL as admin_centre_name,
        NULL as admin_centre_place_type,
        NULL as admin_centre_longitude,
        NULL as admin_centre_latitude,
        NULL as admin_centre_population,
        NULL as admin_centre_is_capital,
        NULL as admin_centre_importance_score,
        NULL as admin_centre_tags
      FROM ${schema}.boundaries b
      ORDER BY b.admin_level, b.osm_id
      LIMIT ${CHUNK_SIZE} OFFSET ${offset}
    `;

    // Type pour les données de boundary sans géométrie
    interface BoundaryRowFromDB {
      osm_id: string;
      osm_type: string;
      name: string | null;
      admin_level: number;
      admin_centre_members: string | null;
      tags: Record<string, string>;
      display_point_lat: number;
      display_point_lon: number;
      admin_centre_name: null;
      admin_centre_place_type: null;
      admin_centre_longitude: null;
      admin_centre_latitude: null;
      admin_centre_population: null;
      admin_centre_is_capital: null;
      admin_centre_importance_score: null;
      admin_centre_tags: null;
    }

    // Validation fonction pour les données de boundary
    const validateBoundaryRows = (row: unknown): row is BoundaryRowFromDB => {
      return (
        typeof row === "object" &&
        row !== null &&
        "osm_id" in row &&
        "osm_type" in row &&
        "admin_level" in row &&
        "display_point_lat" in row &&
        "display_point_lon" in row
      );
    };

    // Wrapper optimisé qui convertit les données et écrit en JSONL avec calcul way_area
    const writeBoundariesOptimized = async (
      data: BoundaryRowFromDB[],
    ): Promise<void> => {
      logger.info(`Traitement batch de ${data.length} boundaries...`);
      const startTime = Date.now();

      // Calculer way_area en batch pour toutes les géométries
      const osmIds = data
        .map((item) => `'${item.osm_type}-${item.osm_id}'`)
        .join(",");

      const wayAreaCalculations = await knexInstance.raw<{
        rows: Array<{ key: string; area: number }>;
      }>(`
        SELECT 
          osm_type || '-' || osm_id as key,
          ST_Area(ST_Transform(geom, 4326)::geography) as area
        FROM ${schema}.boundaries 
        WHERE osm_type || '-' || osm_id IN (${osmIds})
      `);

      // Créer un map pour lookup rapide des aires
      const areaMap = new Map<string, number>();
      wayAreaCalculations.rows.forEach((row) => {
        areaMap.set(row.key, row.area);
      });

      // Utiliser les POIs et subzones counts pré-calculés depuis les fichiers JSONL
      // (beaucoup plus rapide que les requêtes géospatiales)

      const convertedData: ConsolidatedBoundaryRow[] = data.map((item) => ({
        ...item,
        display_point_lat: item.display_point_lat,
        display_point_lon: item.display_point_lon,
        way_area: areaMap.get(`${item.osm_type}-${item.osm_id}`) ?? 0,
      }));

      const elapsed = (Date.now() - startTime) / 1000;
      logger.info(`Traitement terminé en ${elapsed.toFixed(1)}s`);

      // Écrire en JSONL au lieu de charger en DB
      for (let i = 0; i < convertedData.length; i++) {
        const boundary = convertedData[i];
        const originalData = data[i];

        if (boundary === undefined || originalData === undefined) {
          continue;
        }

        const record: JsonlBoundaryRecord = {
          type: "boundary",
          data: boundary,
          countryCode,
        };
        await writer.write(record);

        // Générer feature JSONL
        const boundaryLevel = mapAdminLevelToBoundaryLevel(
          originalData.admin_level,
        );
        const levelWriter = jsonlWriters[boundaryLevel];
        if (levelWriter !== undefined) {
          const placeType = determinePlaceType(boundary);
          const importanceScore = calculateImportanceScore(boundary);
          const finalPopulation = determineFinalPopulation(boundary);
          const isCapital = determineIsCapital(boundary);

          const computedId = `${boundary.osm_type}-${boundary.osm_id}`;

          // Utiliser way_area pré-calculé depuis la géométrie
          const wayArea = boundary.way_area;

          const jsonlFeature: BoundaryGeoJSONFeature = {
            type: "Feature",
            properties: {
              id: computedId,
              name: boundary.name,
              boundary_level: boundaryLevel,
              place_type: placeType,
              population: finalPopulation,
              is_capital: isCapital,
              importance_score: importanceScore,
              way_area: wayArea,
              parent_id: null, // Sera mis à jour dans l'étape hierarchies
              pois_count: poisCountGlobal.get(computedId) ?? 0,
              subzones_count: subzonesCountGlobal.get(computedId) ?? 0,
            },
            geometry: {
              type: "Point",
              coordinates: [
                originalData.display_point_lon,
                originalData.display_point_lat,
              ],
            },
          };

          await levelWriter.write(jsonlFeature);
        }

        // Générer feature polygonale JSONL
        const polygonWriter = polygonWriters[boundaryLevel];
        if (polygonWriter !== undefined) {
          const placeType = determinePlaceType(boundary);
          const importanceScore = calculateImportanceScore(boundary);
          const finalPopulation = determineFinalPopulation(boundary);
          const isCapital = determineIsCapital(boundary);
          const computedId = `${boundary.osm_type}-${boundary.osm_id}`;
          const wayArea = boundary.way_area;
          const tolerance = getSimplificationTolerance(boundaryLevel);

          // Extraire la géométrie simplifiée depuis la base de données
          // Forcer la conversion en MultiPolygon pour assurer la compatibilité
          const simplifiedGeometryResult = await knexInstance.raw<{
            rows: Array<{ simplified_geom: unknown }>;
          }>(`
            SELECT ST_AsGeoJSON(
              ST_Multi(
                ST_SimplifyPreserveTopology(
                  ST_Transform(geom, 4326), 
                  ${tolerance}
                )
              )
            ) as simplified_geom
            FROM ${schema}.boundaries 
            WHERE osm_type = '${boundary.osm_type}' AND osm_id = '${boundary.osm_id}'
          `);

          if (
            simplifiedGeometryResult.rows.length > 0 &&
            simplifiedGeometryResult.rows[0]?.simplified_geom !== null &&
            simplifiedGeometryResult.rows[0]?.simplified_geom !== undefined
          ) {
            try {
              const geometryData = JSON.parse(
                simplifiedGeometryResult.rows[0].simplified_geom as string,
              ) as MultiPolygon;

              const polygonFeature: BoundaryPolygonGeoJSONFeature = {
                type: "Feature",
                properties: {
                  id: computedId,
                  name: boundary.name,
                  boundary_level: boundaryLevel,
                  place_type: placeType,
                  population: finalPopulation,
                  is_capital: isCapital,
                  importance_score: importanceScore,
                  way_area: wayArea,
                  parent_id: null, // Sera mis à jour dans l'étape hierarchies
                  pois_count: poisCountGlobal.get(computedId) ?? 0,
                  subzones_count: subzonesCountGlobal.get(computedId) ?? 0,
                },
                geometry: geometryData,
              };

              await polygonWriter.write(polygonFeature);
            } catch (error) {
              logger.warn(
                `Erreur parsing géométrie pour ${computedId}: ${String(error)}`,
              );
            }
          }
        }
      }
    };

    await processStreamInBatches(
      `BOUNDARIES CHUNK ${chunk + 1}/${totalChunks}`,
      query,
      validateBoundaryRows,
      writeBoundariesOptimized,
    );
  }

  try {
    // Fermer les writers JSONL points
    for (const [level, levelWriter] of Object.entries(jsonlWriters)) {
      await levelWriter.close();
      const featuresCount = levelWriter.getWrittenCount();
      logger.info(
        `Export JSONL points ${level}: ${featuresCount} features exportées`,
      );
    }

    // Fermer les writers polygonaux
    for (const [level, polygonWriter] of Object.entries(polygonWriters)) {
      await polygonWriter.close();
      const featuresCount = polygonWriter.getWrittenCount();
      logger.info(
        `Export JSONL polygons ${level}: ${featuresCount} features exportées`,
      );
    }
  } finally {
    await writer.close();
  }
}
