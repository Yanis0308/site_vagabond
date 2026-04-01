import { getDrizzleClient, schema } from "@vagabond/database-client";
import { logger } from "@vagabond/shared-utils";
import { sql } from "drizzle-orm";

import { getBoundaryLevel } from "../boundary-mapping-config";
import { getDbId, getSourceId } from "../id-utils";
import { JsonlFileReader } from "../jsonl-utils";
import {
  type ConsolidatedBoundaryRow,
  type JsonlBoundaryRecord,
} from "../types";

function getPlaceTypeFromAdminLevel(adminLevel: number): string {
  // Map admin levels to place types
  switch (adminLevel) {
    case 2:
      return "country";
    case 4:
      return "state";
    case 6:
      return "county";
    case 8:
      return "city";
    case 10:
      return "suburb";
    default:
      return "locality";
  }
}

// Fonction originale pour les batch (conservée pour compatibilité)
export async function loadBoundariesConsolidated(
  data: ConsolidatedBoundaryRow[],
  countryCode = "DEFAULT",
): Promise<void> {
  const db = await getDrizzleClient();

  try {
    for (const item of data) {
      const computedId = getDbId(
        "OSM",
        getSourceId({
          osm_type: item.osm_type,
          osm_id: item.osm_id,
        }),
      );

      const boundaryLevelEnum = getBoundaryLevel(item.admin_level, countryCode);

      if (boundaryLevelEnum === null) {
        logger.info(
          `Skipping boundary ${item.osm_type}-${item.osm_id} with unsupported admin_level ${item.admin_level} for country ${countryCode}`,
        );
        continue;
      }

      // Utiliser way_area pré-calculé depuis l'étape Transform
      const wayArea = item.way_area;

      // Déterminer le place_type selon l'admin_level ou depuis admin_centre
      const placeType =
        item.admin_centre_place_type ??
        getPlaceTypeFromAdminLevel(item.admin_level);

      // Utiliser les données admin_centre si disponibles, sinon calculer des fallbacks
      let displayPoint: string | null = null;
      let population: number | null = null;
      let isCapital = false;
      let importanceScore: number;

      if (
        typeof item.admin_centre_longitude === "number" &&
        typeof item.admin_centre_latitude === "number"
      ) {
        // Utiliser les données de l'admin_centre
        const pointResult = await db.execute(
          sql`SELECT ST_AsGeoJSON(ST_SetSRID(ST_MakePoint(${item.admin_centre_longitude}, ${item.admin_centre_latitude}), 4326)) as point`,
        );
        displayPoint =
          (pointResult.rows[0] as { point: string } | undefined)?.point ?? null;
        population = item.admin_centre_population ?? null;
        isCapital = item.admin_centre_is_capital ?? false;
        importanceScore = item.admin_centre_importance_score ?? 0.5;

        logger.info(
          `Using admin_centre data for boundary ${computedId}: ${item.admin_centre_name ?? "unknown"}`,
        );
      } else {
        // Pas d'admin_centre, utiliser le centroïde calculé dans l'étape Transform
        const pointResult = await db.execute(
          sql`SELECT ST_AsGeoJSON(ST_SetSRID(ST_MakePoint(${item.display_point_lon}, ${item.display_point_lat}), 4326)) as point`,
        );
        displayPoint =
          (pointResult.rows[0] as { point: string } | undefined)?.point ?? null;

        // Importance par défaut basée sur l'admin_level
        importanceScore =
          item.admin_level <= 4
            ? 0.8
            : item.admin_level <= 6
              ? 0.6
              : item.admin_level <= 8
                ? 0.4
                : 0.2;
      }

      // Si la population n'est pas définie par l'admin_centre,
      // essayer de la récupérer depuis les tags de la boundary elle-même.
      if (population === null && item.tags.population !== undefined) {
        const parsedPopulation = parseInt(item.tags.population, 10);
        if (!isNaN(parsedPopulation)) {
          population = parsedPopulation;
        }
      }

      // De même pour 'is_capital', vérifier les tags de la boundary
      // si l'info n'est pas dans l'admin_centre.
      if (!isCapital && item.tags.capital !== undefined) {
        isCapital = true;
      }

      // S'assurer que les valeurs non-nullables ont des valeurs par défaut
      const finalPopulation = population ?? 0;

      if (displayPoint !== null) {
        // Insérer dans la table boundaries avec toutes les données consolidées
        await db
          .insert(schema.boundaries)
          .values({
            id: computedId,
            name: item.name,
            boundaryLevel: boundaryLevelEnum,
            rawInfo: item.tags,
            displayPoint: sql`ST_GeomFromGeoJSON(${displayPoint})`,
            placeType: placeType,
            population: finalPopulation,
            isCapital: isCapital,
            importanceScore: importanceScore,
            wayArea: wayArea,
          })
          .onConflictDoUpdate({
            target: schema.boundaries.id,
            set: {
              name: item.name,
              boundaryLevel: boundaryLevelEnum,
              rawInfo: item.tags,
              displayPoint: sql`ST_GeomFromGeoJSON(${displayPoint})`,
              placeType: placeType,
              population: finalPopulation,
              isCapital: isCapital,
              importanceScore: importanceScore,
              wayArea: wayArea,
              updatedAt: new Date(),
            },
          });
      }
    }

    logger.info(`Lot de ${data.length} boundaries inséré avec succès`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Erreur lors du traitement du lot de boundaries:", error);
    }
    throw error;
  } finally {
    await db.close();
  }
}

