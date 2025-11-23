import { getDrizzleClient, schema } from "@vagabond/database-client";
import { eq } from "drizzle-orm";
import { logger } from "@vagabond/shared-utils";

import { JsonlFileReader } from "../jsonl-utils";
import { type BoundaryHierarchyRow, type JsonlHierarchyRecord } from "../types";
import { getDbId, getSourceId } from "./index";

// Fonction originale pour les batch (conservée pour compatibilité)
export async function updateBoundaryParents(
  data: BoundaryHierarchyRow[],
): Promise<void> {
  const db = await getDrizzleClient();

  try {
    for (const item of data) {
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
      `${data.length} relations parent-enfant mises à jour avec succès`,
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        "Erreur lors de la mise à jour des relations parent-enfant:",
        error,
      );
    }
    throw error;
  } finally {
    await db.close();
  }
}

// Nouvelle fonction pour lire depuis JSONL et charger
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
      if (record.type !== "hierarchy") {
        logger.warn(
          `Type d'enregistrement inattendu: ${JSON.stringify(record)}`,
        );
        continue;
      }

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
