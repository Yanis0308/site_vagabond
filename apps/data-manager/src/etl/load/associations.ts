import { getPrismaExtendedClient } from "@vagabond/database-client";
import {
  PoiSourceEnum,
  type Prisma,
} from "@vagabond/database-client/dist/db/generated/client";
import { logger } from "@vagabond/shared-utils";

import { JsonlFileReader } from "../jsonl-utils";
import {
  type JsonlAssociationRecord,
  type PoiBoundaryAssociation,
} from "../types";
import { getDbId, getSourceId } from "./index";

// Fonction originale pour les batch (conservée pour compatibilité)
export async function loadPoiBoundaryAssociations(
  data: PoiBoundaryAssociation[],
): Promise<void> {
  const prismaExtendedClient = getPrismaExtendedClient();
  await prismaExtendedClient.$connect();

  try {
    const insertData: Prisma.PoiBoundaryCreateManyInput[] = data.map((item) => {
      const poiId = getDbId(
        PoiSourceEnum.OSM,
        getSourceId({
          osm_type: item.poi_osm_type,
          osm_id: item.poi_osm_id,
        }),
      );
      const boundaryId = getDbId(
        PoiSourceEnum.OSM,
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

    await prismaExtendedClient.poiBoundary.createMany({
      data: insertData,
      skipDuplicates: true,
    });

    logger.info(
      `Lot de ${data.length} associations POI-Boundary inséré avec succès`,
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        "Erreur lors du traitement du lot d'associations POI-Boundary:",
        error,
      );
    }
    throw error;
  } finally {
    await prismaExtendedClient.$disconnect();
  }
}

// Nouvelle fonction pour lire depuis JSONL et charger
export async function loadAssociationsFromJsonl(
  filePath: string,
): Promise<void> {
  const reader = new JsonlFileReader<JsonlAssociationRecord>(filePath);
  const prismaExtendedClient = getPrismaExtendedClient();
  await prismaExtendedClient.$connect();

  try {
    let batch: PoiBoundaryAssociation[] = [];
    const BATCH_SIZE = 1000;
    let totalProcessed = 0;

    for await (const record of reader.read()) {
      if (record.type !== "association") {
        logger.warn(
          `Type d'enregistrement inattendu: ${JSON.stringify(record)}`,
        );
        continue;
      }

      batch.push(record.data);

      if (batch.length >= BATCH_SIZE) {
        await loadPoiBoundaryAssociations(batch);
        totalProcessed += batch.length;
        batch = [];

        if (totalProcessed % 10000 === 0) {
          logger.info(`Associations traitées: ${totalProcessed}`);
        }
      }
    }

    // Traiter le dernier batch
    if (batch.length > 0) {
      await loadPoiBoundaryAssociations(batch);
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
    await prismaExtendedClient.$disconnect();
  }
}