// Nouvelle fonction pour lire depuis JSONL et charger
export async function loadBoundariesFromJsonl(filePath: string): Promise<void> {
  const reader = new JsonlFileReader<JsonlBoundaryRecord>(filePath);
  const db = await getDrizzleClient();

  try {
    let batch: Array<{ data: ConsolidatedBoundaryRow; countryCode: string }> =
      [];
    const BATCH_SIZE = 500; // Plus petit batch à cause des géométries
    let totalProcessed = 0;

    for await (const record of reader.read()) {
      batch.push({ data: record.data, countryCode: record.countryCode });

      if (batch.length >= BATCH_SIZE) {
        // Groupe par countryCode pour traiter ensemble
        const grouped = new Map<string, ConsolidatedBoundaryRow[]>();
        for (const item of batch) {
          if (!grouped.has(item.countryCode)) {
            grouped.set(item.countryCode, []);
          }
          const countryBoundaries = grouped.get(item.countryCode);
          if (countryBoundaries !== undefined) {
            countryBoundaries.push(item.data);
          }
        }

        // Charger chaque groupe
        for (const countryCode of Array.from(grouped.keys())) {
          const boundaries = grouped.get(countryCode);
          if (boundaries !== undefined) {
            await loadBoundariesConsolidated(boundaries, countryCode);
          }
        }

        totalProcessed += batch.length;
        batch = [];

        if (totalProcessed % 5000 === 0) {
          logger.info(`Boundaries traitées: ${totalProcessed}`);
        }
      }
    }

    // Traiter le dernier batch
    if (batch.length > 0) {
      const grouped = new Map<string, ConsolidatedBoundaryRow[]>();
      for (const item of batch) {
        if (!grouped.has(item.countryCode)) {
          grouped.set(item.countryCode, []);
        }
        const countryBoundaries = grouped.get(item.countryCode);
        if (countryBoundaries !== undefined) {
          countryBoundaries.push(item.data);
        }
      }

      for (const countryCode of Array.from(grouped.keys())) {
        const boundaries = grouped.get(countryCode);
        if (boundaries !== undefined) {
          await loadBoundariesConsolidated(boundaries, countryCode);
        }
      }
      totalProcessed += batch.length;
    }

    logger.info(
      `Chargement boundaries terminé: ${totalProcessed} enregistrements`,
    );
  } catch (error) {
    logger.error(
      "Erreur lors du chargement des boundaries depuis JSONL:",
      error,
    );
    throw error;
  } finally {
    await reader.close();
    await db.close();
  }
}
