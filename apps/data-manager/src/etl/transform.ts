import { logger } from "@vagabond/shared-utils";
import * as dotenv from "dotenv";

import {
  ensureDataDirectory,
  generateTransformOutputFiles,
} from "./jsonl-utils";
import { processPoiBoundaryAssociations } from "./transform/associations";
import { processBoundaries } from "./transform/boundaries";
import { parseArgs } from "./transform/cli-args";
import { processBoundaryHierarchies } from "./transform/hierarchies";
import { processPois } from "./transform/pois";
import { knexInstance } from "./transform/stream-processor";

dotenv.config();

async function transformOnly(): Promise<void> {
  const { schema, countryCode } = parseArgs();

  logger.info(
    `Début de la transformation seule - Schema: ${schema}, Pays: ${countryCode}`,
  );

  // S'assurer que le répertoire data/ existe
  ensureDataDirectory();

  // Générer les chemins de fichiers de sortie avec timestamp
  const outputFiles = generateTransformOutputFiles(schema, countryCode);

  logger.info(`Dossier de transformation: ${outputFiles.transformDir}`);

  try {
    const startTime = Date.now();

    // Traiter les POIs
    logger.info("Début du traitement des POIs...");
    await processPois(schema, outputFiles.pois.filePath);

    // Traiter les associations POI-Boundary d'abord
    logger.info("Début du traitement des associations...");
    await processPoiBoundaryAssociations(
      schema,
      countryCode,
      outputFiles.associations.filePath,
    );

    // Traiter les hiérarchies de boundaries (pour les comptes de sous-zones)
    logger.info("Début du traitement des hiérarchies...");
    await processBoundaryHierarchies(
      schema,
      countryCode,
      outputFiles.hierarchies.filePath,
    );

    // Traiter les boundaries (avec jointure directe admin_centres et consolidation)
    // en passant les fichiers d'associations et hiérarchies pour optimiser les comptes
    logger.info("Début du traitement des boundaries...");
    await processBoundaries(
      schema,
      countryCode,
      outputFiles.boundaries.filePath,
      outputFiles.boundariesGeoJsonl,
      outputFiles.associations.filePath,
      outputFiles.hierarchies.filePath,
    );

    const totalTime = (Date.now() - startTime) / 1000;
    logger.info(
      `Transformation terminée avec succès en ${totalTime.toFixed(1)}s`,
    );

    // Afficher un résumé des fichiers générés
    logger.info("=== RÉSUMÉ DES FICHIERS GÉNÉRÉS ===");
    logger.info(`Dossier: ${outputFiles.transformDir}`);
    logger.info(`- pois.jsonl`);
    logger.info(`- boundaries.jsonl`);
    logger.info(`- associations.jsonl`);
    logger.info(`- hierarchies.jsonl`);
    logger.info(`- boundaries-country.jsonl (pour Mapbox Tileset)`);
    logger.info(`- boundaries-region.jsonl (pour Mapbox Tileset)`);
    logger.info(`- boundaries-county.jsonl (pour Mapbox Tileset)`);
    logger.info(`- boundaries-city.jsonl (pour Mapbox Tileset)`);
    logger.info(`- boundaries-district.jsonl (pour Mapbox Tileset)`);
    logger.info(`- boundaries-neighborhood.jsonl (pour Mapbox Tileset)`);
    logger.info("=======================================");
    logger.info(
      `Pour charger les données en base, exécutez: pnpm run load --transform-dir ${outputFiles.transformDir.replace("output/", "")}`,
    );
  } catch (error) {
    logger.error("Erreur lors de la transformation:", error);
    throw error;
  } finally {
    await knexInstance.destroy();
  }
}

// Exécution de la transformation seule
transformOnly().catch((error: unknown) => {
  logger.error(error);
  process.exit(1);
});
