import { type TNull, type TSchema, type TUnion } from "@sinclair/typebox";
import { type TObject } from "@sinclair/typebox";
import { type TRef } from "@sinclair/typebox";
import { type TOptional } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";

import { MetadataSchema } from "./metadata.js";

export const ApiResponseSchema = <T extends TSchema>(
  dataSchema: T,
  schemaId: string,
): TObject<{
  data: T;
  metadata: TOptional<TRef<typeof MetadataSchema>>;
}> =>
  Type.Object(
    {
      data: dataSchema,
      metadata: Type.Optional(Type.Ref(MetadataSchema)),
    },
    { $id: schemaId },
  );

export const Nullable = <T extends TSchema>(T: T): TUnion<[T, TNull]> => {
  // type Nullable<T> = T | null
  return Type.Union([T, Type.Null()]);
};
