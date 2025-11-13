import { Type } from "@sinclair/typebox";

import { RoleEnumSchema } from "../enums.js";
import { ApiResponseSchema, Nullable } from "../utils.js";

export const UserMeSchema = Type.Object(
  {
    id: Type.String(),
    email: Nullable(Type.String()),
    fullName: Nullable(Type.String()),
    oauthProviders: Type.Array(Type.String()),
    lastLogin: Type.String(),
    createdAt: Type.String(),
    role: Type.Ref(RoleEnumSchema),
  },
  { $id: "UserMe" },
);

export const UsersMeResponseSchema = ApiResponseSchema(
  Type.Ref(UserMeSchema),
  "UsersMeResponse",
);
