import { logger } from "@vagabond/shared-utils";

import { type CliArgs } from "../types";

// Parse command line arguments
export function parseArgs(): CliArgs {
  const args = process.argv.slice(2);

  // Parse arguments in --key=value format
  let schema = "";
  let countryCode = "DEFAULT";
  let voronoiOnly = false;
  let transformDir: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--schema=")) {
      schema = arg.replace("--schema=", "").trim();
    } else if (arg.startsWith("--country=")) {
      countryCode = arg.replace("--country=", "").trim().toUpperCase();
    } else if (arg === "--voronoi-only") {
      voronoiOnly = true;
    } else if (arg.startsWith("--transform-dir=")) {
      transformDir = arg.replace("--transform-dir=", "").trim();
    }
  }

  if (schema === "") {
    logger.error(
      "Error - correct usage is: pnpm run transform --schema=<schema-name> [--country=<country-code>] [--voronoi-only] [--transform-dir=<dir>]",
    );
    process.exit(1);
  }

  if (voronoiOnly && transformDir === undefined) {
    logger.error(
      "Error - en mode --voronoi-only, --transform-dir=<dir> est requis.",
    );
    process.exit(1);
  }

  return { schema, countryCode, voronoiOnly, transformDir };
}
