import { type Static, Type } from "typebox";

import { PoiEnrichedSchema } from "../processors/llm.js";
import { ApiResponseSchema, DateSchema } from "../utils.js";

// API Response schema that extends PoiEnrichedSchema with database metadata
export const PoiEnrichedDataSchema = Type.Intersect(
  [
    PoiEnrichedSchema,
    Type.Object({
      id: Type.Number({
        description: "Database ID of the enriched POI",
      }),
      poiId: Type.String({
        maxLength: 1000,
        description: "ID of the POI this enriched data belongs to",
      }),
      version: Type.Number({
        description: "Version number of the enriched data",
      }),
      createdAt: DateSchema,
      updatedAt: DateSchema,
    }),
  ],
  {
    description: "Enriched POI data with database metadata",
    $id: "PoiEnrichedData",
  },
);

export const GetPoiEnrichedResponseSchema = ApiResponseSchema(
  PoiEnrichedDataSchema,
  "GetPoiEnrichedResponse",
);

export type PoiEnrichedData = Static<typeof PoiEnrichedDataSchema>;
