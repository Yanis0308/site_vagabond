import {
  type ExtractedPoiDatabaseRow,
  ExtractedPoiDatabaseRowSchema,
  getFilterLevelName,
  logger,
  validateWithSchema,
} from "@vagabond/shared-utils";
import { type Feature, type Point } from "geojson";

import { getDbId, getSourceId } from "../id-utils";
import { JsonlFileReader, JsonlFileWriter } from "../jsonl-utils";
import { type JsonlPoiRecord } from "../types";
import { processStreamInBatches } from "./stream-processor";

const validateRows = (value: unknown): value is ExtractedPoiDatabaseRow =>
  validateWithSchema(ExtractedPoiDatabaseRowSchema, value);

export async function processPois(
  schema: string,
  outputFilePath: string,
): Promise<void> {
  const writer = new JsonlFileWriter<JsonlPoiRecord>(outputFilePath);

  const query = `SELECT 
      p.osm_id,
      p.osm_type,
      p.filter_level,
      p.name,
      ST_X(ST_Transform(p.geom, 4326)) as longitude,
      ST_Y(ST_Transform(p.geom, 4326)) as latitude,
      p.main_category,
      p.categories,
      p.tags
    FROM ${schema}.raw_pois p`;

  // Fonction pour écrire les POIs en JSONL au lieu de les charger en DB
  const writePoiBatch = async (
    data: ExtractedPoiDatabaseRow[],
  ): Promise<void> => {
    for (const poi of data) {
      // Compute ID and add it to the data
      const sourceId = getSourceId({
        osm_type: poi.osm_type,
        osm_id: poi.osm_id,
      });
      const id = getDbId("OSM", sourceId);

      const record: JsonlPoiRecord = {
        type: "poi",
        data: {
          id, // Add computed ID to the data
          ...poi,
        },
      };
      await writer.write(record);
    }
  };

  try {
    await processStreamInBatches("POIs", query, validateRows, writePoiBatch);
  } finally {
    await writer.close();
  }
}

// Types for GeoJSON export (Mapbox tileset)
interface PoiGeoJSONProperties {
  poiId: string;
  name: string | null;
  filterLevel: string;
  mainCategory: string;
  categories: string;
}

type PoiGeoJSONFeature = Feature<Point, PoiGeoJSONProperties>;

/**
 * Generate GeoJSON file from POI JSONL for Mapbox upload
 */
export async function generatePoisGeoJSON(
  inputJsonlPath: string,
  outputGeoJsonPath: string,
): Promise<void> {
  const reader = new JsonlFileReader<JsonlPoiRecord>(inputJsonlPath);
  const writer = new JsonlFileWriter<PoiGeoJSONFeature>(outputGeoJsonPath);

  try {
    let count = 0;

    for await (const record of reader.read()) {
      const poi = record.data;

      // Create GeoJSON Feature
      const feature: PoiGeoJSONFeature = {
        type: "Feature",
        properties: {
          poiId: poi.id,
          name: poi.tags.name ?? null,
          filterLevel: getFilterLevelName(poi.filter_level),
          mainCategory: poi.main_category,
          categories: JSON.stringify(poi.categories),
        },
        geometry: {
          type: "Point",
          coordinates: [poi.longitude, poi.latitude],
        },
      };

      await writer.write(feature);
      count++;

      if (count % 10000 === 0) {
        logger.info(`GeoJSON POIs generated: ${count}`);
      }
    }

    logger.info(`GeoJSON generation completed: ${count} POIs`);
  } catch (error) {
    logger.error("Error generating POI GeoJSON:", error);
    throw error;
  } finally {
    await reader.close();
    await writer.close();
  }
}
