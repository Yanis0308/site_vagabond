import { Type } from "@sinclair/typebox";

import { CoordsSchema } from "../geo.js";
import { ApiResponseSchema } from "../utils.js";

export const VisitedPoiSchema = Type.Object(
  {
    id: Type.Number(),
    poiId: Type.String(),
    userId: Type.String(),
    createdAt: Type.String(),
  },
  { $id: "VisitedPoi" },
);

export const CreateVisitedPoiRequestSchema = Type.Object(
  {
    poiId: Type.String(),
    coords: Type.Ref(CoordsSchema),
  },
  { $id: "CreateVisitedPoiRequestData" },
);

export const GetVisitedPoisResponseSchema = ApiResponseSchema(
  Type.Array(Type.Ref(VisitedPoiSchema)),
  "GetVisitedPoisResponse",
);
