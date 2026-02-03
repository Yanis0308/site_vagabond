import { Type } from "typebox";

import { CoordsSchema } from "../geo.js";
import { ApiResponseSchema, Nullable } from "../utils.js";

export const VisitedPoiSchema = Type.Object(
  {
    id: Type.Number(),
    poiId: Type.String(),
    zoneId: Type.Optional(Type.String()),
    userId: Type.String(),
    username: Type.String(),
    createdAt: Type.String(),
    comment: Nullable(Type.String()),
    rating: Type.Number(),
    imageKey: Type.String(),
  },
  { $id: "VisitedPoi" },
);

export const BriefVisitedPoiSchema = Type.Object(
  {
    id: Type.Number(),
    poiId: Type.String(),
    name: Type.Optional(Type.String()),
    createdAt: Type.String(),
    comment: Nullable(Type.String()),
    rating: Type.Number(),
    imageKey: Type.String(),
  },
  { $id: "BriefVisitedPoi" },
);

export const CreateVisitedPoiRequestSchema = Type.Object(
  {
    imageKey: Type.String({ minLength: 1 }),
    rating: Type.Number({ minimum: 1, maximum: 5 }),
    comment: Type.String(),
    coords: CoordsSchema,
  },
  { $id: "CreateVisitedPoiRequest" },
);

export const GetVisitedPoisResponseSchema = ApiResponseSchema(
  Type.Array(VisitedPoiSchema),
  "GetVisitedPoisResponse",
);
