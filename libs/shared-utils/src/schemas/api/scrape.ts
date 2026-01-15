import { Type } from "typebox";

import { GoogleMapsPlaceStrictSchema } from "./google-maps-place.js";
import { Nullable } from "../utils.js";

// Schema for API route (used by api/src/routes/scrape)
export const ScrapeQuerySchema = Type.Object(
  {
    poiId: Type.String({ examples: ["OSM-N1234567890"] }),
    batchId: Type.Optional(Type.String({ examples: ["batch-123"] })),
  },
  { $id: "ScrapeQuery" },
);

// Schema for data-scraper service (internal API)
export const ScrapeDataScraperQuerySchema = Type.Object(
  {
    query: Type.String({ examples: ["Restaurant"] }),
    geoCoordinates: Type.String({ examples: ["50.6292,3.0573"] }),
    zoom: Type.Optional(Type.Number({ default: 15, examples: [15] })),
    langCode: Type.Optional(Type.String({ default: "fr", examples: ["fr"] })),
  },
  { $id: "ScrapeDataScraperQuery" },
);

// Response schema for data-scraper service
// Uses the strict GoogleMapsPlaceStrictSchema for validated place
export const ScrapeDataScraperResponseSchema = Type.Object(
  {
    success: Type.Boolean(),
    place: Nullable(GoogleMapsPlaceStrictSchema),
    error: Type.Optional(Type.String()),
  },
  { $id: "ScrapeDataScraperResponse" },
);
