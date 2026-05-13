import { Type } from "typebox";

// Mirrors the default Fastify error reply body produced by
// fastify/lib/error-serializer.js: { statusCode, code?, error, message }.
// Aligning on this shape lets native plugin errors (e.g. @fastify/under-pressure
// 503, @fastify/rate-limit 429) flow through declared response schemas without
// triggering FST_ERR_FAILED_ERROR_SERIALIZATION.
export const ErrorResponseSchema = Type.Object(
  {
    statusCode: Type.Number(),
    error: Type.String(),
    message: Type.String(),
    code: Type.Optional(Type.String()),
  },
  { $id: "ErrorResponse" },
);
