import {
  type CustomPoiCreateInput,
  getDrizzleClient,
  PoiRepository,
  schema,
} from "@vagabond/database-client";
import { getFilterLevelName, logger } from "@vagabond/shared-utils";

import { getSourceId } from "../id-utils";
import { JsonlFileReader } from "../jsonl-utils";
import { type JsonlPoiRecord } from "../types";

export async function loadPoisFromJsonl(filePath: string): Promise<void> {
  const reader = new JsonlFileReader<JsonlPoiRecord>(filePath);
  const db = await getDrizzleClient();

  try {
    let batch: Array<JsonlPoiRecord["data"]> = [];
    const BATCH_SIZE = 1000;
    let totalProcessed = 0;

    for await (const record of reader.read()) {
      batch.push(record.data);

      if (batch.length >= BATCH_SIZE) {
        // Inline logic to use same db instance
        const poisToSave: CustomPoiCreateInput[] = [];
        const poiDatasToSave: Array<typeof schema.poiData.$inferInsert> = [];

        for (const item of batch) {
          // Use ID from JSONL if available, otherwise compute it
          const sourceId = getSourceId(item);
          const id = item.id;

          poisToSave.push({
            id: id,
            source: "OSM",
            sourceId: sourceId,
            coords: {
              latitude: item.latitude,
              longitude: item.longitude,
            },
            filterLevel: getFilterLevelName(item.filter_level),
          });

          poiDatasToSave.push({
            name: item.tags.name ?? "",
            description: item.tags.description ?? "",
            rawInfo: item.tags,
            nbOfTags: Object.keys(item.tags).length,
            source: "OSM",
            sourceId: sourceId,
            language: "FR",
            poiId: id,
            mainCategory: item.main_category,
            categories: item.categories,
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
      const poiDatasToSave: Array<typeof schema.poiData.$inferInsert> = [];

      for (const item of batch) {
        // Use ID from JSONL if available, otherwise compute it
        const sourceId = getSourceId(item);
        const id = item.id;

        poisToSave.push({
          id: id,
          source: "OSM",
          sourceId: sourceId,
          coords: {
            latitude: item.latitude,
            longitude: item.longitude,
          },
          filterLevel: getFilterLevelName(item.filter_level),
        });

        poiDatasToSave.push({
          name: item.tags.name ?? "",
          description: item.tags.description ?? "",
          rawInfo: item.tags,
          nbOfTags: Object.keys(item.tags).length,
          source: "OSM",
          sourceId: sourceId,
          language: "FR",
          poiId: id,
          mainCategory: item.main_category,
          categories: item.categories,
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
