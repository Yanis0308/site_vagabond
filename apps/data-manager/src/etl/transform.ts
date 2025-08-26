import { type Static } from "@sinclair/typebox";
import { generateValidator, jsonSchemas, logger } from "@vagabond/shared-utils";
import dotenv from "dotenv";
import knex from "knex";

import { load } from "./load";
import { postLoad } from "./post-load";

// Parse command line arguments
function parseArgs(): { schema: string } {
  const args = process.argv.slice(2);

  const schema = args[0]?.trim() ?? "";
  if (schema === "") {
    logger.error(
      "Error - correct usage is: pnpm run transform-and-load <schema-name>",
    );
    process.exit(1);
  }

  return { schema };
}

export type ExtractedPoiDatabaseRow = Static<
  typeof jsonSchemas.ExtractedPoiDatabaseRowSchema
>;

dotenv.config();

const knexInstance = knex({
  client: "postgresql",
  connection: process.env.DATA_MANAGER_DATABASE_URL,
  pool: { min: 2, max: 100 },
});

const validateRows = generateValidator(
  jsonSchemas.ExtractedPoiDatabaseRowSchema,
);

async function transform(): Promise<void> {
  const BATCH_SIZE = 1000;
  const { schema } = parseArgs();

  logger.info(`Using database schema: ${schema}`);

  const baseSelectQuery = `SELECT
      p.osm_id,
      p.osm_type,
      p.filter_level,
      p.name,
      ST_X(ST_Transform(p.geom, 4326)) as longitude,
      ST_Y(ST_Transform(p.geom, 4326)) as latitude,
      p.tags
    FROM ${schema}.raw_pois p`;

  try {
    // Traitement par lots avec un stream
    //TODO: utiliser raw`` sans parenthèses pour SafeQL
    const stream = knexInstance
      .raw<
        Array<{
          osm_type: string;
          osm_id: string;
          name: string | null;

          longitude: unknown | null;

          latitude: unknown | null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- conflict with SafeQL
          tags: any | null;
        }>
      >(baseSelectQuery)
      .stream();

    let batch: ExtractedPoiDatabaseRow[] = [];

    for await (const row of stream) {
      if (!validateRows(row)) {
        throw new Error("Invalid rows: " + JSON.stringify(row));
      }
      batch.push(row);

      if (batch.length >= BATCH_SIZE) {
        await processBatch(batch);
        batch = [];
      }
    }

    // Traiter le dernier lot s'il en reste
    if (batch.length > 0) {
      await processBatch(batch);
    }

    await postLoad();

    logger.info("Transformation des données terminée avec succès");
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Erreur lors de la transformation:", error);
    }
    throw error;
  } finally {
    await knexInstance.destroy();
  }
}

async function processBatch(batch: ExtractedPoiDatabaseRow[]): Promise<void> {
  try {
    // send with prisma
    await load(batch);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Erreur lors du traitement du load:", error);
    }
    throw error;
  }
}

// Exécution de la transformation
transform().catch((error: unknown) => {
  logger.error(error);
  process.exit(1);
});
