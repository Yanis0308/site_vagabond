import { logger } from "@vagabond/shared-utils";

import { type CliArgs } from "../types";

// Parse command line arguments
export function parseArgs(): CliArgs {
  const args = process.argv.slice(2);

  // Parse arguments in --key=value format
  let schema = "";
  let countryCode = "DEFAULT";

  for (const arg of args) {
    if (arg.startsWith("--schema=")) {
      schema = arg.replace("--schema=", "").trim();
    } else if (arg.startsWith("--country=")) {
      countryCode = arg.replace("--country=", "").trim().toUpperCase();
    }
  }

  if (schema === "") {
    logger.error(
      "Error - correct usage is: pnpm run transform --schema=<schema-name> [--country=<country-code>]",
    );
    process.exit(1);
  }

  return { schema, countryCode };
}
