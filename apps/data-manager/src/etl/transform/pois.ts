import { generateValidator } from "@vagabond/shared-utils";
import { jsonSchemas } from "@vagabond/shared-utils";

import { JsonlFileWriter } from "../jsonl-utils";
import { type ExtractedPoiDatabaseRow, type JsonlPoiRecord } from "../types";
import { processStreamInBatches } from "./stream-processor";

const validateRows = generateValidator(
  jsonSchemas.ExtractedPoiDatabaseRowSchema,
);

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
      p.tags
    FROM ${schema}.raw_pois p`;

  // Fonction pour écrire les POIs en JSONL au lieu de les charger en DB
  const writePoiBatch = async (
    data: ExtractedPoiDatabaseRow[],
  ): Promise<void> => {
    for (const poi of data) {
      const record: JsonlPoiRecord = {
        type: "poi",
        data: poi,
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
