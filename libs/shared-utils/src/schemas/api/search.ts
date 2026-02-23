import { type Static, Type } from "typebox";

import { CoordsSchema } from "../geo.js";
import { ApiResponseSchema } from "../utils.js";

export const SearchQuerySchema = Type.Object(
  {
    q: Type.String({ minLength: 2, examples: ["Lille"] }),
  },
  { $id: "SearchQuery" },
);

export const SearchResultSchema = Type.Object(
  {
    type: Type.Union([Type.Literal("POI"), Type.Literal("CITY")], {
      examples: ["POI"],
    }),
    id: Type.String({ examples: ["OSM-N1234567890"] }),
    name: Type.String({ examples: ["Grand Place"] }),
    coordinates: CoordsSchema,
    cityName: Type.Optional(Type.String({ examples: ["Lille"] })),
    departmentName: Type.Optional(Type.String({ examples: ["Nord"] })),
  },
  { $id: "SearchResult" },
);

export const SearchResponseSchema = ApiResponseSchema(
  Type.Array(SearchResultSchema),
  "SearchResponse",
);

export type SearchQuery = Static<typeof SearchQuerySchema>;
export type SearchResult = Static<typeof SearchResultSchema>;
