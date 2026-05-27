import {
  type TArray,
  type TNull,
  type TObject,
  type TOptional,
  type TSchema,
  type TString,
  type TUnion,
  Type,
} from "typebox";

import { MetadataSchema } from "./metadata.js";

export const ApiResponseSchema = <T extends TSchema>(
  dataSchema: T,
  id: string,
): TObject<{
  data: T;
  metadata: TOptional<typeof MetadataSchema>;
}> =>
  Type.Object(
    {
      data: dataSchema,
      metadata: Type.Optional(MetadataSchema),
    },
    { $id: id },
  );

export const Nullable = <T extends TSchema>(T: T): TUnion<[T, TNull]> => {
  // type Nullable<T> = T | null
  return Type.Union([T, Type.Null()]);
};

// Type aligné avec le runtime : `generateValidator` retourne un validateur AJV
// qui ne fait pas de `Value.Decode`, donc même avec un `Type.Codec` le mobile
// reçoit toujours une string ISO. On reste sur une string typée pour éviter le
// mismatch type/runtime et on garantit la validation stricte via
// `format: "date-time"` (ajv-formats mode "full" est chargé côté validation utility).
export const DateSchema = Type.String({
  format: "date-time",
  $id: "VagabondDate",
});

// `limit` n'est pas Optional côté TypeBox : ajv (`useDefaults: true` activé
// par défaut sous Fastify 5) injecte la valeur `default` AVANT la check des
// requis, donc le client peut omettre `limit` mais le handler le voit toujours
// comme un `number` — pas besoin de `?? FALLBACK` à chaque endpoint.
export const CursorPaginationQuerySchema = Type.Object({
  after: Type.Optional(Type.String()),
  limit: Type.Integer({ minimum: 1, maximum: 50, default: 20 }),
});

export const CursorPaginatedResponseSchema = <T extends TSchema>(
  itemSchema: T,
  id: string,
): TObject<{
  items: TArray<T>;
  nextCursor: TUnion<[TString, TNull]>;
}> =>
  Type.Object(
    {
      items: Type.Array(itemSchema),
      nextCursor: Nullable(Type.String()),
    },
    { $id: id },
  );
