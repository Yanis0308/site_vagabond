import { Ajv, type ValidateFunction } from "ajv";
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

const validatorCache = new Map<string | TSchema, ValidateFunction>();

/**
 * Generate and cache a validator function for a schema.
 * @param schema - The TypeBox schema to validate against
 * @returns A function that validates a value against the schema
 */
export function generateValidator<T extends TSchema>(
  schema: T,
): (value: unknown) => value is Static<T> {
  const cacheKey = (schema as { $id?: string }).$id ?? schema;
  let validateFn: ValidateFunction;
  const cached = validatorCache.get(cacheKey);
  if (cached === undefined) {
    const schemaId = (schema as { $id?: string }).$id ?? "anonymous";
    logger.info(`Compiling schema: '${schemaId}'`);
    validateFn = customAjvInstance.compile(schema);
    validatorCache.set(cacheKey, validateFn);
  } else {
    validateFn = cached;
  }

  return (value: unknown): value is Static<T> => {
    const result = validateFn(value);
    if (!result) {
      const schemaId = (schema as TSchema & { $id?: string }).$id ?? "unknown";
      const errors = validateFn.errors ?? [];
      logger.error(
        `AJV validation failed: Invalid value: '${JSON.stringify(value)}' for schema: '${schemaId}'`,
        JSON.stringify(errors),
      );
    }
    return result;
  };
}
