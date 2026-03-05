import { type Static, Type } from "typebox";

import { ApiResponseSchema, DateSchema, Nullable } from "../utils.js";

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

export type LeaderboardQuery = Static<typeof LeaderboardQuerySchema>;
export type LeaderboardUser = Static<typeof LeaderboardUserSchema>;
export type LeaderboardResponse = Static<typeof LeaderboardResponseSchema>;
