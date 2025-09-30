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
async function uploadSource(level, filePath, username, type = "points") {
  // Map level names to shorter IDs to respect 32 char limit
  const levelMap = {
    country: "co",
    region: "re",
    county: "ct",
    city: "ci",
    district: "di",
    neighborhood: "ne",
  };

  const typePrefix = type === "polygons" ? "poly" : "bounds";
  const sourceId = `${typePrefix}-${levelMap[level]}-src-v1`;

  console.log(`📤 Upload source: ${sourceId}`);

  try {
    await $`tilesets upload-source ${username} ${sourceId} ${filePath} --replace`.pipe(
      process.stdout,
    );
    console.log(
      `✅ Source ${level.toUpperCase()} ${type} uploadée avec succès`,
    );
  } catch (error) {
    console.error(`❌ Erreur upload source ${level} ${type}:`, error.message);
    process.exit(1);
  }
}

// Create and publish tileset (une seule fois)
async function createAndPublishTileset(username) {
  const tilesetId = `${username}.boundaries-tileset-v1`;
  const recipeFilePath = `src/etl/load/boundaries-recipe.json`;

  console.log(`\n=== CREATE AND PUBLISH TILESET ===`);

  try {
    console.log(`🔨 Create tileset: ${tilesetId}`);
    await $`tilesets create ${tilesetId} --recipe ${recipeFilePath} --name "Boundaries Tileset v1"`.pipe(
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

  console.log("🚀 Début de l'upload vers Mapbox Tileset");

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

  // Build file paths
  const baseDir = transformDir.startsWith("output/")
    ? transformDir
    : `output/${transformDir}`;

  const geoJsonFiles = {
    country: `${baseDir}/geojson/boundaries-country.jsonl`,
    region: `${baseDir}/geojson/boundaries-region.jsonl`,
    county: `${baseDir}/geojson/boundaries-county.jsonl`,
    city: `${baseDir}/geojson/boundaries-city.jsonl`,
    district: `${baseDir}/geojson/boundaries-district.jsonl`,
    neighborhood: `${baseDir}/geojson/boundaries-neighborhood.jsonl`,
  };

  const polygonGeoJsonFiles = {
    country: `${baseDir}/geojson/boundaries-polygons-country.jsonl`,
    region: `${baseDir}/geojson/boundaries-polygons-region.jsonl`,
    county: `${baseDir}/geojson/boundaries-polygons-county.jsonl`,
    city: `${baseDir}/geojson/boundaries-polygons-city.jsonl`,
    district: `${baseDir}/geojson/boundaries-polygons-district.jsonl`,
    neighborhood: `${baseDir}/geojson/boundaries-polygons-neighborhood.jsonl`,
  };

  // Validate files exist
  console.log("🔍 Validation des fichiers points...");
  for (const [level, filePath] of Object.entries(geoJsonFiles)) {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Fichier JSONL points non trouvé: ${filePath}`);
      process.exit(1);
    }
    console.log(`✅ ${level}: ${filePath}`);
  }

  console.log("🔍 Validation des fichiers polygones...");
  for (const [level, filePath] of Object.entries(polygonGeoJsonFiles)) {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Fichier JSONL polygones non trouvé: ${filePath}`);
      process.exit(1);
    }
    console.log(`✅ ${level} polygons: ${filePath}`);
  }

  try {
    const startTime = Date.now();

    // 1. Upload sources for each level
    console.log("\n=== UPLOAD DES SOURCES POINTS ===");
    for (const [level, filePath] of Object.entries(geoJsonFiles)) {
      await uploadSource(level, filePath, username, "points");
    }

    console.log("\n=== UPLOAD DES SOURCES POLYGONES ===");
    for (const [level, filePath] of Object.entries(polygonGeoJsonFiles)) {
      await uploadSource(level, filePath, username, "polygons");
    }

    // 2. Create and publish tileset (une seule fois)
    await createAndPublishTileset(username);

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(
      `\n🎉 Upload Mapbox terminé avec succès en ${totalTime.toFixed(1)}s`,
    );

    console.log("\n📊 Tileset créé:");
    console.log(`  • ${username}.boundaries-tileset-v1`);
    console.log("\n📋 Sources points uploadées:");
    Object.keys(geoJsonFiles).forEach((level) => {
      const levelMap = {
        country: "co",
        region: "re",
        county: "ct",
        city: "ci",
        district: "di",
        neighborhood: "ne",
      };
      console.log(`  • bounds-${levelMap[level]}-src-v1`);
    });
    console.log("\n📋 Sources polygones uploadées:");
    Object.keys(polygonGeoJsonFiles).forEach((level) => {
      const levelMap = {
        country: "co",
        region: "re",
        county: "ct",
        city: "ci",
        district: "di",
        neighborhood: "ne",
      };
      console.log(`  • poly-${levelMap[level]}-src-v1`);
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'upload Mapbox:", error.message);
    process.exit(1);
  }
}

// Run main function
main();
