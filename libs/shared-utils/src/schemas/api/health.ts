import { type Static, Type } from "typebox";

import { ApiResponseSchema } from "../utils.js";

export const HealthResponseSchema = ApiResponseSchema(
  Type.Object({
    status: Type.Literal("ok"),
  }),
  "HealthResponse",
);
export type HealthResponse = Static<typeof HealthResponseSchema>;

export const ReadyResponseSchema = ApiResponseSchema(
  Type.Object({
    status: Type.Union([
      Type.Literal("ready"),
      Type.Literal("shutting_down"),
      Type.Literal("not_ready"),
    ]),
    checks: Type.Object({
      database: Type.Union([Type.Literal("up"), Type.Literal("down")]),
    }),
  }),
  "ReadyResponse",
);
export type ReadyResponse = Static<typeof ReadyResponseSchema>;
