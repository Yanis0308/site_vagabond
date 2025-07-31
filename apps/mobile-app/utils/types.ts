import { type Static } from "@sinclair/typebox";
import { type jsonSchemas } from "@vagabond/shared-utils";

export type PoiType = Static<
  typeof jsonSchemas.GetPoisResponseSchema.properties.data
>[0] & {
  popularity?: number;
};

export type BoundingBoxType = Static<typeof jsonSchemas.BoundingBoxSchema>;
