import { Type } from "typebox";

import { ApiResponseSchema, DateSchema, Nullable } from "../utils.js";

export const LeaderboardPeriodEnumSchema = Type.Enum(["all-time", "monthly"], {
  $id: "LeaderboardPeriodEnum",
});

export const LeaderboardQuerySchema = Type.Object(
  {
    period: LeaderboardPeriodEnumSchema,
  },
  { $id: "LeaderboardQuery" },
);

export const LeaderboardUserSchema = Type.Object(
  {
    userId: Type.String(),
    fullName: Nullable(Type.String()),
    email: Nullable(Type.String()),
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
