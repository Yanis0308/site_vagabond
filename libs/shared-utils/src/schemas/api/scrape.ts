import { Type } from "@sinclair/typebox";

export const ScrapeQuerySchema = Type.Object(
  {
    poiId: Type.String({ examples: ["OSM-N1234567890"] }),
    batchId: Type.Optional(Type.String({ examples: ["batch-123"] })),
  },
  { $id: "ScrapeQuery" },
);

export const ScrapeResponseSchema = Type.Object(
  {
    id: Type.Number(),
    targetId: Type.String(),
    status: Type.Union([
      Type.Literal("pending"),
      Type.Literal("success"),
      Type.Literal("error"),
    ]),
    input: Type.Object({
      poiId: Type.String(),
      query: Type.String(),
      geoCoordinates: Type.String(),
      zoom: Type.Number(),
      langCode: Type.String(),
    }),
    output: Type.Union([
      Type.Object({
        content: Type.Record(Type.String(), Type.Any()),
      }),
      Type.Object({
        error: Type.String(),
      }),
      Type.Null(),
    ]),
    batchId: Type.Union([Type.String(), Type.Null()]),
    type: Type.Literal("scraper-maps"),
  },
  { $id: "ScrapeResponse" },
);
