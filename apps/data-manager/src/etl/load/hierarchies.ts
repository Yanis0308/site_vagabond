import { getDrizzleClient, schema } from "@vagabond/database-client";
import { type BoundaryHierarchyRow, logger } from "@vagabond/shared-utils";
import { eq } from "drizzle-orm";

import { getDbId, getSourceId } from "../id-utils";
import { JsonlFileReader } from "../jsonl-utils";
import { type JsonlHierarchyRecord } from "../types";

export async function loadHierarchiesFromJsonl(
  filePath: string,
): Promise<void> {
  const reader = new JsonlFileReader<JsonlHierarchyRecord>(filePath);
  const db = await getDrizzleClient();

  try {
    let batch: BoundaryHierarchyRow[] = [];
    const BATCH_SIZE = 1000;
    let totalProcessed = 0;

    for await (const record of reader.read()) {
      batch.push(record.data);

      if (batch.length >= BATCH_SIZE) {
        // Inline logic to use same db instance
        for (const item of batch) {
          const childId = getDbId(
            "OSM",
            getSourceId({
              osm_type: item.child_osm_type,
              osm_id: item.child_osm_id,
            }),
          );
          const parentId = getDbId(
            "OSM",
            getSourceId({
              osm_type: item.parent_osm_type,
              osm_id: item.parent_osm_id,
            }),
          );

          await db
            .update(schema.boundaries)
            .set({ parentId: parentId })
            .where(eq(schema.boundaries.id, childId));
        }
        logger.info(
          `${batch.length} relations parent-enfant mises à jour avec succès`,
        );

        totalProcessed += batch.length;
        batch = [];

        if (totalProcessed % 10000 === 0) {
          logger.info(`Hiérarchies traitées: ${totalProcessed}`);
        }
      }
    }

    // Traiter le dernier batch
    if (batch.length > 0) {
      for (const item of batch) {
        const childId = getDbId(
          "OSM",
          getSourceId({
            osm_type: item.child_osm_type,
            osm_id: item.child_osm_id,
          }),
        );
        const parentId = getDbId(
          "OSM",
          getSourceId({
            osm_type: item.parent_osm_type,
            osm_id: item.parent_osm_id,
          }),
        );

        await db
          .update(schema.boundaries)
          .set({ parentId: parentId })
          .where(eq(schema.boundaries.id, childId));
      }
      logger.info(
        `${batch.length} relations parent-enfant mises à jour avec succès`,
      );
      totalProcessed += batch.length;
    }

    logger.info(
      `Chargement hiérarchies terminé: ${totalProcessed} enregistrements`,
    );
  } catch (error) {
    logger.error(
      "Erreur lors du chargement des hiérarchies depuis JSONL:",
      error,
    );
    throw error;
  } finally {
    await reader.close();
    await db.close();
  }
}
