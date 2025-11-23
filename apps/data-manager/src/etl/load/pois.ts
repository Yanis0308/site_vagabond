import {
  type CustomPoiCreateInput,
  getDrizzleClient,
  PoiRepository,
  schema,
} from "@vagabond/database-client";
import { logger } from "@vagabond/shared-utils";

import { JsonlFileReader } from "../jsonl-utils";
import { type ExtractedPoiDatabaseRow, type JsonlPoiRecord } from "../types";
import { getDbId, getSourceId } from "./index";

function getFilterLevel(
  item: ExtractedPoiDatabaseRow,
): "UNKNOWN" | "STRICT" | "STANDARD" | "INTERMEDIATE" | "LAXIST" {
  // Map numeric filter levels to enum values
  switch (item.filter_level) {
    case 1:
      return "STRICT";
    case 2:
      return "STANDARD";
    case 3:
      return "INTERMEDIATE";
    case 4:
      return "LAXIST";
    default:
      return "UNKNOWN";
  }
}

// Fonction originale pour les batch (conservée pour compatibilité)
export async function loadPoisAndPoiDatas(
  data: ExtractedPoiDatabaseRow[],
): Promise<void> {
  const db = await getDrizzleClient();

  try {
    const poisToSave: CustomPoiCreateInput[] = [];
    const poiDatasToSave: (typeof schema.poiData.$inferInsert)[] = [];

    for (const item of data) {
      const sourceId = getSourceId(item);
      poisToSave.push({
        id: getDbId("OSM", sourceId),
        source: "OSM",
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
        source: "OSM",
        sourceId: getSourceId(item),
        language: "FR",
        poiId: getDbId("OSM", getSourceId(item)),
      });
    }

    await new PoiRepository(db).createManyCustom(poisToSave);
    await db
      .insert(schema.poiData)
      .values(poiDatasToSave)
      .onConflictDoNothing();

    logger.info(`Lot de ${data.length} lignes inséré avec succès`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Erreur lors du traitement du lot:", error);
    }
    throw error;
  } finally {
    await db.close();
  }
}

// Nouvelle fonction pour lire depuis JSONL et charger
export async function loadPoisFromJsonl(filePath: string): Promise<void> {
  const reader = new JsonlFileReader<JsonlPoiRecord>(filePath);
  // We don't need to connect/disconnect here as loadPoisAndPoiDatas handles it per batch
  // But creating a client per batch is inefficient.
  // Refactoring to create client once.
  const db = await getDrizzleClient();

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
        // Inline logic to use same db instance
        const poisToSave: CustomPoiCreateInput[] = [];
        const poiDatasToSave: (typeof schema.poiData.$inferInsert)[] = [];

        for (const item of batch) {
          const sourceId = getSourceId(item);
          poisToSave.push({
            id: getDbId("OSM", sourceId),
            source: "OSM",
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
            source: "OSM",
            sourceId: getSourceId(item),
            language: "FR",
            poiId: getDbId("OSM", getSourceId(item)),
          });
        }

        await new PoiRepository(db).createManyCustom(poisToSave);
        await db
          .insert(schema.poiData)
          .values(poiDatasToSave)
          .onConflictDoNothing();

        logger.info(`Lot de ${batch.length} lignes inséré avec succès`);

        totalProcessed += batch.length;
        batch = [];

        if (totalProcessed % 10000 === 0) {
          logger.info(`POIs traités: ${totalProcessed}`);
        }
      }
    }

    // Traiter le dernier batch
    if (batch.length > 0) {
      const poisToSave: CustomPoiCreateInput[] = [];
      const poiDatasToSave: (typeof schema.poiData.$inferInsert)[] = [];

      for (const item of batch) {
        const sourceId = getSourceId(item);
        poisToSave.push({
          id: getDbId("OSM", sourceId),
          source: "OSM",
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
          source: "OSM",
          sourceId: getSourceId(item),
          language: "FR",
          poiId: getDbId("OSM", getSourceId(item)),
        });
      }

      await new PoiRepository(db).createManyCustom(poisToSave);
      await db
        .insert(schema.poiData)
        .values(poiDatasToSave)
        .onConflictDoNothing();

      totalProcessed += batch.length;
    }

    logger.info(`Chargement POIs terminé: ${totalProcessed} enregistrements`);
  } catch (error) {
    logger.error("Erreur lors du chargement des POIs depuis JSONL:", error);
    throw error;
  } finally {
    await reader.close();
    await db.close();
  }
}
