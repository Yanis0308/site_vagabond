import { Static } from "@sinclair/typebox";
import { jsonSchemas } from "@vagabond/shared-utils";

export type PoiType = Static<
  typeof jsonSchemas.GetPoisResponseSchema.properties.data
>[0];
