import { generateValidator } from "@vagabond/shared-utils";
import { jsonSchemas } from "@vagabond/shared-utils";

import { getSupportedAdminLevelsSQL } from "../boundary-mapping-config";
import { JsonlFileWriter } from "../jsonl-utils";
import {
  type JsonlAssociationRecord,
  type PoiBoundaryAssociation,
} from "../types";
import { processStreamInBatches } from "./stream-processor";

const validatePoiBoundaryAssociations = generateValidator(
  jsonSchemas.PoiBoundaryAssociationSchema,
);

export async function processPoiBoundaryAssociations(
  schema: string,
  countryCode: string,
  outputFilePath: string,
): Promise<void> {
  const writer = new JsonlFileWriter<JsonlAssociationRecord>(outputFilePath);
  // Get supported admin levels for this country
  const supportedLevels = getSupportedAdminLevelsSQL(countryCode);

  const query = `SELECT 
      p.osm_id as poi_osm_id,
      p.osm_type as poi_osm_type,
      b.osm_id as boundary_osm_id, 
      b.osm_type as boundary_osm_type
    FROM ${schema}.raw_pois p
    JOIN ${schema}.boundaries b ON ST_Within(p.geom, b.geom)
    WHERE b.admin_level IN ${supportedLevels}`;

  // Fonction pour écrire les associations en JSONL
  const writeAssociationBatch = async (
    data: PoiBoundaryAssociation[],
  ): Promise<void> => {
    for (const association of data) {
      const record: JsonlAssociationRecord = {
        type: "association",
        data: association,
        countryCode,
      };
      await writer.write(record);
    }
  };

  try {
    await processStreamInBatches(
      "POI-BOUNDARY ASSOCIATIONS",
      query,
      validatePoiBoundaryAssociations,
      writeAssociationBatch,
    );
  } finally {
    await writer.close();
  }
}
