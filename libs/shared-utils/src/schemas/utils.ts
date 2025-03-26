import { type TSchema } from "@sinclair/typebox";
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
