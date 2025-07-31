#!/usr/bin/env zx

import "zx/globals";

const osm2pgsqlPath = (await $`which osm2pgsql`.text()).trim();

const pbfPath = path.join(
  process.cwd(),
  "src/etl/extract/pbf-files/belgium-18-07-2025.osm.pbf",
);
if (!fs.existsSync(pbfPath)) {
  console.log("PBF file path:", pbfPath);
  throw new Error("PBF file does not exist");
}

const luaFilePath = path.join(process.cwd(), "src/etl/extract/main.lua");
if (!fs.existsSync(luaFilePath)) {
  console.log("Lua file path:", luaFilePath);
  throw new Error("Lua file does not exist");
}
const params = [
  "--database=postgresql://user:password@localhost:5442/vagabond-data-manager",
  // "--append --slim", // use database instead of RAM, needed for append mode (update) 10x or 20x slower
  "--create",
  "--output=flex", // flex output mode to use lua file
  `--style=${luaFilePath}`,
  pbfPath,
];
const osm2pgsqlCommand = `${osm2pgsqlPath} ${params.join(" ")}`;

//TODO: actually the command failed but you can copy and run it manually
await $`${osm2pgsqlCommand}`;
