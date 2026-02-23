import { getDrizzleClient, schema } from "@vagabond/database-client";
import { logger, type PoiBoundaryAssociation } from "@vagabond/shared-utils";

import { getDbId, getSourceId } from "../id-utils";
import { JsonlFileReader } from "../jsonl-utils";
import { type JsonlAssociationRecord } from "../types";

export async function loadAssociationsFromJsonl(
  filePath: string,
): Promise<void> {
  const reader = new JsonlFileReader<JsonlAssociationRecord>(filePath);
  const db = await getDrizzleClient();

  try {
    let batch: PoiBoundaryAssociation[] = [];
    const BATCH_SIZE = 1000;
    let totalProcessed = 0;

    for await (const record of reader.read()) {
      batch.push(record.data);

      if (batch.length >= BATCH_SIZE) {
        // Inline logic to use same db instance
        const insertData: Array<typeof schema.poiBoundaries.$inferInsert> =
          batch.map((item) => {
            const poiId = getDbId(
              "OSM",
              getSourceId({
                osm_type: item.poi_osm_type,
                osm_id: item.poi_osm_id,
              }),
            );
            const boundaryId = getDbId(
              "OSM",
              getSourceId({
                osm_type: item.boundary_osm_type,
                osm_id: item.boundary_osm_id,
              }),
            );

            return {
              poiId: poiId,
              boundaryId: boundaryId,
            };
          });

        await db
          .insert(schema.poiBoundaries)
          .values(insertData)
          .onConflictDoNothing();

        logger.info(
          `Lot de ${batch.length} associations POI-Boundary inséré avec succès`,
        );

        totalProcessed += batch.length;
        batch = [];

        if (totalProcessed % 10000 === 0) {
          logger.info(`Associations traitées: ${totalProcessed}`);
        }
      }
    }

    // Traiter le dernier batch
    if (batch.length > 0) {
      const insertData: Array<typeof schema.poiBoundaries.$inferInsert> =
        batch.map((item) => {
          const poiId = getDbId(
            "OSM",
            getSourceId({
              osm_type: item.poi_osm_type,
              osm_id: item.poi_osm_id,
            }),
          );
          const boundaryId = getDbId(
            "OSM",
            getSourceId({
              osm_type: item.boundary_osm_type,
              osm_id: item.boundary_osm_id,
            }),
          );

          return {
            poiId: poiId,
            boundaryId: boundaryId,
          };
        });

      await db
        .insert(schema.poiBoundaries)
        .values(insertData)
        .onConflictDoNothing();

      totalProcessed += batch.length;
    }

    logger.info(
      `Chargement associations terminé: ${totalProcessed} enregistrements`,
    );
  } catch (error) {
    logger.error(
      "Erreur lors du chargement des associations depuis JSONL:",
      error,
    );
    throw error;
  } finally {
    await reader.close();
    await db.close();
  }
}
