import { TSchema } from "@sinclair/typebox";

import { TObject } from "@sinclair/typebox";

import { TRef } from "@sinclair/typebox";

import { TOptional } from "@sinclair/typebox";

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
