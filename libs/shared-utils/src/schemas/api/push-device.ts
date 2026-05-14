import { type Static, Type } from "typebox";

import { ApiResponseSchema } from "../utils.js";

export const RegisterPushDeviceRequestSchema = Type.Object(
  {
    token: Type.String({ minLength: 1, maxLength: 4000 }),
    platform: Type.Union([Type.Literal("ios"), Type.Literal("android")]),
    appVersion: Type.String({ minLength: 1, maxLength: 50 }),
    osVersion: Type.String({ minLength: 1, maxLength: 50 }),
    // Optional because Device.modelName can return null on some platforms
    // (notably web/simulator). appVersion/osVersion are always resolvable.
    deviceModel: Type.Optional(Type.String({ maxLength: 100 })),
  },
  { $id: "RegisterPushDeviceRequest" },
);

export const RegisterPushDeviceResponseSchema = ApiResponseSchema(
  Type.Object({ id: Type.Number() }),
  "RegisterPushDeviceResponse",
);

export const DeletePushDeviceRequestSchema = Type.Object(
  {
    token: Type.String({ minLength: 1, maxLength: 4000 }),
  },
  { $id: "DeletePushDeviceRequest" },
);

export type RegisterPushDeviceRequest = Static<
  typeof RegisterPushDeviceRequestSchema
>;
export type DeletePushDeviceRequest = Static<
  typeof DeletePushDeviceRequestSchema
>;
