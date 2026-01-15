import { type TNull, type TSchema, type TUnion } from "typebox";
import { type TObject } from "typebox";
import { type TOptional } from "typebox";
import { Type } from "typebox";

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

export const DateSchema = Type.Codec(
  Type.String({ format: "date-time", $id: "VagabondDate" }),
)
  .Decode((value) => new Date(value))
  .Encode((value) => value.toISOString());
