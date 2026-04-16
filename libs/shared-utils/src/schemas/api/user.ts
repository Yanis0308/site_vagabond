import { Codec, type Static, Type } from "typebox";

import { NICKNAME_MAX_LENGTH } from "../../constants.js";
import { slugifyNickname } from "../../utils/slug.js";
import { RoleEnumSchema } from "../enums.js";
import { ApiResponseSchema, DateSchema, Nullable } from "../utils.js";

const nicknameCodec = Codec(
  Type.String({ minLength: 1, maxLength: NICKNAME_MAX_LENGTH }),
)
  .Decode((value: string) => {
    const slugged = slugifyNickname(value);
    if (slugged.length === 0) {
      throw new Error("Nickname invalide après slugification");
    }
    if (slugged.length > NICKNAME_MAX_LENGTH) {
      throw new Error(
        `Nickname trop long (max ${NICKNAME_MAX_LENGTH} caractères)`,
      );
    }
    return slugged;
  })
  .Encode((value: string) => value);

export const UserMeSchema = Type.Object(
  {
    id: Type.String(),
    email: Nullable(Type.String()),
    fullName: Type.String(),
    nickname: Nullable(Type.String()),
    oauthProviders: Type.Array(Type.String()),
    lastLogin: DateSchema,
    hasAppReview: Type.Boolean(),
    createdAt: DateSchema,
    role: RoleEnumSchema,
    isPrivate: Type.Boolean(),
  },
  { $id: "UserMe" },
);

export const UsersMeResponseSchema = ApiResponseSchema(
  UserMeSchema,
  "UsersMeResponse",
);

export const NicknameUpdateSchema = Type.Object(
  {
    nickname: nicknameCodec,
  },
  { $id: "NicknameUpdate" },
);

export const UpdateUserMeRequestSchema = Type.Object(
  {
    nickname: Type.Optional(nicknameCodec),
    isPrivate: Type.Optional(Type.Boolean()),
  },
  { $id: "UpdateUserMeRequest", minProperties: 1 },
);

export const UserPublicInfoSchema = Type.Object(
  {
    id: Type.String(),
    fullName: Type.String(),
    nickname: Nullable(Type.String()),
    createdAt: DateSchema,
    isPrivate: Type.Boolean(),
  },
  { $id: "UserPublicInfo" },
);

export const UserPublicInfoResponseSchema = ApiResponseSchema(
  UserPublicInfoSchema,
  "UserPublicInfoResponse",
);

export const UserAppReviewRequestSchema = Type.Union(
  [
    Type.Object({
      positive: Type.Literal(true),
      comment: Type.Optional(Nullable(Type.String())),
    }),
    Type.Object({
      positive: Type.Literal(false),
      comment: Type.String({ minLength: 10 }),
    }),
  ],
  { $id: "UserAppReviewRequest" },
);

export type UserMe = Static<typeof UserMeSchema>;
export type NicknameUpdate = Static<typeof NicknameUpdateSchema>;
export type UpdateUserMeRequest = Static<typeof UpdateUserMeRequestSchema>;
export type UserPublicInfo = Static<typeof UserPublicInfoSchema>;
export type UserAppReviewRequest = Static<typeof UserAppReviewRequestSchema>;
