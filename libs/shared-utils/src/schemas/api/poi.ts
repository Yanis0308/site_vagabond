import { Type } from "typebox";

import { PoiFilterLevelEnumSchema } from "../enums.js";
import { CoordsSchema } from "../geo.js";
import { ApiResponseSchema } from "../utils.js";

export const POISchema = Type.Object(
  {
    id: Type.String(),
    coords: CoordsSchema,
    name: Type.String({ examples: ["Grand Place"] }),
    filterLevel: PoiFilterLevelEnumSchema,
  },
  {
    $id: "Poi",
  },
);

export const GetPoisResponseSchema = ApiResponseSchema(
  Type.Array(POISchema),
  "GetPoisResponse",
);
