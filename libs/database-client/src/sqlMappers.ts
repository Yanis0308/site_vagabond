import { generateValidator } from "@vagabond/shared-utils";
import { type Static, type TSchema } from "typebox";

/**
 * Mapper for SQL results that can be string or null.
 * Use with .mapWith(mapWithNullableString) instead of sql<string | null>.
 */
export function mapWithNullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return JSON.stringify(v);
}

const validatorCache = new Map<string, (value: unknown) => value is unknown>();

/**
 * Creates a mapper for JSONB results validated via AJV against a JSON schema.
 * Use with .mapWith(mapWithJsonSchema(schema)) instead of sql<T>.
 * Validators are cached in memory by schema $id to avoid recompilation.
 *
 * @param schema - TypeBox schema with $id (e.g. Type.Array(X, { $id: "MySchema" }))
 * @returns Mapper function for Drizzle's .mapWith()
 */
export function mapWithJsonSchema<T extends TSchema>(
  schema: T,
): (v: unknown) => Static<T> {
  const cacheKey = "$id" in schema ? (schema.$id as string) : undefined;
  let validate =
    cacheKey !== undefined ? validatorCache.get(cacheKey) : undefined;
  if (validate === undefined) {
    validate = generateValidator(schema);
    if (cacheKey !== undefined) {
      validatorCache.set(cacheKey, validate);
    }
  }

  return (v: unknown): Static<T> => {
    const parsed = parseJsonbValue(v);
    if (parsed === null || parsed === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- empty array for array schemas when DB returns null
      return [] as Static<T>;
    }
    if (!validate(parsed)) {
      const schemaId = cacheKey ?? "unknown";
      throw new Error(`JSONB validation failed for schema ${schemaId}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- validated by AJV type guard
    return parsed as Static<T>;
  };
}

function parseJsonbValue(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return JSON.parse(v) as unknown;
  if (Array.isArray(v) || typeof v === "object") return v;
  return null;
}
