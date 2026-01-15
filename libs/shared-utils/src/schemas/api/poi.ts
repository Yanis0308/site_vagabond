import { Type } from "typebox";

import {
  LanguageEnumSchema,
  PoiDataSourceEnumSchema,
  PoiFilterLevelEnumSchema,
} from "../enums.js";
import { CoordsSchema } from "../geo.js";
import { ApiResponseSchema } from "../utils.js";
import { VisitedPoiSchema } from "./visited-poi.js";

export const PoiDataSchema = Type.Object(
  {
    id: Type.Number(),
    name: Type.String({ examples: ["Grand Place"] }),
    description: Type.String({
      examples: [
        "Place centrale historique de Lille avec son emblématique Vieille Bourse",
      ],
    }),
    filterLevel: PoiFilterLevelEnumSchema,
    rawInfo: Type.Any(),
    language: LanguageEnumSchema,
    dataSource: PoiDataSourceEnumSchema,
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
  },
  { $id: "PoiData" },
);

export const POISchema = Type.Object(
  {
    id: Type.String(),
    coords: CoordsSchema,
    data: Type.Array(PoiDataSchema),
    visitedPois: Type.Array(VisitedPoiSchema),
  },
  {
    $id: "Poi",
  },
);

export const GetPoisResponseSchema = ApiResponseSchema(
  Type.Array(POISchema),
  "GetPoisResponse",
);
