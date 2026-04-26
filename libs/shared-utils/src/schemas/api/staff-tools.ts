import { type Static, Type } from "typebox";

import { ApiResponseSchema } from "../utils.js";

export const StaffToolsBoundaryLevelSchema = Type.Union(
  [Type.Literal("REGION"), Type.Literal("COUNTY"), Type.Literal("CITY")],
  { $id: "StaffToolsBoundaryLevel" },
);
export type StaffToolsBoundaryLevel = Static<
  typeof StaffToolsBoundaryLevelSchema
>;

export const StaffToolsValidatePlaceResponseSchema = ApiResponseSchema(
  Type.Object(
    { id: Type.Number() },
    { $id: "StaffToolsValidatePlaceResponseData" },
  ),
  "StaffToolsValidatePlaceResponse",
);

export const StaffToolsCompleteZoneRequestSchema = Type.Object(
  {
    poiId: Type.String(),
    boundaryLevel: StaffToolsBoundaryLevelSchema,
    percentage: Type.Number({ minimum: 0, maximum: 100 }),
  },
  { $id: "StaffToolsCompleteZoneRequest" },
);
export type StaffToolsCompleteZoneRequest = Static<
  typeof StaffToolsCompleteZoneRequestSchema
>;

export const StaffToolsCompleteZoneResponseSchema = ApiResponseSchema(
  Type.Object(
    { addedCount: Type.Number(), removedCount: Type.Number() },
    { $id: "StaffToolsCompleteZoneResponseData" },
  ),
  "StaffToolsCompleteZoneResponse",
);
