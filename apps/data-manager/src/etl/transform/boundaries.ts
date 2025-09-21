import { logger } from "@vagabond/shared-utils";

import { JsonlFileWriter } from "../jsonl-utils";
import {
  type ConsolidatedBoundaryRow,
  type JsonlBoundaryRecord,
} from "../types";
import { knexInstance, processStreamInBatches } from "./stream-processor";

export async function processBoundaries(
  schema: string,
  countryCode: string,
  outputFilePath: string,
): Promise<void> {
  const writer = new JsonlFileWriter<JsonlBoundaryRecord>(outputFilePath);
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
        b.geom,
        b.admin_centre_members,
        b.tags,
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

    // Type pour les données de boundary avec géométrie native
    interface BoundaryRowFromDB {
      osm_id: string;
      osm_type: string;
      name: string | null;
      admin_level: number;
      geom: unknown;
      admin_centre_members: string | null;
      tags: Record<string, string>;
      admin_centre_name: null;
      admin_centre_place_type: null;
      admin_centre_longitude: null;
      admin_centre_latitude: null;
      admin_centre_population: null;
      admin_centre_is_capital: null;
      admin_centre_importance_score: null;
      admin_centre_tags: null;
    }

    // Validation fonction pour les données avec géométrie native
    const validateBoundaryRows = (row: unknown): row is BoundaryRowFromDB => {
      return (
        typeof row === "object" &&
        row !== null &&
        "osm_id" in row &&
        "osm_type" in row &&
        "admin_level" in row &&
        "geom" in row
      );
    };

    // Wrapper optimisé qui convertit en batch SQL et écrit en JSONL
    const writeBoundariesWithGeomConversion = async (
      data: BoundaryRowFromDB[],
    ): Promise<void> => {
      logger.info(`Conversion batch de ${data.length} géométries...`);
      const startTime = Date.now();

      // Conversion en batch SQL plus efficace
      const osmIds = data
        .map((item) => `'${item.osm_type}-${item.osm_id}'`)
        .join(",");

      const geomConversions = await knexInstance.raw<{
        rows: Array<{ key: string; geom_json: string }>;
      }>(`
        SELECT 
          osm_type || '-' || osm_id as key,
          ST_AsGeoJSON(ST_Transform(geom, 4326)) as geom_json
        FROM ${schema}.boundaries 
        WHERE osm_type || '-' || osm_id IN (${osmIds})
      `);

      // Créer un map pour lookup rapide
      const geomMap = new Map<string, string>();
      geomConversions.rows.forEach((row) => {
        geomMap.set(row.key, row.geom_json);
      });

      const convertedData: ConsolidatedBoundaryRow[] = data.map((item) => ({
        ...item,
        geom_json: geomMap.get(`${item.osm_type}-${item.osm_id}`) ?? "{}",
      }));

      const elapsed = (Date.now() - startTime) / 1000;
      logger.info(`Conversion terminée en ${elapsed.toFixed(1)}s`);

      // Écrire en JSONL au lieu de charger en DB
      for (const boundary of convertedData) {
        const record: JsonlBoundaryRecord = {
          type: "boundary",
          data: boundary,
          countryCode,
        };
        await writer.write(record);
      }
    };

    await processStreamInBatches(
      `BOUNDARIES CHUNK ${chunk + 1}/${totalChunks}`,
      query,
      validateBoundaryRows,
      writeBoundariesWithGeomConversion,
    );
  }

  try {
    // Aucune opération supplémentaire nécessaire ici
  } finally {
    await writer.close();
  }
}
