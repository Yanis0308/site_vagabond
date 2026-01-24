#!/usr/bin/env zx

import "zx/globals";

// Enable verbose output for commands
$.verbose = true;

// Parse command line arguments
function parseArgs() {
  const options = {
    transformDir: null,
  };

  if (argv["transform-dir"]) {
    options.transformDir = argv["transform-dir"];
  }

  return options;
}

// Validate environment variables
function validateEnvironment() {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  const username = process.env.MAPBOX_USERNAME;

  if (!token) {
    console.error("❌ Variable d'environnement MAPBOX_ACCESS_TOKEN requise");
    console.log("Configurez avec: export MAPBOX_ACCESS_TOKEN=your_token");
    process.exit(1);
  }

  if (!username) {
    console.error("❌ Variable d'environnement MAPBOX_USERNAME requise");
    console.log("Configurez avec: export MAPBOX_USERNAME=your_username");
    process.exit(1);
  }

  return { token, username };
}

// List available transform directories
function listAvailableTransformDirs() {
  const outputDir = "output";

  if (!fs.existsSync(outputDir)) {
    return [];
  }

  return fs
    .readdirSync(outputDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort()
    .reverse();
}

// Upload source to Mapbox
async function uploadSource(filePath, username) {
  const sourceId = `pois-src-v1`;

  console.log(`📤 Upload source: ${sourceId}`);

  try {
    await $`tilesets upload-source ${username} ${sourceId} ${filePath} --replace`.pipe(
      process.stdout,
    );
    console.log(`✅ Source POIs uploadée avec succès`);
  } catch (error) {
    console.error(`❌ Erreur upload source POIs:`, error.message);
    process.exit(1);
  }
}

// Create and publish tileset
async function createAndPublishTileset(username) {
  const tilesetId = `${username}.pois-tileset-v1`;
  const recipeFilePath = `src/etl/load/pois-recipe.json`;

  console.log(`\n=== CREATE AND PUBLISH TILESET ===`);

  try {
    console.log(`🔨 Create tileset: ${tilesetId}`);
    await $`tilesets create ${tilesetId} --recipe ${recipeFilePath} --name "POIs Tileset v1"`.pipe(
      process.stdout,
    );

    // Always update recipe to ensure it's current
    console.log(`🔄 Mise à jour de la recette: ${tilesetId}`);
    await $`tilesets update-recipe ${tilesetId} ${recipeFilePath}`.pipe(
      process.stdout,
    );

    console.log(`🚀 Publish tileset: ${tilesetId}`);
    await $`tilesets publish ${tilesetId}`.pipe(process.stdout);

    console.log(`✅ Tileset créé et publié avec succès: ${tilesetId}`);
  } catch (error) {
    console.error(`❌ Erreur création/publication tileset:`, error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  const options = parseArgs();
  const { username } = validateEnvironment();

  console.log("🚀 Début de l'upload des POIs vers Mapbox Tileset");

  if (!options.transformDir) {
    console.error("❌ Dossier de transformation requis avec --transform-dir");
    console.log("Dossiers disponibles dans output/:");
    const available = listAvailableTransformDirs();
    if (available.length === 0) {
      console.log("  (aucun)");
    } else {
      available.forEach((dir) => console.log(`  ${dir}`));
    }
    console.log(
      "\n📖 Consultez le README.md pour plus d'informations sur l'usage",
    );
    process.exit(1);
  }

  const transformDir = options.transformDir;
  console.log(`✅ Utilisation du dossier spécifié: ${transformDir}`);

  // Build file path
  const baseDir = transformDir.startsWith("output/")
    ? transformDir
    : `output/${transformDir}`;

  const geoJsonFile = `${baseDir}/geojson/pois.jsonl`;

  // Validate file exists
  console.log("🔍 Validation du fichier POIs...");
  if (!fs.existsSync(geoJsonFile)) {
    console.error(`❌ Fichier JSONL POIs non trouvé: ${geoJsonFile}`);
    process.exit(1);
  }
  console.log(`✅ POIs: ${geoJsonFile}`);

  try {
    const startTime = Date.now();

    // 1. Upload source
    console.log("\n=== UPLOAD DES SOURCES POIS ===");
    await uploadSource(geoJsonFile, username);

    // 2. Create and publish tileset
    await createAndPublishTileset(username);

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(
      `\n🎉 Upload Mapbox terminé avec succès en ${totalTime.toFixed(1)}s`,
    );

    console.log("\n📊 Tileset créé:");
    console.log(`  • ${username}.pois-tileset-v1`);
    console.log("\n📋 Source POIs uploadée:");
    console.log(`  • pois-src-v1`);
  } catch (error) {
    console.error("❌ Erreur lors de l'upload Mapbox:", error.message);
    process.exit(1);
  }
}

// Run main function
main();
