import { type Static, Type } from "typebox";

import { NOTIFICATION_TEMPLATE_KEYS } from "../../notifications/template-keys.js";
import { SimplifiedCoordsSchema } from "../geo.js";
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

// `variables` n'est volontairement pas validé contre le schéma du template —
// c'est attendu, ça permet au staff de tester des cas dégradés (variable
// manquante, valeur exotique). Le `maxLength` borne juste la taille pour
// éviter de dépasser `varchar(2000)` sur `body_rendered` à l'insert.
export const StaffToolsTestNotificationRequestSchema = Type.Object(
  {
    userId: Type.String({ minLength: 1 }),
    templateKey: Type.Union(
      NOTIFICATION_TEMPLATE_KEYS.map((k) => Type.Literal(k)),
    ),
    variables: Type.Optional(
      Type.Record(Type.String(), Type.String({ maxLength: 200 })),
    ),
    triggerCoords: Type.Optional(
      Type.Union([SimplifiedCoordsSchema, Type.Null()]),
    ),
    variantIndex: Type.Optional(Type.Integer({ minimum: 0 })),
  },
  { $id: "StaffToolsTestNotificationRequest" },
);
export type StaffToolsTestNotificationRequest = Static<
  typeof StaffToolsTestNotificationRequestSchema
>;

export const StaffToolsTestNotificationResponseSchema = ApiResponseSchema(
  Type.Object(
    {
      outcome: Type.Union([
        Type.Literal("sent"),
        Type.Literal("failed"),
        Type.Literal("skipped"),
      ]),
      notificationId: Type.Optional(Type.String()),
      deliveredTo: Type.Optional(Type.Integer()),
      reason: Type.Optional(Type.String()),
      variantIndex: Type.Integer(),
    },
    { $id: "StaffToolsTestNotificationResponseData" },
  ),
  "StaffToolsTestNotificationResponse",
);
