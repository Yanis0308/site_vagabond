import { generateValidator, jsonSchemas, logger } from "@vagabond/shared-utils";
import * as fs from "fs";
import { dirname } from "path";

import {
  getAllFallbackParentLevels,
  getParentLevelMappings,
} from "../boundary-mapping-config";
import { JsonlFileWriter } from "../jsonl-utils";
import { type BoundaryHierarchyRow, type JsonlHierarchyRecord } from "../types";
import { knexInstance } from "./stream-processor";

const MAX_IDS_PER_QUERY = 2000;

const validateBoundaryHierarchyRows = generateValidator(
  jsonSchemas.BoundaryHierarchyRowSchema,
);

export async function processBoundaryHierarchies(
  schema: string,
  countryCode: string,
  outputFilePath: string,
): Promise<void> {
  const levelMappings = getParentLevelMappings(countryCode);

  if (levelMappings.length === 0) {
    const dir = dirname(outputFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFilePath, "", "utf8");
    return;
  }

  const writer = new JsonlFileWriter<JsonlHierarchyRecord>(outputFilePath);

  try {
    logger.info("Début du traitement BOUNDARY HIERARCHIES");
    const startTime = Date.now();

    const buildHierarchyQuery = (
      childLevel: number,
      parentLevel: number,
      childIds?: string[],
    ): string => {
      const idsToFilter =
        childIds !== undefined && childIds.length > 0 ? childIds : null;
      const childFilter =
        idsToFilter !== null
          ? `AND child.osm_id IN (${idsToFilter.map((id) => `'${id}'`).join(",")})`
          : "";
      return `
      SELECT DISTINCT ON (child_osm_id) child_osm_id, child_osm_type, parent_osm_id, parent_osm_type
      FROM (
        SELECT
          child.osm_id as child_osm_id,
          child.osm_type as child_osm_type,
          parent.osm_id as parent_osm_id,
          parent.osm_type as parent_osm_type
        FROM ${schema}.boundaries child
        JOIN ${schema}.boundaries parent ON
          parent.admin_level = ${parentLevel}
          AND child.admin_level = ${childLevel}
          AND ST_Contains(
            parent.geom,
            COALESCE(child.point_on_surface, ST_PointOnSurface(child.geom))
          )
          ${childFilter}
      ) sub
      ORDER BY child_osm_id, parent_osm_id
    `;
    };

    const runQueryChunked = async (
      childLevel: number,
      parentLevel: number,
      childIds: string[],
    ): Promise<BoundaryHierarchyRow[]> => {
      const chunkSize = MAX_IDS_PER_QUERY;
      const chunks: string[][] = [];
      for (let i = 0; i < childIds.length; i += chunkSize) {
        chunks.push(childIds.slice(i, i + chunkSize));
      }
      const chunkResults = await Promise.all(
        chunks.map(async (chunk) => {
          const { rows }: { rows: BoundaryHierarchyRow[] } =
            await knexInstance.raw(
              buildHierarchyQuery(childLevel, parentLevel, chunk),
            );
          for (const row of rows) {
            if (!validateBoundaryHierarchyRows(row)) {
              throw new Error(
                `Invalid BOUNDARY HIERARCHIES row: ${JSON.stringify(row)}`,
              );
            }
          }
          return rows;
        }),
      );
      return chunkResults.flat();
    };

    const getChildIdsAtLevel = async (
      childLevel: number,
    ): Promise<string[]> => {
      const { rows }: { rows: Array<{ osm_id: string }> } =
        await knexInstance.raw(
          `SELECT osm_id FROM ${schema}.boundaries WHERE admin_level = ${childLevel}`,
        );
      return rows.map((r) => r.osm_id);
    };

    const queryPromises = levelMappings.map(
      async ({ childLevel, parentLevel }): Promise<BoundaryHierarchyRow[]> => {
        const childIds = await getChildIdsAtLevel(childLevel);
        if (childIds.length === 0) {
          return [];
        }

        const primaryRows = await runQueryChunked(
          childLevel,
          parentLevel,
          childIds,
        );
        const childrenWithParent = new Set(
          primaryRows.map((r) => r.child_osm_id),
        );
        let orphans = childIds.filter((id) => !childrenWithParent.has(id));
        const allRows: BoundaryHierarchyRow[] = [...primaryRows];

        if (orphans.length === 0) {
          return allRows;
        }

        const fallbackLevels = getAllFallbackParentLevels(
          parentLevel,
          countryCode,
        );
        for (const fallbackLevel of fallbackLevels) {
          const fallbackRows = await runQueryChunked(
            childLevel,
            fallbackLevel,
            orphans,
          );
          for (const row of fallbackRows) {
            const childId = row.child_osm_id;
            if (!childrenWithParent.has(childId)) {
              childrenWithParent.add(childId);
              allRows.push(row);
            }
          }
          orphans = orphans.filter((id) => !childrenWithParent.has(id));
          if (orphans.length === 0) {
            break;
          }
        }

        return allRows;
      },
    );

    const resultsArrays = await Promise.all(queryPromises);
    const allRows = resultsArrays.flat();

    // Write in batches
    const BATCH_SIZE = 1000;
    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const batch = allRows.slice(i, i + BATCH_SIZE);
      const records: JsonlHierarchyRecord[] = batch.map((data) => ({
        type: "hierarchy",
        data,
        countryCode,
      }));
      await Promise.all(records.map((r) => writer.write(r)));

      const processed = Math.min(i + BATCH_SIZE, allRows.length);
      if (processed % 10000 === 0 || processed === allRows.length) {
        const elapsed = (Date.now() - startTime) / 1000;
        logger.info(
          `BOUNDARY HIERARCHIES: ${processed} lignes traitées en ${elapsed.toFixed(1)}s`,
        );
      }
    }

    const totalTime = (Date.now() - startTime) / 1000;
    logger.info(
      `Traitement BOUNDARY HIERARCHIES terminé avec succès: ${allRows.length} lignes en ${totalTime.toFixed(1)}s`,
    );
  } finally {
    await writer.close();
  }
}
