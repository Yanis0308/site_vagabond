import { logger } from "@vagabond/shared-utils";
import knex from "knex";

import { type BatchProcessorFunction, type ValidatorFunction } from "../types";

// Instance knex partagée
export const knexInstance = knex({
  client: "postgresql",
  connection: process.env.DATA_MANAGER_DATABASE_URL,
  pool: { min: 2, max: 100 },
});

// Fonction générique pour traiter un stream en batch
export async function processStreamInBatches<TRow, TBatch>(
  processName: string,
  query: string,
  validator: ValidatorFunction<TRow>,
  batchProcessor: BatchProcessorFunction<TBatch>,
): Promise<void> {
  logger.info(`Début du traitement ${processName}`);
  const BATCH_SIZE = 1000;
  let processedCount = 0;
  const startTime = Date.now();

  try {
    // Configurer le timeout séparément
    await knexInstance.raw(`SET statement_timeout = '10min'`);
    const stream = knexInstance.raw(query).stream();
    let batch: TBatch[] = [];

    for await (const row of stream) {
      if (!validator(row)) {
        throw new Error(`Invalid ${processName} row: ${JSON.stringify(row)}`);
      }

      batch.push(row as unknown as TBatch);
      processedCount++;

      if (batch.length >= BATCH_SIZE) {
        await batchProcessor(batch);
        batch = [];

        // Log progress pour les gros traitements
        if (processedCount % 10000 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          logger.info(
            `${processName}: ${processedCount} lignes traitées en ${elapsed.toFixed(1)}s`,
          );
        }
      }
    }

    // Traiter le dernier lot s'il en reste
    if (batch.length > 0) {
      await batchProcessor(batch);
    }

    const totalTime = (Date.now() - startTime) / 1000;
    logger.info(
      `Traitement ${processName} terminé avec succès: ${processedCount} lignes en ${totalTime.toFixed(1)}s`,
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Erreur lors du traitement ${processName}:`, error);
    }
    throw error;
  }
}
