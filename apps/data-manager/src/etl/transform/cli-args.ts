import { logger } from "@vagabond/shared-utils";

import { type CliArgs } from "../types";

// Parse command line arguments
export function parseArgs(): CliArgs {
  const args = process.argv.slice(2);

  const schema = args[0]?.trim() ?? "";
  if (schema === "") {
    logger.error(
      "Error - correct usage is: pnpm run transform-and-load <schema-name> [country-code]",
    );
    process.exit(1);
  }

  const countryCode = args[1]?.trim().toUpperCase() ?? "DEFAULT";

  return { schema, countryCode };
}
