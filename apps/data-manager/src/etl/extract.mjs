#!/usr/bin/env zx

import "zx/globals";

// Get PBF filename from command line arguments
const pbfFilename = argv._[0];
if (!pbfFilename) {
  console.error("Usage: extract.mjs <pbf-filename>");
  console.error("Example: extract.mjs france-2024-01-15.osm.pbf");
  process.exit(1);
}

const osm2pgsqlPath = (await $`which osm2pgsql`.text()).trim();

// Function to find the PBF file by filename
function findPbfFile(filename) {
  const pbfDir = path.join(process.cwd(), "src/etl/extract/pbf-files");

  if (!fs.existsSync(pbfDir)) {
    throw new Error(`PBF directory does not exist: ${pbfDir}`);
  }

  const pbfPath = path.join(pbfDir, filename);

  if (!fs.existsSync(pbfPath)) {
    throw new Error(`PBF file not found: ${pbfPath}`);
  }

  return pbfPath;
}

// Function to get schema name from filename (remove .osm.pbf extension)
function getSchemaName(filename) {
  return filename.replace(".osm.pbf", "");
}

const pbfPath = findPbfFile(pbfFilename);
const schemaName = getSchemaName(pbfFilename);

console.log(`Using PBF file: ${pbfPath}`);
console.log(`Using schema: ${schemaName}`);

const luaFilePath = path.join(process.cwd(), "src/etl/extract/main.lua");
if (!fs.existsSync(luaFilePath)) {
  console.log("Lua file path:", luaFilePath);
  throw new Error("Lua file does not exist");
}

// Create schema if it doesn't exist using Docker
console.log("Creating schema...");
try {
  await $`docker exec postgresql-postgis-data-manager psql -U user -d vagabond-data-manager -c "CREATE SCHEMA IF NOT EXISTS ${schemaName};"`;
  console.log(`Schema ${schemaName} created successfully.`);
} catch (error) {
  console.warn(
    "Could not create schema via Docker. Continuing anyway - osm2pgsql might create it automatically.",
  );
}

const params = [
  "--database=postgresql://user:password@localhost:5442/vagabond-data-manager",
  `--schema=${schemaName}`,
  // "--append --slim", // use database instead of RAM, needed for append mode (update) 10x or 20x slower
  "--create",
  "--output=flex", // flex output mode to use lua file
  `--style=${luaFilePath}`,
  pbfPath,
];
const osm2pgsqlCommand = `${osm2pgsqlPath} ${params.join(" ")}`;

console.log("\n" + "=".repeat(80));
console.log("COPY AND PASTE THIS COMMAND TO RUN osm2pgsql:");
console.log("=".repeat(80));
console.log(osm2pgsqlCommand);
console.log("=".repeat(80));
console.log("\nScript completed. Please run the above command manually.");
