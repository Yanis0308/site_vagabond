import { type Static, Type } from "typebox";

import { RoleEnumSchema } from "../enums.js";
import { ApiResponseSchema, DateSchema, Nullable } from "../utils.js";

export const UserMeSchema = Type.Object(
  {
    id: Type.String(),
    email: Nullable(Type.String()),
    fullName: Type.String(),
    oauthProviders: Type.Array(Type.String()),
    lastLogin: DateSchema,
    createdAt: DateSchema,
    role: RoleEnumSchema,
  },
  { $id: "UserMe" },
);

export const UsersMeResponseSchema = ApiResponseSchema(
  UserMeSchema,
  "UsersMeResponse",
);

export const UserPublicInfoSchema = Type.Object(
  {
    id: Type.String(),
    fullName: Type.String(),
    createdAt: DateSchema,
  },
  { $id: "UserPublicInfo" },
);

export const UserPublicInfoResponseSchema = ApiResponseSchema(
  UserPublicInfoSchema,
  "UserPublicInfoResponse",
);

export type UserMe = Static<typeof UserMeSchema>;
export type UserPublicInfo = Static<typeof UserPublicInfoSchema>;
