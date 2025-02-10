#!/usr/bin/env zx

import "zx/globals";

const osm2pgsqlPath = await $`which osm2pgsql`;

const params = [
  "--database=postgresql://user:password@localhost:5442/vagabond-data-manager",
  "--slim",
  "--create",
  "--output=flex",
  "--style=import-pois.lua",
  "pbf-files/nord-pas-de-calais-latest.osm.pbf",
];

await $`${osm2pgsqlPath} ${params.join(" ")}`;
