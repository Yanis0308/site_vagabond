import { getPrismaExtendedClient } from "@vagabond/database-client";
import {
  LanguageEnum,
  type PoiFilterLevelEnum,
  PoiSourceEnum,
  type Prisma,
} from "@vagabond/database-client/dist/db/generated/client";
import { type CustomPoiCreateInput } from "@vagabond/database-client/dist/db/prismaExtendedClient";
import { logger } from "@vagabond/shared-utils";

import { JsonlFileReader } from "../jsonl-utils";
import { type ExtractedPoiDatabaseRow, type JsonlPoiRecord } from "../types";
import { getDbId, getSourceId } from "./index";

function getFilterLevel(item: ExtractedPoiDatabaseRow): PoiFilterLevelEnum {
  // Map numeric filter levels to enum values
  switch (item.filter_level) {
    case 1:
      return "STRICT" as PoiFilterLevelEnum;
    case 2:
      return "STANDARD" as PoiFilterLevelEnum;
    case 3:
      return "INTERMEDIATE" as PoiFilterLevelEnum;
    case 4:
      return "LAXIST" as PoiFilterLevelEnum;
    default:
      return "UNKNOWN" as PoiFilterLevelEnum;
  }
}

// Fonction originale pour les batch (conservée pour compatibilité)
export async function loadPoisAndPoiDatas(
  data: ExtractedPoiDatabaseRow[],
): Promise<void> {
  const prismaExtendedClient = getPrismaExtendedClient();
  await prismaExtendedClient.$connect();

  try {
    const poisToSave: CustomPoiCreateInput[] = [];
    const poiDatasToSave: Prisma.PoiDataUncheckedCreateInput[] = [];

    for (const item of data) {
      const sourceId = getSourceId(item);
      poisToSave.push({
        id: getDbId(PoiSourceEnum.OSM, sourceId),
        source: PoiSourceEnum.OSM,
        sourceId: sourceId,
        coords: {
          latitude: item.latitude,
          longitude: item.longitude,
        },
        filterLevel: getFilterLevel(item),
      });

      poiDatasToSave.push({
        name: item.tags.name ?? "",
        description: item.tags.description ?? "",
        rawInfo: item.tags,
        nbOfTags: Object.keys(item.tags).length,
        source: PoiSourceEnum.OSM,
        sourceId: getSourceId(item),
        language: LanguageEnum.FR,
        poiId: getDbId(PoiSourceEnum.OSM, getSourceId(item)),
      });
    }

    await prismaExtendedClient.poi.createManyCustom(poisToSave);
    await prismaExtendedClient.poiData.createMany({
      data: poiDatasToSave,
      skipDuplicates: true,
    });

    logger.info(`Lot de ${data.length} lignes inséré avec succès`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Erreur lors du traitement du lot:", error);
    }
    throw error;
  } finally {
    await prismaExtendedClient.$disconnect();
  }
}

// Nouvelle fonction pour lire depuis JSONL et charger
export async function loadPoisFromJsonl(filePath: string): Promise<void> {
  const reader = new JsonlFileReader<JsonlPoiRecord>(filePath);
  const prismaExtendedClient = getPrismaExtendedClient();
  await prismaExtendedClient.$connect();

  try {
    let batch: ExtractedPoiDatabaseRow[] = [];
    const BATCH_SIZE = 1000;
    let totalProcessed = 0;

    for await (const record of reader.read()) {
      if (record.type !== "poi") {
        logger.warn(
          `Type d'enregistrement inattendu: ${JSON.stringify(record)}`,
        );
        continue;
      }

      batch.push(record.data);

      if (batch.length >= BATCH_SIZE) {
        await loadPoisAndPoiDatas(batch);
        totalProcessed += batch.length;
        batch = [];

        if (totalProcessed % 10000 === 0) {
          logger.info(`POIs traités: ${totalProcessed}`);
        }
      }
    }

    // Traiter le dernier batch
    if (batch.length > 0) {
      await loadPoisAndPoiDatas(batch);
      totalProcessed += batch.length;
    }

    logger.info(`Chargement POIs terminé: ${totalProcessed} enregistrements`);
  } catch (error) {
    logger.error("Erreur lors du chargement des POIs depuis JSONL:", error);
    throw error;
  } finally {
    await reader.close();
    await prismaExtendedClient.$disconnect();
  }
}
