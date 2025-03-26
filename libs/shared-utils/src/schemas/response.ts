import { Type } from "@sinclair/typebox";

import { ApiResponseSchema } from "./utils.js";

export const EmptyResponseSchema = ApiResponseSchema(
  Type.Object({}),
  "EmptyResponse",
);
