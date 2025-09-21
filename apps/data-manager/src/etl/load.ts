import { logger } from "@vagabond/shared-utils";
import * as dotenv from "dotenv";
import * as fs from "fs";

import {
  getLatestTransformDir,
  getTransformFiles,
  listAvailableTransformDirs,
} from "./jsonl-utils";
import { loadAssociationsFromJsonl } from "./load/associations";
import { loadBoundariesFromJsonl } from "./load/boundaries";
import { loadHierarchiesFromJsonl } from "./load/hierarchies";
import { loadPoisFromJsonl } from "./load/pois";
import { postLoad } from "./post-load";

dotenv.config();

interface LoadOptions {
  transformDir?: string;
  autoDetect?: boolean;
}

function parseLoadArgs(): LoadOptions {
  const args = process.argv.slice(2);
  const options: LoadOptions = {
    autoDetect: true, // Par défaut, auto-détection
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--transform-dir":
        options.transformDir = nextArg;
        options.autoDetect = false;
        i++;
        break;
      case "--no-auto-detect":
        options.autoDetect = false;
        break;
      case "--help":
        logger.info(`
Usage: pnpm run load [options]

Options:
  --transform-dir <dir> Dossier de transformation à charger
  --no-auto-detect     Désactiver la détection automatique
  --help               Afficher cette aide

Exemples:
  pnpm run load                                           # Auto-détection du dossier le plus récent
  pnpm run load --transform-dir schema_FR_2023-12-01-10-30-00
`);
        process.exit(0);
    }
  }

  return options;
}

function validateFileExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier JSONL non trouvé: ${filePath}`);
  }
}

async function loadOnly(): Promise<void> {
  const options = parseLoadArgs();

  logger.info("Début du chargement depuis les fichiers JSONL");

  let transformDir: string;

  if (options.autoDetect) {
    // Auto-détection du dossier le plus récent
    const latestDir = getLatestTransformDir();

    if (latestDir === null || latestDir === undefined || latestDir === "") {
      logger.error(
        "Aucun dossier de transformation trouvé pour l'auto-détection",
      );
      logger.info("Dossiers disponibles dans data/:");
      const available = listAvailableTransformDirs();
      if (available.length === 0) {
        logger.info("  (aucun)");
      } else {
        available.forEach((dir) => logger.info(`  ${dir}`));
      }
      throw new Error("Auto-détection échouée - aucun dossier trouvé");
    }

    transformDir = latestDir;
    logger.info(`Auto-détection réussie. Dossier détecté: ${transformDir}`);
  } else {
    // Utiliser le dossier spécifié explicitement
    if (
      options.transformDir === null ||
      options.transformDir === undefined ||
      options.transformDir === ""
    ) {
      throw new Error("Dossier de transformation requis avec --transform-dir");
    }

    transformDir = options.transformDir;
    logger.info(`Utilisation du dossier spécifié: ${transformDir}`);
  }

  // Obtenir les fichiers depuis le dossier
  const filesToLoad = getTransformFiles(transformDir);

  // Valider l'existence des fichiers
  Object.entries(filesToLoad).forEach(([, path]) => {
    validateFileExists(path);
  });

  logger.info("Fichiers à charger:");
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

    // 5. Post-traitement (comme dans l'ETL original)
    logger.info("Exécution du post-traitement...");
    await postLoad();

    const totalTime = (Date.now() - startTime) / 1000;
    logger.info(`Chargement terminé avec succès en ${totalTime.toFixed(1)}s`);
  } catch (error) {
    logger.error("Erreur lors du chargement:", error);
    throw error;
  }
}

// Exécution du chargement seul
loadOnly().catch((error: unknown) => {
  logger.error(error);
  process.exit(1);
});
