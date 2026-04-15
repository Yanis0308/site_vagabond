import { type Static, Type } from "typebox";

import { CoordsSchema } from "../geo.js";
import { ApiResponseSchema, Nullable } from "../utils.js";

export const ImageSourceSchema = Type.Union(
  [Type.Literal("CAMERA"), Type.Literal("GALLERY")],
  { $id: "ImageSource" },
);
export type ImageSource = Static<typeof ImageSourceSchema>;

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
    imageKey: Nullable(Type.String()),
    imageSource: ImageSourceSchema,
  },
  { $id: "VisitedPoi" },
);

export const BriefVisitedPoiSchema = Type.Object(
  {
    id: Type.Number(),
    poiId: Type.String(),
    name: Type.Optional(Type.String()),
    coords: CoordsSchema,
    createdAt: Type.String(),
    comment: Nullable(Type.String()),
    rating: Type.Number(),
    imageKey: Nullable(Type.String()),
  },
  { $id: "BriefVisitedPoi" },
);

export const CreateVisitedPoiRequestSchema = Type.Object(
  {
    imageKey: Type.Optional(Type.String({ minLength: 1 })),
    imageSource: ImageSourceSchema,
    rating: Type.Number({ minimum: 1, maximum: 5 }),
    comment: Type.String(),
    coords: CoordsSchema,
  },
  { $id: "CreateVisitedPoiRequest" },
);

export const CreateVisitedPoiResponseSchema = ApiResponseSchema(
  Type.Object({ id: Type.Number() }, { $id: "CreateVisitedPoiResponseData" }),
  "CreateVisitedPoiResponse",
);

export const CheckVisitedPoiImageResponseSchema = ApiResponseSchema(
  Type.Object(
    { hasImage: Type.Boolean() },
    { $id: "CheckVisitedPoiImageResponseData" },
  ),
  "CheckVisitedPoiImageResponse",
);

export const GetVisitedPoisResponseSchema = ApiResponseSchema(
  Type.Array(VisitedPoiSchema),
  "GetVisitedPoisResponse",
);

export type VisitedPoi = Static<typeof VisitedPoiSchema>;
export type BriefVisitedPoi = Static<typeof BriefVisitedPoiSchema>;
export type CreateVisitedPoiRequest = Static<
  typeof CreateVisitedPoiRequestSchema
>;
