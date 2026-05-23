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

// Function to get schema name from filename (remove .osm.pbf extension and replace hyphens with underscores)
function getSchemaName(filename) {
  return filename.replace(".osm.pbf", "").replace(/-/g, "_");
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
  console.error(error);
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
console.log("RUNNING osm2pgsql:");
console.log("=".repeat(80));
console.log(osm2pgsqlCommand);
console.log("=".repeat(80));

// PostgreSQL tuning for ETL (hierarchy queries, index creation)
// Use \\" so the shell receives \" and properly quotes the database name (hyphens require quoting in PostgreSQL)
await $`docker exec postgresql-postgis-data-manager psql -U user -d vagabond-data-manager -c "ALTER DATABASE \\"vagabond-data-manager\\" SET statement_timeout = '1h';"`;
await $`docker exec postgresql-postgis-data-manager psql -U user -d vagabond-data-manager -c "ALTER DATABASE \\"vagabond-data-manager\\" SET max_parallel_workers_per_gather = 4;"`;
await $`docker exec postgresql-postgis-data-manager psql -U user -d vagabond-data-manager -c "ALTER DATABASE \\"vagabond-data-manager\\" SET work_mem = '1024MB';"`;
console.log(
  "✅ PostgreSQL tuning applied (statement_timeout, max_parallel_workers_per_gather, work_mem)",
);

// Run osm2pgsql
try {
  await $`${osm2pgsqlPath} ${params}`;
  console.log("✅ osm2pgsql completed successfully!");
} catch (error) {
  console.error("❌ osm2pgsql failed:", error);
  process.exit(1);
}

// Add point_on_surface column for hierarchy queries (avoids recomputing ST_PointOnSurface per row)
console.log("\n" + "=".repeat(80));
console.log("ADDING point_on_surface COLUMN:");
console.log("=".repeat(80));

try {
  await $`docker exec postgresql-postgis-data-manager psql -U user -d vagabond-data-manager -c "ALTER TABLE ${schemaName}.boundaries ADD COLUMN IF NOT EXISTS point_on_surface geometry(Point);"`;
  await $`docker exec postgresql-postgis-data-manager psql -U user -d vagabond-data-manager -c "UPDATE ${schemaName}.boundaries SET point_on_surface = ST_PointOnSurface(geom) WHERE point_on_surface IS NULL;"`;
  console.log("✅ Added and populated point_on_surface column");
} catch (error) {
  console.warn("⚠️  point_on_surface column may have failed:", error);
}

// Create indexes on raw tables for better performance
console.log("\n" + "=".repeat(80));
console.log("CREATING INDEXES ON RAW OSM TABLES:");
console.log("=".repeat(80));

try {
  // Create B-tree index on admin_level
  await $`docker exec postgresql-postgis-data-manager psql -U user -d vagabond-data-manager -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${schemaName}_boundaries_admin_level ON ${schemaName}.boundaries (admin_level);"`;
  console.log("✅ Created B-tree index on boundaries.admin_level");

  // Create GIST spatial index on geom for ST_Contains lookups (boundary hierarchies, associations)
  await $`docker exec postgresql-postgis-data-manager psql -U user -d vagabond-data-manager -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${schemaName}_boundaries_geom ON ${schemaName}.boundaries USING GIST (geom);"`;
  console.log("✅ Created GIST index on boundaries.geom");

  console.log(
    "\n🎉 OSM import and additional indexing completed successfully!",
  );
} catch (error) {
  console.warn(
    "⚠️  Some indexes may already exist or failed to create:",
    error,
  );
  console.log("Continuing anyway - the import was successful.");
}
