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

/**
 * Mapper for SQL timestamp/timestamptz columns → ISO 8601 string.
 * Use with .mapWith(mapWithIsoDate) to guarantee the emitted payload matches
 * the TypeBox `format: "date-time"` schema (see DateSchema). pg renvoie
 * généralement une Date mais parfois une string raw selon le code path.
 */
export function mapWithIsoDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return new Date(v).toISOString();
  throw new Error(
    `mapWithIsoDate: unexpected value type ${typeof v} (value: ${String(v)})`,
  );
}

/**
 * Idem `mapWithIsoDate` mais autorise null (pour des colonnes nullable).
 */
export function mapWithNullableIsoDate(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return mapWithIsoDate(v);
}

/**
 * Mapper for SQL results that can be number or null.
 * Use with .mapWith(mapWithNullableNumber) instead of sql<number | null>.
 */
export function mapWithNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isNaN(v) ? null : v;
  if (typeof v === "string") {
    if (v.trim() === "") return null;
    const parsed = Number(v);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Creates a mapper for JSONB results validated via AJV against a JSON schema.
 * Use with .mapWith(mapWithJsonSchema(schema)) instead of sql<T>.
 * Validators are cached in memory by schema reference to avoid recompilation.
 *
 * @param schema - TypeBox schema with $id (e.g. Type.Array(X, { $id: "MySchema" }))
 * @returns Mapper function for Drizzle's .mapWith()
 */
export function mapWithJsonSchema<T extends TSchema>(
  schema: T,
): (v: unknown) => Static<T> {
  const validate = generateValidator(schema);

  return (v: unknown): Static<T> => {
    const parsed = parseJsonbValue(v);
    if (parsed === null || parsed === undefined) {
      return [] as Static<T>;
    }
    if (!validate(parsed)) {
      const schemaId = (schema as { $id?: string }).$id ?? "unknown";
      throw new Error(`JSONB validation failed for schema ${schemaId}`);
    }

    return parsed;
  };
}

function parseJsonbValue(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return JSON.parse(v) as unknown;
  if (Array.isArray(v) || typeof v === "object") return v;
  return null;
}
