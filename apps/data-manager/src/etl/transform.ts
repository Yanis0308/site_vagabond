import { type Static } from "@sinclair/typebox";
import { generateValidator, jsonSchemas, logger } from "@vagabond/shared-utils";
import dotenv from "dotenv";
import knex from "knex";

import { load } from "./load";
import { postLoad } from "./post-load";

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
      >(
        `SELECT 
      p.osm_id,
      p.osm_type,
      p.name,
      ST_X(ST_Transform(p.geom, 4326)) as longitude,
      ST_Y(ST_Transform(p.geom, 4326)) as latitude,
      p.tags
    FROM raw_pois p
    WHERE
    -- (osm_type <> 'R') AND
    (p.name IS NOT NULL OR p.name <> '' OR p.tags->>'wikidata' IS NOT NULL OR p.tags->>'wikipedia' IS NOT NULL)
    AND (
      (p.tags->>'leisure' = 'park')
      OR (
        (p.tags->>'tourism' IN ('attraction', 'museum', 'zoo', 'monument', 'artwork'))
        OR p.tags->>'wikidata' IS NOT NULL 
        OR p.tags->>'wikipedia' IS NOT NULL
      )
      OR (
        (p.tags->>'historic' IN ('memorial', 'yes', 'castle', 'monument'))
        OR p.tags->>'wikidata' IS NOT NULL 
        OR p.tags->>'wikipedia' IS NOT NULL
      )
      OR (p.tags->>'amenity' = 'place_of_worship')
    )
    `,
      )
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
