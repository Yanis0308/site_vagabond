import { generateValidator } from "@vagabond/shared-utils";
import { jsonSchemas } from "@vagabond/shared-utils";

import { getSupportedAdminLevelsSQL } from "../boundary-mapping-config";
import { JsonlFileWriter } from "../jsonl-utils";
import { type BoundaryHierarchyRow, type JsonlHierarchyRecord } from "../types";
import { processStreamInBatches } from "./stream-processor";

const validateBoundaryHierarchyRows = generateValidator(
  jsonSchemas.BoundaryHierarchyRowSchema,
);

export async function processBoundaryHierarchies(
  schema: string,
  countryCode: string,
  outputFilePath: string,
): Promise<void> {
  const writer = new JsonlFileWriter<JsonlHierarchyRecord>(outputFilePath);
  // Get supported admin levels for this country
  const supportedLevels = getSupportedAdminLevelsSQL(countryCode);

  // Requête optimisée pour trouver les relations parent-enfant
  // Version simplifiée sans CTEs pour permettre l'early termination et améliorer les performances
  const query = `WITH PotentialParents AS (
      -- Étape 1 : On trouve tous les couples (enfant, parent) possibles.
      -- C'est la partie la plus coûteuse, mais on ne la fait qu'une seule fois.
      SELECT 
        child.osm_id as child_osm_id,
        child.osm_type as child_osm_type,
        child.admin_level as child_admin_level,
        child.geom as child_geom,
        parent.osm_id as parent_osm_id,
        parent.osm_type as parent_osm_type,
        parent.admin_level as parent_admin_level
      FROM ${schema}.boundaries child
      JOIN ${schema}.boundaries parent ON 
        parent.admin_level < child.admin_level
        AND ST_Contains(parent.geom, ST_PointOnSurface(child.geom))
      WHERE 
        child.admin_level IN ${supportedLevels}
        AND parent.admin_level IN ${supportedLevels}
    ),
    RankedParents AS (
      -- Étape 2 : Pour chaque enfant, on classe ses parents potentiels.
      -- Le parent "direct" est celui qui a le plus grand admin_level inférieur à celui de l'enfant.
      -- On lui assigne donc le rang N°1.
      SELECT
        *,
        ROW_NUMBER() OVER(PARTITION BY child_osm_id ORDER BY parent_admin_level DESC) as rn
      FROM PotentialParents
    )
    -- Étape 3 : On ne garde que les parents directs (ceux de rang 1).
    SELECT 
      child_osm_id,
      child_osm_type,
      parent_osm_id,
      parent_osm_type
    FROM RankedParents
    WHERE rn = 1;`;

  // Fonction pour écrire les hiérarchies en JSONL
  const writeHierarchyBatch = async (
    data: BoundaryHierarchyRow[],
  ): Promise<void> => {
    for (const hierarchy of data) {
      const record: JsonlHierarchyRecord = {
        type: "hierarchy",
        data: hierarchy,
        countryCode,
      };
      await writer.write(record);
    }
  };

  try {
    await processStreamInBatches(
      "BOUNDARY HIERARCHIES",
      query,
      validateBoundaryHierarchyRows,
      writeHierarchyBatch,
    );
  } finally {
    await writer.close();
  }
}
