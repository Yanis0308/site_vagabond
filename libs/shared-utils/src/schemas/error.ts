import { Type } from "@sinclair/typebox";

import { ErrorEnumSchema } from "./enums.js";
import { MetadataSchema } from "./metadata.js";

export const ErrorSchema = Type.Object(
  {
    type: Type.Ref(ErrorEnumSchema),
    message: Type.String(),
  },
  { $id: "Error" },
);

export const ErrorResponseSchema = Type.Object(
  {
    error: Type.Ref(ErrorSchema),
    metadata: Type.Optional(Type.Ref(MetadataSchema)),
  },
  { $id: "ErrorResponse" },
);
