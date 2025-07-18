import { Type } from "@sinclair/typebox";

import { PoiDataSourceEnumSchema } from "../enums.js";
import { LanguageEnumSchema } from "../enums.js";
import { CoordsSchema } from "../geo.js";
import { ApiResponseSchema, Nullable } from "../utils.js";
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
    nbOfTags: Nullable(Type.Number()),
    rawInfo: Type.Any(),
    language: Type.Ref(LanguageEnumSchema),
    dataSource: Type.Ref(PoiDataSourceEnumSchema),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
  },
  { $id: "PoiData" },
);

export const POISchema = Type.Object(
  {
    id: Type.String(),
    coords: Type.Ref(CoordsSchema),
    data: Type.Array(Type.Ref(PoiDataSchema)),
    visitedPois: Type.Array(Type.Ref(VisitedPoiSchema)),
  },
  { $id: "POI" },
);

export const GetPoisResponseSchema = ApiResponseSchema(
  Type.Array(Type.Ref(POISchema)),
  "GetPoisResponse",
);
