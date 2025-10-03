import { Type } from "@sinclair/typebox";

import { CoordsSchema } from "../geo.js";
import { ApiResponseSchema } from "../utils.js";

export const VisitedPoiSchema = Type.Object(
  {
    id: Type.Number(),
    poiId: Type.String(),
    zoneId: Type.Optional(Type.String()),
    userId: Type.String(),
    username: Type.String(),
    createdAt: Type.String(),
    comment: Type.String(),
    rating: Type.Number(),
    imageKey: Type.String(),
  },
  { $id: "VisitedPoi" },
);

export const CreateVisitedPoiRequestSchema = Type.Object(
  {
    imageKey: Type.String(),
    rating: Type.Number({ minimum: 1, maximum: 5 }),
    comment: Type.String(),
    coords: Type.Ref(CoordsSchema),
  },
  { $id: "CreateVisitedPoiRequestData" },
);

export const GetVisitedPoisResponseSchema = ApiResponseSchema(
  Type.Array(Type.Ref(VisitedPoiSchema)),
  "GetVisitedPoisResponse",
);
