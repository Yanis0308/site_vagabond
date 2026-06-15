import { type Static, Type } from "typebox";

import {
  ApiResponseSchema,
  CursorPaginatedResponseSchema,
  CursorPaginationQuerySchema,
  DateSchema,
  Nullable,
} from "../utils.js";

export const LeaderboardPeriodEnumSchema = Type.Enum(["all-time", "monthly"], {
  $id: "LeaderboardPeriodEnum",
});
export type LeaderboardPeriodEnum = Static<typeof LeaderboardPeriodEnumSchema>;

export const LeaderboardQuerySchema = Type.Object(
  {
    period: LeaderboardPeriodEnumSchema,
  },
  { $id: "LeaderboardQuery" },
);

export const LeaderboardUserSchema = Type.Object(
  {
    userId: Type.String(),
    fullName: Type.String(),
    nickname: Nullable(Type.String()),
    visitedPoisCount: Type.Number(),
    rank: Type.Number(),
    registrationDate: DateSchema,
    lastVisitedPoiDate: Nullable(DateSchema),
  },
  { $id: "LeaderboardUser" },
);

export const LeaderboardResponseSchema = ApiResponseSchema(
  Type.Object({
    users: Type.Array(LeaderboardUserSchema),
    period: LeaderboardPeriodEnumSchema,
  }),
  "LeaderboardResponse",
);

// ----------------------------------------------------------------------------
// v2 : cursor pagination — /api/v2/leaderboard
// ----------------------------------------------------------------------------

export const LeaderboardV2QuerySchema = Type.Object(
  {
    period: LeaderboardPeriodEnumSchema,
    // Filtre optionnel sur le nom/nickname. Le rang renvoyé reste celui du
    // classement complet de la période (pas le rang dans les résultats filtrés).
    // Min 2 caractères pour éviter les requêtes trop larges/peu utiles ; max
    // borné pour éviter des querystrings/patterns ILIKE démesurés. Omis = pas
    // de filtre (classement complet).
    searchTerm: Type.Optional(Type.String({ minLength: 2, maxLength: 128 })),
    ...CursorPaginationQuerySchema.properties,
  },
  { $id: "LeaderboardV2Query" },
);
export type LeaderboardV2Query = Static<typeof LeaderboardV2QuerySchema>;

export const LeaderboardV2ResponseSchema = ApiResponseSchema(
  Type.Object(
    {
      ...CursorPaginatedResponseSchema(
        LeaderboardUserSchema,
        "LeaderboardV2Items",
      ).properties,
      period: LeaderboardPeriodEnumSchema,
    },
    { $id: "LeaderboardV2ResponseData" },
  ),
  "LeaderboardV2Response",
);

// ----------------------------------------------------------------------------
// /api/leaderboard/me — ma position + voisinage
// ----------------------------------------------------------------------------

export const LeaderboardMeQuerySchema = Type.Object(
  {
    period: LeaderboardPeriodEnumSchema,
  },
  { $id: "LeaderboardMeQuery" },
);
export type LeaderboardMeQuery = Static<typeof LeaderboardMeQuerySchema>;

export const LeaderboardMeResponseSchema = ApiResponseSchema(
  Type.Object(
    {
      me: Nullable(LeaderboardUserSchema),
      neighbors: Type.Array(LeaderboardUserSchema),
      period: LeaderboardPeriodEnumSchema,
    },
    { $id: "LeaderboardMeResponseData" },
  ),
  "LeaderboardMeResponse",
);

export type LeaderboardQuery = Static<typeof LeaderboardQuerySchema>;
export type LeaderboardUser = Static<typeof LeaderboardUserSchema>;
export type LeaderboardResponse = Static<typeof LeaderboardResponseSchema>;
export type LeaderboardV2Response = Static<typeof LeaderboardV2ResponseSchema>;
export type LeaderboardMeResponse = Static<typeof LeaderboardMeResponseSchema>;
