import { Ajv } from "ajv";
import addFormats from "ajv-formats";
import { type Static, type TSchema } from "typebox";

import { logger } from "./logger.js";

// Singleton instance to avoid duplicate schema registration errors
const customAjvInstance = addFormats.default(
  new Ajv({
    allErrors: true,
  }),
  {
    // We could have use "fast" mode but we want to have the most strict validation
    mode: "full",
  },
);

export const generateValidator = <T extends TSchema>(
  schemaToCompile: T,
): ((value: unknown) => value is Static<T>) => {
  // We could need to set addUsedSchema option to false to avoid duplicate schema registration errors
  const validate = customAjvInstance.compile(schemaToCompile);

  return (value: unknown): value is Static<T> => {
    const result = validate(value);
    if (!result) {
      const schemaId =
        "$id" in schemaToCompile ? schemaToCompile.$id : "unknown";
      logger.error(
        `AJV validation failed: Invalid value: '${JSON.stringify(value)}' for schema: '${schemaId as string}'`,
        JSON.stringify(validate.errors),
      );
    }
    return result;
  };
};
