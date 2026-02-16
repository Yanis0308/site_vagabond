import { logger } from "@vagabond/shared-utils";
import * as dotenv from "dotenv";

import {
  ensureDataDirectory,
  generateTransformOutputFiles,
} from "./jsonl-utils";
import { processPoiBoundaryAssociations } from "./transform/associations";
import { processBoundaries } from "./transform/boundaries";
import { parseArgs } from "./transform/cli-args";
import { generateVoronoiZones } from "./transform/generate-voronoi";
import { processBoundaryHierarchies } from "./transform/hierarchies";
import { generatePoisGeoJSON, processPois } from "./transform/pois";
import { knexInstance } from "./transform/stream-processor";

dotenv.config();

async function transformOnly(): Promise<void> {
  const { schema, countryCode, voronoiOnly, transformDir } = parseArgs();

  if (voronoiOnly) {
    logger.info("Mode Voronoi Only activé");
  }

  logger.info(
    `Début de la transformation${voronoiOnly ? " (Voronoi Unique)" : ""} - Schema: ${schema}, Pays: ${countryCode}`,
  );

  // S'assurer que le répertoire data/ existe
  ensureDataDirectory();

  // En voronoi-only: réutiliser le dossier fourni (lecture inputs + écriture output)
  // Sinon: créer un nouveau dossier
  const existingDir: string | undefined =
    voronoiOnly && typeof transformDir === "string" && transformDir !== ""
      ? transformDir.replace(/^output\//, "")
      : undefined;
  const outputFiles = generateTransformOutputFiles(
    schema,
    countryCode,
    existingDir,
  );

  logger.info(`Dossier de transformation: ${outputFiles.transformDir}`);

  try {
    const startTime = Date.now();

    if (!voronoiOnly) {
      // Traiter les POIs
      logger.info("Début du traitement des POIs...");
      await processPois(schema, outputFiles.pois.filePath);

      // Générer le fichier GeoJSON des POIs pour Mapbox
      logger.info("Génération du fichier GeoJSON des POIs...");
      await generatePoisGeoJSON(
        outputFiles.pois.filePath,
        outputFiles.poisGeoJsonl.filePath,
      );

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
        outputFiles.boundariesPolygonsGeoJsonl,
      );
    }

    // Générer les zones Voronoi pré-calculées pour le tileset POIs
    // Toujours exécuté (soit dans le flux complet, soit en voronoiOnly)
    logger.info("Génération des zones Voronoi...");
    await generateVoronoiZones(
      outputFiles.pois.filePath,
      outputFiles.associations.filePath,
      outputFiles.boundariesPolygonsGeoJsonl.city.filePath,
      outputFiles.voronoiGeoJsonl.filePath,
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
    logger.info(`- pois.jsonl (GeoJSON pour Mapbox Tileset)`);
    logger.info(`- voronoi-zones.jsonl (Voronoi zones pour Mapbox Tileset)`);
    logger.info(`- boundaries-country.jsonl (points pour Mapbox Tileset)`);
    logger.info(`- boundaries-region.jsonl (points pour Mapbox Tileset)`);
    logger.info(`- boundaries-county.jsonl (points pour Mapbox Tileset)`);
    logger.info(`- boundaries-city.jsonl (points pour Mapbox Tileset)`);
    logger.info(`- boundaries-district.jsonl (points pour Mapbox Tileset)`);
    logger.info(`- boundaries-neighborhood.jsonl (points pour Mapbox Tileset)`);
    logger.info(
      `- boundaries-polygons-country.jsonl (polygones pour Mapbox Tileset)`,
    );
    logger.info(
      `- boundaries-polygons-region.jsonl (polygones pour Mapbox Tileset)`,
    );
    logger.info(
      `- boundaries-polygons-county.jsonl (polygones pour Mapbox Tileset)`,
    );
    logger.info(
      `- boundaries-polygons-city.jsonl (polygones pour Mapbox Tileset)`,
    );
    logger.info(
      `- boundaries-polygons-district.jsonl (polygones pour Mapbox Tileset)`,
    );
    logger.info(
      `- boundaries-polygons-neighborhood.jsonl (polygones pour Mapbox Tileset)`,
    );
    logger.info("=======================================");
    logger.info(
      `Pour charger les données en base, exécutez: pnpm run load-db --transform-dir ${outputFiles.transformDir.replace("output/", "")}`,
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
