import { logger } from "@vagabond/shared-utils";
import * as dotenv from "dotenv";
import * as fs from "fs";

import { getTransformFiles, listAvailableTransformDirs } from "./jsonl-utils";
import { loadAssociationsFromJsonl } from "./load/associations";
import { loadBoundariesFromJsonl } from "./load/boundaries";
import { loadHierarchiesFromJsonl } from "./load/hierarchies";
import { loadPoisFromJsonl } from "./load/pois";

dotenv.config();

interface LoadDbOptions {
  transformDir?: string;
}

function parseLoadDbArgs(): LoadDbOptions {
  const args = process.argv.slice(2);
  const options: LoadDbOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--transform-dir":
        options.transformDir = nextArg;
        i++;
        break;
    }
  }

  return options;
}

function validateFileExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier JSONL non trouvé: ${filePath}`);
  }
}

async function loadDbOnly(): Promise<void> {
  const options = parseLoadDbArgs();

  logger.info(
    "Début du chargement en base de données depuis les fichiers JSONL",
  );

  if (
    options.transformDir === null ||
    options.transformDir === undefined ||
    options.transformDir === ""
  ) {
    logger.error("Dossier de transformation requis avec --transform-dir");
    logger.info("Dossiers disponibles dans output/:");
    const available = listAvailableTransformDirs();
    if (available.length === 0) {
      logger.info("  (aucun)");
    } else {
      available.forEach((dir) => logger.info(`  ${dir}`));
    }
    logger.info(
      "\n📖 Consultez le README.md pour plus d'informations sur l'usage",
    );
    throw new Error("Dossier de transformation requis");
  }

  const transformDir = options.transformDir;
  logger.info(`Utilisation du dossier spécifié: ${transformDir}`);

  // Obtenir les fichiers depuis le dossier
  const filesToLoad = getTransformFiles(transformDir);

  // Valider l'existence des fichiers
  Object.entries(filesToLoad).forEach(([, path]) => {
    validateFileExists(path);
  });

  logger.info("Fichiers à charger en base:");
  Object.entries(filesToLoad).forEach(([fileType, path]) => {
    logger.info(`  ${fileType}: ${path}`);
  });

  try {
    const startTime = Date.now();

    // Charger dans l'ordre recommandé pour éviter les violations de contraintes FK

    // 1. POIs (aucune dépendance)
    logger.info("Chargement des POIs...");
    await loadPoisFromJsonl(filesToLoad.pois);

    // 2. Boundaries (aucune dépendance directe)
    logger.info("Chargement des boundaries...");
    await loadBoundariesFromJsonl(filesToLoad.boundaries);

    // 3. Associations POI-Boundary (dépend de POIs et Boundaries)
    logger.info("Chargement des associations...");
    await loadAssociationsFromJsonl(filesToLoad.associations);

    // 4. Hiérarchies (dépend de Boundaries)
    logger.info("Chargement des hiérarchies...");
    await loadHierarchiesFromJsonl(filesToLoad.hierarchies);

    const totalTime = (Date.now() - startTime) / 1000;
    logger.info(
      `Chargement en base terminé avec succès en ${totalTime.toFixed(1)}s`,
    );
  } catch (error) {
    logger.error("Erreur lors du chargement en base:", error);
    throw error;
  }
}

// Exécution du chargement en base seul
loadDbOnly().catch((error: unknown) => {
  logger.error(error);
  process.exit(1);
});
