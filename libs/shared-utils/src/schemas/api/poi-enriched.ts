import { Type } from "typebox";

import { ApiResponseSchema } from "../utils.js";

// API Response schemas
export const PoiEnrichedFunFactResponseSchema = Type.Object(
  {
    id: Type.Number(),
    content: Type.String({ maxLength: 500 }),
    order: Type.Number(),
    version: Type.Number(),
    createdAt: Type.String({ maxLength: 30 }),
    updatedAt: Type.String({ maxLength: 30 }),
  },
  {
    description: "Fun fact response schema",
    $id: "PoiEnrichedFunFactResponse",
  },
);

export const PoiEnrichedDataSchema = Type.Object(
  {
    id: Type.Number(),
    poiId: Type.String({ maxLength: 255 }),
    name: Type.Union([Type.String({ maxLength: 1000 }), Type.Null()]),
    description: Type.Union([Type.String({ maxLength: 5000 }), Type.Null()]),
    source: Type.String({ maxLength: 100 }),
    version: Type.Number(),
    createdAt: Type.String({ maxLength: 30 }),
    updatedAt: Type.String({ maxLength: 30 }),
    funFacts: Type.Array(PoiEnrichedFunFactResponseSchema),
  },
  {
    description: "Enriched POI data schema",
    $id: "PoiEnrichedData",
  },
);

export const GetPoiEnrichedResponseSchema = ApiResponseSchema(
  PoiEnrichedDataSchema,
  "GetPoiEnrichedResponse",
);
