import { type Static, type TSchema } from "typebox";
import { Ajv } from "ajv";
import addFormats from "ajv-formats";

import { logger } from "./logger.js";

// Singleton instance to avoid duplicate schema registration errors
let customAjvInstance: Ajv | null = null;

export const getCustomAjv = (): Ajv => {
  if (customAjvInstance === null) {
    customAjvInstance = addFormats.default(
      new Ajv({
        allErrors: true,
      }),
      {
        // We could have use "fast" mode but we want to have the most strict validation
        mode: "full",
      },
    );
  }
  if (customAjvInstance === null) {
    throw new Error("Failed to create custom AJV instance");
  }
  return customAjvInstance;
};

const customAjv = getCustomAjv();

export const generateValidator = <T extends TSchema>(
  schemaToCompile: T,
): ((value: unknown) => value is Static<T>) => {
  // We could need to set addUsedSchema option to false to avoid duplicate schema registration errors
  const validate = customAjv.compile(schemaToCompile);

  return (value: unknown): value is Static<T> => {
    const result = validate(value);
    if (!result) {
      const schemaId =
        "$id" in schemaToCompile ? schemaToCompile.$id : "unknown";
      logger.error(
        `AJV validation failed: Invalid value: '${JSON.stringify(value)}' for schema: '${schemaId}'`,
        JSON.stringify(validate.errors),
      );
    }
    return result;
  };
};
