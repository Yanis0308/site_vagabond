import { Type } from "typebox";

import { ErrorEnumSchema } from "./enums.js";
import { MetadataSchema } from "./metadata.js";

export const ErrorSchema = Type.Object(
  {
    type: ErrorEnumSchema,
    message: Type.String(),
  },
  { $id: "Error" },
);

export const ErrorResponseSchema = Type.Object(
  {
    error: ErrorSchema,
    metadata: Type.Optional(MetadataSchema),
  },
  { $id: "ErrorResponse" },
);
