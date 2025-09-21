import { getPrismaExtendedClient } from "@vagabond/database-client";
import { PoiSourceEnum } from "@vagabond/database-client/dist/db/generated/client";
import { logger } from "@vagabond/shared-utils";

import { JsonlFileReader } from "../jsonl-utils";
import { type BoundaryHierarchyRow, type JsonlHierarchyRecord } from "../types";
import { getDbId, getSourceId } from "./index";

// Fonction originale pour les batch (conservée pour compatibilité)
export async function updateBoundaryParents(
  data: BoundaryHierarchyRow[],
): Promise<void> {
  const prismaExtendedClient = getPrismaExtendedClient();
  await prismaExtendedClient.$connect();

  try {
    for (const item of data) {
      const childId = getDbId(
        PoiSourceEnum.OSM,
        getSourceId({
          osm_type: item.child_osm_type,
          osm_id: item.child_osm_id,
        }),
      );
      const parentId = getDbId(
        PoiSourceEnum.OSM,
        getSourceId({
          osm_type: item.parent_osm_type,
          osm_id: item.parent_osm_id,
        }),
      );

      await prismaExtendedClient.boundary.update({
        where: { id: childId },
        data: { parentId: parentId },
      });
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
    await prismaExtendedClient.$disconnect();
  }
}

// Nouvelle fonction pour lire depuis JSONL et charger
export async function loadHierarchiesFromJsonl(
  filePath: string,
): Promise<void> {
  const reader = new JsonlFileReader<JsonlHierarchyRecord>(filePath);
  const prismaExtendedClient = getPrismaExtendedClient();
  await prismaExtendedClient.$connect();

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
        await updateBoundaryParents(batch);
        totalProcessed += batch.length;
        batch = [];

        if (totalProcessed % 10000 === 0) {
          logger.info(`Hiérarchies traitées: ${totalProcessed}`);
        }
      }
    }

    // Traiter le dernier batch
    if (batch.length > 0) {
      await updateBoundaryParents(batch);
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
    await prismaExtendedClient.$disconnect();
  }
}
