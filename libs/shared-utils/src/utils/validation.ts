import { type Static, type TSchema } from "@sinclair/typebox";
import { Ajv } from "ajv";
import addFormats from "ajv-formats";

import { jsonSchemas } from "../schemas/index.js";
import { logger } from "./logger.js";

export const getCustomAjv = (): Ajv =>
  addFormats.default(
    new Ajv({
      schemas: jsonSchemas,
      allErrors: true,
    }),
    {
      // We could have use "fast" mode but we want to have the most strict validation
      mode: "full",
    },
  );

const customAjv = getCustomAjv();

export const generateValidator = <T extends TSchema>(
  schemaToCompile: T,
): ((value: unknown) => value is Static<T>) => {
  // TODO: compile va sûrement planter sans mettre addUsedSchema à false
  const validate = customAjv.compile(schemaToCompile);

  return (value: unknown): value is Static<T> => {
    const result = validate(value);
    if (!result) {
      logger.error(
        `Invalid value: '${JSON.stringify(value)}' for schema: '${schemaToCompile.$id}'`,
        JSON.stringify(validate.errors),
      );
    }
    return result;
  };
};
